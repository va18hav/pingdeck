# Architecture

PingDeck is a webhook relay: it verifies provider-signed webhooks at the front door,
buffers them in PostgreSQL, then delivers them to your URLs with its own signature,
retrying failures with exponential backoff. One Go binary + one Postgres database.

## Data Flow

```text
[Provider] ──POST /api/v1/events/{endpoint_id}──► [Ingest] ──► 200 (PENDING)
                                                      │ bad/missing signature → 401, nothing stored
                                                      ▼
                                            PostgreSQL (webhook_events)
                                                      ▲ claim due events
                                                      │ FOR UPDATE SKIP LOCKED
                                            [Worker] ──POST target──► (2xx → DELIVERED,
                                                      │                4xx/5xx/timeout → RETRYING
                                                      ▼                → FAILED after max_retries)
[Dashboard UI] ◄──SSE nudge + REST fetch── [Control API]
```

## Two Doors (signatures)

A proxied webhook has two hops, so it needs two independent secrets: PingDeck verifies
the **provider** at ingest (before anything is stored), and signs every **outbound**
attempt freshly at dispatch time. Verifying at ingest (not forwarding the provider's
signature) is deliberate — provider signatures carry expiring timestamps (Stripe: 5 min),
so verification happens once, when the event arrives; retries and replays days later
never carry a stale signature.

**Front door** (`internal/ingest/verify*.go`) — one helper per provider, all shared-code
HMAC + `hmac.Equal` (constant-time compares; `==` leaks timing info). `provider: ""`
disables verification.

| Provider | Header | Signed content |
|---|---|---|
| `stripe` | `Stripe-Signature: t=...,v1=...` | `<t>.<body>` (±5 min freshness) |
| `github` | `X-Hub-Signature-256: sha256=<hex>` | `<body>` |
| `slack` | `X-Slack-Signature: v0=<hex>` | `v0:<t>:<body>` (±5 min) |
| `shopify` | `X-Shopify-Hmac-Sha256` | `<body>` (base64) |
| `woocommerce` | `X-WC-Webhook-Signature` | `<body>` (base64) |
| `razorpay` | `X-Razorpay-Signature` | `<body>` |
| `sentry` | `Sentry-Hook-Signature` | `<body>` |
| `custom` | `X-Webhook-Signature: v1=<hex>` | `<body>` — PingDeck's scheme for your own senders |

**Back door** — the worker sends a fresh header set (provider headers are never forwarded):

- `X-PingDeck-Signature: t=<unix_ts>,v1=<hex>` — HMAC-SHA256 of `<t>.<raw_body>` with the
  endpoint's `signing_secret` (`whsec_...`; generated at creation, shown once, regenerable
  via `POST /api/v1/endpoints/{id}/rotate-secret`)
- `X-PingDeck-Event-Id: <uuid>`
- `Content-Type` from the stored event

The timestamp is inside the MAC, so a receiver checking freshness knows it wasn't edited.

```js
// Verifying on your server (Node, ~6 lines)
const [t, v1] = req.headers["x-pingdeck-signature"].replace("t=", "").split(",v1=")
if (Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new Error("stale signature")
const expected = createHmac("sha256", process.env.PINGDECK_SIGNING_SECRET)
  .update(`${t}.${rawBody}`).digest("hex")
if (!timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) throw new Error("bad signature")
```

## Live Updates (SSE)

`GET /api/v1/events/stream` holds one HTTP response open per browser tab (built-in
`EventSource`). The frames are **nudge-only** — `data: {"type":"events_changed"}\n\n`,
a "refetch now" signal; real state always lives in PostgreSQL and the client refetches.
Publishers are the four code paths that change event state (Ingest, worker claim,
worker `record`, Replay) — all in one process, so the broker (`internal/api/stream.go`)
is in-memory: publishes go into a small buffer and a slow tab's nudge is dropped,
never waited on. Heartbeat comments (`: ping`) every 15 s keep proxies from reaping
idle connections. Multiple instances later → swap publishes for Postgres
`LISTEN/NOTIFY`; everything else stays identical.

## Components

| Package | Role |
|---|---|
| `internal/db` | `pgxpool`, runs `migrations/001_init.sql` at startup, plain-SQL query functions. See `docs/SCHEMA.md`. |
| `internal/ingest` | Verifies the provider signature *before* inserting (`verify.go` + one `verify_<provider>.go` each), stores the raw body unparsed (parsing would break HMAC) as `PENDING`. |
| `internal/worker` | Polls due events with `FOR UPDATE SKIP LOCKED`, delivers with a fresh signature, logs one attempt row per try, schedules the next. |
| `internal/api` | REST: endpoint CRUD (`PUT` full update, `DELETE` cascade, `rotate-secret`), event inspection, manual replay (`POST /events/{event_id}/replay`, `POST /endpoints/{endpoint_id}/replay`), SSE stream + CORS middleware. |
| `web/` | React 19 + Vite SPA — the Replay Deck UI. |

## Retries

- `max_retries` counts **all** attempts including the first; each attempt gets one row.
- Backoff: exponential `2^attempt` seconds (1s, 2s, 4s… capped at 1 h).
- `2xx` within `timeout_ms` → `DELIVERED`; otherwise retry until `attempt_count` hits
  `max_retries` → `FAILED`. The per-endpoint Slack webhook URL is stored but alert
  sending is not wired yet (planned).

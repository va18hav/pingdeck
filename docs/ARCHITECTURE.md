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


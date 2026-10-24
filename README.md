# PingDeck

[![CI](https://github.com/va18hav/pingdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/va18hav/pingdeck/actions/workflows/ci.yml)

> Fail-safe webhook proxy, automatic retry engine, and visual replay deck.

PingDeck sits between external webhook providers (Stripe, GitHub, Slack, Shopify, WooCommerce, Razorpay, Sentry) and your application services. It verifies each provider's signature at the front door, buffers events as raw bytes in PostgreSQL before forwarding, and delivers with its own fresh signature — so nothing is lost during deploys, outages, or downstream crashes.

---

## Why PingDeck?

* **Zero Dropped Webhooks:** The provider gets `200 OK` only after the event is committed to PostgreSQL in a single ACID operation.
* **No Dual-Write Bugs:** Uses PostgreSQL `FOR UPDATE SKIP LOCKED` + in-process worker nudges instead of a separate Redis queue, eliminating dual-write failures and cutting infrastructure in half.
* **Two-Door Signature Verification:** Verifies the provider's HMAC at ingest (Stripe/GitHub/Slack/Shopify/custom schemes, constant-time compares), then signs every outbound attempt freshly — never a stale provider timestamp.
* **Automatic Retries:** Downstream `4xx`/`5xx`/timeouts retry with exponential backoff (`2^attempt` seconds, capped at 1 h).
* **Visual Replay Deck:** Inspect headers, raw payloads, and downstream responses live via Server-Sent Events (SSE). Replay single or batch events with one click.
* **Single-Binary Deployment:** The Go backend (Ingestion API, Control API, Dispatch Worker) is one binary; the React dashboard builds to static assets alongside it.

---

## How It Works

```text
[Stripe / GitHub / ...]
       │
       │ 1. POST /api/v1/events/:endpoint_id (provider-signed)
       ▼
[PingDeck Ingestion API (Go)] ────► 2. Verify signature → 401 if bad (nothing stored)
       │                      ────► 3. Persist raw body (PostgreSQL) + 200 OK
       │                      ────► 4. SSE nudge → dashboard
       ▼ (SKIP LOCKED claim)
[PingDeck Dispatch Worker (Go)]
       │
       ├───► Forward with fresh X-PingDeck-Signature (2xx → DELIVERED)
       └───► On failure: RETRYING (exponential backoff) → FAILED after max_retries
```

---

## Core Stack

* **Backend (Ingest, Worker, Control API):** Go stdlib `net/http` (1.22+ routing, no web framework) + `pgx/v5`
* **Data Store & Transactional Queue:** PostgreSQL 17 (`FOR UPDATE SKIP LOCKED`)
* **Control Dashboard:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
* **Real-Time Telemetry:** Server-Sent Events (SSE)

---

## Quickstart

Run the entire stack (PostgreSQL + Go binary + dashboard) with one command:

```bash
# 1. Clone the repository
git clone https://github.com/va18hav/pingdeck.git
cd pingdeck

# 2. Build and start everything — migrations apply automatically on startup
docker compose up --build
```

Once running:
* **Replay Deck UI & Control API:** `http://localhost:8080`
* **Webhook ingestion URL:** `http://localhost:8080/api/v1/events/:endpoint_id`

## Development Mode

To work on the Go backend or React frontend with hot-reloading:

```bash
# 1. Start PostgreSQL (the only container needed in dev)
docker compose up -d db

# 2. Run the Go backend (API + worker on :8080)
go run ./cmd/pingdeck

# 3. Run the Vite dev server (on :5173, proxying API calls to :8080)
cd web && pnpm install && pnpm dev
```

## Try It

Create an endpoint in the UI, then replay a fake provider webhook with `curl`:

```bash
curl -X POST localhost:8080/api/v1/events/<endpoint_id> \
  -H 'Content-Type: application/json' \
  -d '{"amount": 2500, "currency": "inr"}'
```

## Configuration

Set `DATABASE_URL` in the environment when running outside compose; the default
falls back to the local dev Postgres (`pingdeck` / `pingdeck_password` on
`localhost:5432/pingdeck`) matching `docker-compose.yml`.

---

More detail lives in `docs/ARCHITECTURE.md` (data flow, signature schemes, SSE design) and `docs/SCHEMA.md` (tables).

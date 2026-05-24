# PingDeck

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

```bash
# 1. Clone the repository
git clone https://github.com/your-username/pingdeck.git
cd pingdeck

# 2. Start PostgreSQL 17 (the only container)
docker compose up -d

# 3. Run the Go backend — migrations apply automatically on startup
go run ./cmd/pingdeck

# 4. Run the React dashboard (separate terminal)
cd web && pnpm install && pnpm dev
```

Once running:

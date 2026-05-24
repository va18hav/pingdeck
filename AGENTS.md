# AGENTS.md — PingDeck

Webhook ingestion + delivery platform: accepts provider webhooks (Stripe/GitHub/custom,
HMAC-verified at ingest), stores events in Postgres, delivers to user-configured URLs
with a fresh PingDeck signature, retries failures with backoff, and offers a React
dashboard with event inspection + replay. Single-user tool, intentionally; auth is
deliberately deferred (deploy behind an authenticating proxy).

## Stack
- Backend: Go stdlib `net/http` (1.22+ `ServeMux`), `pgxpool` with plain SQL. No ORM, no web framework.
- Database: PostgreSQL 17 running in Docker. Queue pattern: transactional queue via `FOR UPDATE SKIP LOCKED`.
- Frontend: React 19 + TypeScript + Vite + Tailwind + shadcn/ui in `web/`.

## Commands
- Backend: `go build ./... && go vet ./...` — run after every backend change; fix the first reported error.
- Tests: `go test -v ./...`
- Frontend: `pnpm --dir web tsc --noEmit` (typecheck), `pnpm --dir web dev` (dev server).
- DB access: only via `docker exec ... psql`. Never create scratch scripts or temp programs for DB work.

## Layout (v0.x — flat)
- `cmd/pingdeck/` — entrypoint + route registration
- `internal/db/` — pool, `migrations/` (edit `001_init.sql` in place; dev DB gets dropped + recreated), SQL queries
- `internal/ingest/` — `POST /api/v1/events/{endpoint_id}` (ingestion) + inbound signature verification
- `internal/worker/` — dispatcher, retry loop, outbound signing (`sign.go`)
- `internal/api/` — dashboard REST handlers + SSE
- `web/` — React SPA, feature folders (`features/<name>/` with `hooks.ts`, `components/`)

## Conventions
- Beginner-readable Go: simple structs, plain SQL, stdlib first. No premature abstractions/interfaces.
- Never log or return secrets: `signing_secret` is returned once in the create response, never in GET/list. `inbound_secret` never leaves the DB.
- All API routes use the `/api/v1` prefix; unknown IDs → translate `pgx.ErrNoRows` to 404, not 500.
- Ask before `go get` or `pnpm add`.

## Docs
- Keep `docs/SCHEMA.md` and `docs/ARCHITECTURE.md` in sync when schema or flow changes.


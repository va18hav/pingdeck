# Benchmarks

Methodology and results for PingDeck's performance numbers. Everything here is
reproducible: the stack runs on one `docker compose up --build`, and the load
generator is a single committed script.

## Environment

| Item | Value |
|---|---|
| Host | Apple A18 Pro (as reported by `sysctl machdep.cpu.brand_string`) |
| Docker | Docker Desktop 29.8.2 |
| Stack | Postgres 17-alpine + PingDeck (`scratch` image, `CGO_ENABLED=0`) |
| Load generator | vegeta 12.13.0, run on the host |
| Payload | 1,281 B Stripe-shaped `charge.succeeded` JSON (`bench/body.json`) |
| Endpoint | `provider: ""` (no inbound verification) — measures verify-slot + insert path |

## What is measured

**Ingest latency** — the time from "provider sends a webhook" to "provider gets
its response": raw body read, headers marshaled to JSONB, one ACID `INSERT`
into `webhook_events`. This is the latency providers experience, which is why
it matters: slow ingest responses cause provider-side retries (duplicates) and
webhook disablement.

Rate-paced attacks (open-loop) at 100/250/500/1000 req/s, 30 s window each,
3 trials per rate, warmup discarded. Values below are the **median across trials**.

## Results — Worker delivery throughput (before / after parallelization)

Baseline: sequential worker (one delivery at a time, claim batch of 10 every
5 s tick). After: adaptive drain loop (a full claim batch of 50 triggers an
immediate re-claim instead of sleeping) with a bounded pool of 8 dispatch
goroutines per batch. Events seeded as PENDING rows with `next_retry_at = NOW()`,
target = the app's own `/healthz` (fast local sink), timing = wall clock until
every event is `DELIVERED` (`bench/delivery.sh`).

| Worker | Events | Drain time | Throughput |
|---|---|---|---|
| sequential (before) | 100 | 48 s | **2.1 events/s** |
| pool of 8 + drain loop (after) | 5000 | 1–3 s | **1666–5000 events/s** |

~800× improvement in backlog drain rate. The queue-correctness claim is
unchanged: each event is still claimed exactly once via `FOR UPDATE SKIP
LOCKED`, so concurrent delivery of different events stays safe and duplicate
deliveries remain impossible.

## Results — `POST /api/v1/events/{endpoint_id}`

| Rate | p50 | p95 | p99 | Success | Throughput |
|---|---|---|---|---|---|
| 100 rps | 3.7 ms | 7.1 ms | 22.9 ms | 100% | 100.0 rps |
| 250 rps | 2.5 ms | 5.4 ms | 25.2 ms | 100% | 250.0 rps |
| 500 rps | 1.2 ms | 5.4 ms | 44.4 ms | 100% | 500.0 rps |
| 1000 rps | 0.83 ms | 3.8 ms | 39.1 ms | 100% | 1000.0 rps |

Observations:

- p50 *improves* with rate — at higher rates more requests ride already-warm
  keep-alive connections; the cold-connection cost lands in the tail.
- No saturation below 1000 rps on this hardware: throughput matched the
  injected rate exactly with zero failures at every level.
- The p99 tail is dominated by Postgres fsync jitter inside Docker Desktop's
  VM (visible in `max` values of 70–220 ms in raw reports).

## Reproduce

```bash
docker compose up --build -d          # start the stack
# create a bench endpoint (or reuse one) and point TARGETS at it:
EP=$(curl -s -X POST localhost:8080/api/v1/endpoints -H 'Content-Type: application/json' \
  -d '{"name":"bench-ingest","target_url":"http://localhost:8080/healthz","provider":"","inbound_secret":"","max_retries":5,"timeout_ms":10000,"slack_webhook_url":""}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["ID"])')
sed -i '' "s|/api/v1/events/.*|/api/v1/events/$EP|" bench/ingest-targets.txt

bench/run.sh                          # ~6.5 min: warmup + 12 runs
```

Raw per-trial reports are written to `bench/reports/` (gitignored).

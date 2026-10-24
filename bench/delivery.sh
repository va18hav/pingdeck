#!/usr/bin/env bash
# Delivery-throughput benchmark: seeds N due events, then times how long the
# worker pool takes to drain them (every event reaching DELIVERED).
#
# Usage: bench/delivery.sh [N events] [endpoint_id]
# Prereq: full stack up (docker compose up --build). The endpoint's target_url
# should point at a fast local sink (the app's own /healthz).
set -euo pipefail
N=${1:-5000}
EP=${2:?endpoint_id required}

q() { docker exec pingdeck-db psql -U pingdeck -d pingdeck -tA -c "$1"; }

q "TRUNCATE webhook_events, delivery_attempts CASCADE;" >/dev/null
q "INSERT INTO webhook_events (endpoint_id, headers, raw_body, content_type)
   SELECT '$EP', '{}', convert_to(repeat('x',1281),'UTF8'), 'application/json'
   FROM generate_series(1,$N);" >/dev/null
echo "seeded $N due events"

START=$(date +%s)
for i in $(seq 1 240); do
  DONE=$(q "SELECT count(*) FROM webhook_events WHERE endpoint_id='$EP' AND status='DELIVERED';")
  if [ "$DONE" -ge "$N" ]; then break; fi
  sleep 0.5
done
END=$(date +%s)

echo "drained $N events in $((END-START))s -> $(python3 -c "print(round($N/($END-$START),1))") events/sec"

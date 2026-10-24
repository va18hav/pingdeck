#!/usr/bin/env bash
# Ingest benchmark: p50/p95/p99 latency of the webhook ingest door
# (signature slot + headers marshal + single ACID insert) at fixed rates.
#
# Usage: TARGETS=bench/ingest-targets.txt bench/run.sh
# Prereq: full stack up (docker compose up --build) + vegeta on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

TARGETS=${TARGETS:-bench/ingest-targets.txt}
RATES=${RATES:-"100 250 500 1000"}
TRIALS=${TRIALS:-3}
DURATION=${DURATION:-30s}
mkdir -p bench/reports

echo "== warmup (discarded) =="
vegeta attack -targets "$TARGETS" -rate 50/1s -duration 10s > bench/reports/warmup.bin
vegeta report -type text bench/reports/warmup.bin

for rate in $RATES; do
  for trial in $(seq "$TRIALS"); do
    out="bench/reports/ingest-${rate}rps-t${trial}"
    echo "== rate ${rate}/1s, trial ${trial} =="
    vegeta attack -targets "$TARGETS" -rate "${rate}/1s" -duration "$DURATION" > "$out.bin"
    vegeta report -type text "$out.bin" | tee "$out.txt"
  done
done

echo "== done — results in bench/reports/ =="

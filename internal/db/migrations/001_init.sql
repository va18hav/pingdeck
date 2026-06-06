-- 001_init.sql — Initial PingDeck schema.
-- PostgreSQL 17 acts as both the system of record and the transactional job queue.
-- Idempotent: safe to re-run (IF NOT EXISTS / guarded enum creation).

CREATE TABLE IF NOT EXISTS endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT '',
    inbound_secret TEXT,
    signing_secret TEXT NOT NULL UNIQUE,
    max_retries INT NOT NULL DEFAULT 5,
    timeout_ms INT NOT NULL DEFAULT 10000,
    slack_webhook_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event lifecycle enum. CREATE TYPE is not idempotent, so guard it in a
-- DO block that swallows the "already exists" error (42P16 duplicate_object).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE event_status AS ENUM (
            'PENDING',
            'PROCESSING',
            'DELIVERED',
            'RETRYING',
            'FAILED'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    headers JSONB NOT NULL,
    raw_body BYTEA NOT NULL,
    content_type TEXT,
    status event_status NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index covering only queue-eligible rows; the worker claim query
-- (FOR UPDATE SKIP LOCKED) scans exactly this subset.
CREATE INDEX IF NOT EXISTS idx_webhook_events_queue
ON webhook_events (next_retry_at ASC)
WHERE status IN ('PENDING', 'RETRYING');

-- Index for dashboard queries filtered by endpoint and time.
CREATE INDEX IF NOT EXISTS idx_webhook_events_endpoint_created
ON webhook_events (endpoint_id, created_at DESC);

CREATE TABLE IF NOT EXISTS delivery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    response_status INT,
    response_headers JSONB,
    response_body TEXT,
    execution_time_ms INT NOT NULL,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_event_id
ON delivery_attempts (event_id, attempt_number DESC);

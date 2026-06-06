package db

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Status mirrors the event_status enum in Postgres.
type Status string

const (
	StatusPending    Status = "PENDING"
	StatusProcessing Status = "PROCESSING"
	StatusDelivered  Status = "DELIVERED"
	StatusRetrying   Status = "RETRYING"
	StatusFailed     Status = "FAILED"
)

// WebhookEvent mirrors one row of webhook_events; RawBody is stored
// unparsed so stored HMAC signatures stay verifiable.
type WebhookEvent struct {
	ID           string
	EndpointID   string
	Headers      json.RawMessage
	RawBody      []byte
	ContentType  string
	Status       Status
	AttemptCount int
	NextRetryAt  time.Time
	LockedAt     time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type EventWithAttempts struct {
	Event    WebhookEvent    `json:"event"`
	Attempts json.RawMessage `json:"attempts"`
}

// CreateEvent inserts a new event as PENDING; an FK violation (endpoint
// deleted mid-flight) surfaces as ErrNotFound.
func (s *Store) CreateEvent(ctx context.Context, w *WebhookEvent) (*WebhookEvent, error) {
	sql := InsertEventString()
	row := s.pool.QueryRow(ctx, sql, w.EndpointID, w.Headers, w.RawBody, w.ContentType)
	err := row.Scan(&w.ID, &w.Status, &w.AttemptCount, &w.NextRetryAt, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return w, nil
}

// ClaimDueEvents atomically claims up to limit due events —
// FOR UPDATE SKIP LOCKED in the CTE flips them to PROCESSING so concurrent
// workers (or a second instance) never double-deliver.
func (s *Store) ClaimDueEvents(ctx context.Context, limit int) ([]WebhookEvent, error) {
	sql := ClaimEventString()
	rows, err := s.pool.Query(ctx, sql, limit)
	if err != nil {
		return nil, err
	}
	dueEvents := []WebhookEvent{}
	defer rows.Close()
	for rows.Next() {
		var we WebhookEvent
		if err := rows.Scan(&we.ID, &we.EndpointID, &we.Headers, &we.RawBody, &we.ContentType, &we.AttemptCount); err != nil {
			return nil, err
		}
		dueEvents = append(dueEvents, we)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return dueEvents, nil
}

// ListEvents filters with NULL-swap params and paginates by the
// (created_at, id) keyset cursor before/beforeID.
func (s *Store) ListEvents(ctx context.Context, endpointID, status *string, limit int, before *time.Time, beforeID *string) ([]WebhookEvent, error) {
	sql := ListEventsString()
	rows, err := s.pool.Query(ctx, sql, endpointID, status, limit, before, beforeID)
	if err != nil {
		return nil, err
	}
	events := []WebhookEvent{}
	defer rows.Close()
	for rows.Next() {
		var we WebhookEvent
		if err := rows.Scan(&we.ID, &we.EndpointID, &we.Headers, &we.RawBody, &we.ContentType, &we.Status, &we.AttemptCount, &we.NextRetryAt, &we.CreatedAt, &we.UpdatedAt); err != nil {
			return nil, err
		}
		events = append(events, we)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return events, nil
}

// ErrNotFound wraps "no such row" for handlers to translate into 404s.
var ErrNotFound = errors.New("no matching row")

func (s *Store) GetEventWithAttempts(ctx context.Context, id string) (*EventWithAttempts, error) {
	sql := GetEventWithAttemptsString()
	row := s.pool.QueryRow(ctx, sql, id)
	var ewa EventWithAttempts
	err := row.Scan(
		&ewa.Event.ID, &ewa.Event.EndpointID, &ewa.Event.Headers, &ewa.Event.RawBody,
		&ewa.Event.ContentType, &ewa.Event.Status, &ewa.Event.AttemptCount,
		&ewa.Event.NextRetryAt, &ewa.Event.CreatedAt, &ewa.Event.UpdatedAt,
		&ewa.Attempts,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &ewa, nil
}

// ReplayEvent resets a FAILED event to PENDING with counters cleared;
// only FAILED events are replayable (the WHERE clause guards it).
func (s *Store) ReplayEvent(ctx context.Context, id string) (*WebhookEvent, error) {
	sql := ReplayEventString()
	row := s.pool.QueryRow(ctx, sql, id)
	var we WebhookEvent
	err := row.Scan(&we.ID, &we.Status, &we.AttemptCount, &we.NextRetryAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &we, nil
}

// ReplayEndpointEvents batch-resets all FAILED events on one endpoint and
// returns how many were reset (0 = nothing FAILED, a normal result).
func (s *Store) ReplayEndpointEvents(ctx context.Context, endpointID string) (int, error) {
	rows, err := s.pool.Query(ctx, ReplayEndpointString(), endpointID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var we WebhookEvent
		if err := rows.Scan(&we.ID, &we.Status, &we.AttemptCount, &we.NextRetryAt); err != nil {
			return 0, err
		}
		count++
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	return count, nil
}

func InsertEventString() string {
	return `
	INSERT INTO webhook_events (endpoint_id, headers, raw_body, content_type)
	VALUES ($1, $2, $3, $4)
	RETURNING id, status, attempt_count, next_retry_at, created_at, updated_at
	`
}

func ClaimEventString() string {
	return `
	WITH due_events AS(
		SELECT id
		FROM webhook_events
		WHERE status IN ('PENDING', 'RETRYING')
			AND next_retry_at <= NOW()
		ORDER BY next_retry_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED
	)
	UPDATE webhook_events e
	SET status = 'PROCESSING',
		locked_at = NOW(),
		updated_at = NOW()
	FROM due_events
	WHERE e.id = due_events.id
	RETURNING e.id, e.endpoint_id, e.headers, e.raw_body, e.content_type, e.attempt_count
	`
}

func ListEventsString() string {
	return `
	SELECT id, endpoint_id, headers, raw_body, content_type, status, attempt_count, next_retry_at, created_at, updated_at
	FROM webhook_events
	WHERE ($1::uuid IS NULL OR endpoint_id = $1::uuid)
	  AND ($2::event_status IS NULL OR status = $2::event_status)
	  AND ($4::timestamptz IS NULL OR (created_at, id) < ($4::timestamptz, $5::uuid))
	ORDER BY created_at DESC, id DESC
	LIMIT $3
	`
}

func ReplayEventString() string {
	return `
	UPDATE webhook_events
	SET status = 'PENDING',
	    attempt_count = 0,
	    next_retry_at = NOW(),
	    updated_at = NOW(),
	    locked_at = NULL
	WHERE id = $1 AND status IN ('FAILED')
	RETURNING id, status, attempt_count, next_retry_at
	`
}

func ReplayEndpointString() string {
	return `
	UPDATE webhook_events
	SET status = 'PENDING',
	    attempt_count = 0,
	    next_retry_at = NOW(),
	    updated_at = NOW(),
	    locked_at = NULL
	WHERE endpoint_id = $1 AND status IN ('FAILED')
	RETURNING id, status, attempt_count, next_retry_at
	`
}

func GetEventWithAttemptsString() string {
	return `
	SELECT e.id, e.endpoint_id, e.headers, e.raw_body, e.content_type, e.status,
	       e.attempt_count, e.next_retry_at, e.created_at, e.updated_at,
	       COALESCE(
	           json_agg(a.* ORDER BY a.attempt_number DESC) FILTER (WHERE a.id IS NOT NULL),
	           '[]'::json
	       ) AS attempts
	FROM webhook_events e
	LEFT JOIN delivery_attempts a ON a.event_id = e.id
	WHERE e.id = $1
	GROUP BY e.id
	`
}

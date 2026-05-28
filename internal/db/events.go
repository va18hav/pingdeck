package db

import (
	"context"
	"encoding/json"
	"time"
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

func (s *Store) CreateEvent(ctx context.Context, w *WebhookEvent) (*WebhookEvent, error) {
	sql := InsertEventString()
	row := s.pool.QueryRow(ctx, sql, w.EndpointID, w.Headers, w.RawBody, w.ContentType)
	err := row.Scan(&w.ID, &w.Status, &w.AttemptCount, &w.NextRetryAt, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return w, nil
}

func InsertEventString() string {
	return `
	INSERT INTO webhook_events (endpoint_id, headers, raw_body, content_type)
	VALUES ($1, $2, $3, $4)
	RETURNING id, status, attempt_count, next_retry_at, created_at, updated_at
	`
}

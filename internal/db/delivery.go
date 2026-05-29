package db

import (
	"context"
	"encoding/json"
	"time"
)

// DeliveryResult carries what one delivery attempt did; the worker fills
// it after the outbound request finishes. RespStatus is 0 when no HTTP
// response arrived (transport failure — see ErrorMsg).
type DeliveryResult struct {
	EventID     string
	Status      Status
	NextRetryAt time.Time
	RespStatus  int
	RespHeaders json.RawMessage
	RespBody    string
	ExecMS      int
	ErrorMsg    string
}

// LogDelivery updates the event (status, attempt_count, next_retry_at) and
// inserts the attempt row in one statement — the CTE reuses the new
// attempt_count for the inserted row.
func (s *Store) LogDelivery(ctx context.Context, r DeliveryResult) error {
	_, err := s.pool.Exec(ctx, LogDeliveryString(),
		r.Status, r.NextRetryAt, r.EventID, r.RespStatus, r.RespHeaders, r.RespBody, r.ExecMS, r.ErrorMsg)
	return err
}

func LogDeliveryString() string {
	return `
	WITH updated AS (
		UPDATE webhook_events
		SET status = $1,
		    attempt_count = attempt_count + 1,
		    next_retry_at = $2,
		    updated_at = NOW()
		WHERE id = $3
		RETURNING id, attempt_count
	)
	INSERT INTO delivery_attempts
	    (event_id, attempt_number, response_status, response_headers, response_body, execution_time_ms, error_message)
	SELECT id, attempt_count, $4, $5, $6, $7, $8
	FROM updated
	`
}

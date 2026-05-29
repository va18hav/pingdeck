package worker

import (
	"pingdeck/internal/db"
	"time"
)

// nextStatus decides the event's fate after a failed attempt.
// max_retries counts ALL attempts, including the first one.
func nextStatus(ep *db.Endpoint, ev *db.WebhookEvent) db.Status {
	if ev.AttemptCount+1 >= ep.MaxRetries {
		return db.StatusFailed
	}
	return db.StatusRetrying
}

// backoffDelay returns the retry delay for attempt N: exponential 2^attempt seconds.
func backoffDelay(attempt int) time.Duration {
	return time.Duration(1<<attempt) * time.Second
}

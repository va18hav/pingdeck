package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"pingdeck/internal/api"
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

// backoffDelay returns the retry delay for attempt N: exponential 2^attempt
// seconds, capped at 1 hour so retries stay predictable.
func backoffDelay(attempt int) time.Duration {
	d := time.Duration(1<<attempt) * time.Second
	if d > time.Hour {
		return time.Hour
	}
	return d
}

// Deliver performs one outbound attempt against the endpoint's target URL.
func (w *Worker) Deliver(ctx context.Context, ev *db.WebhookEvent) error {
	ep, err := w.store.GetEndpoint(ctx, ev.EndpointID)
	if err != nil {
		return err
	}

	start := time.Now()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ep.TargetURL, bytes.NewReader(ev.RawBody))
	if err != nil {
		return err
	}

	// Fresh header set — provider headers are never forwarded (hop-by-hop
	// ones would lie, and the provider's signature goes stale on retry).
	req.Header.Set("Content-Type", ev.ContentType)
	req.Header.Set("X-PingDeck-Signature", signPayload(ep.SigningSecret, ev.RawBody))
	req.Header.Set("X-PingDeck-Event-Id", ev.ID)

	client := http.Client{Timeout: time.Duration(ep.TimeoutMS) * time.Millisecond}
	resp, err := client.Do(req)
	execMS := int(time.Since(start).Milliseconds())

	// Transport failure (timeout, refused, DNS) still counts as an attempt.
	if err != nil {
		return w.record(ctx, ep, ev, db.DeliveryResult{
			EventID:     ev.ID,
			Status:      nextStatus(ep, ev),
			NextRetryAt: time.Now().Add(backoffDelay(ev.AttemptCount)),
			ExecMS:      execMS,
			ErrorMsg:    err.Error(),
		})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	respHeaders, _ := json.Marshal(resp.Header)

	status := db.StatusDelivered
	nextRetryAt := time.Now()
	if failed := resp.StatusCode < 200 || resp.StatusCode >= 300; failed {
		status = nextStatus(ep, ev)
		nextRetryAt = time.Now().Add(backoffDelay(ev.AttemptCount))
	}

	result := db.DeliveryResult{
		EventID:     ev.ID,
		Status:      status,
		NextRetryAt: nextRetryAt,
		RespStatus:  resp.StatusCode,
		RespHeaders: respHeaders,
		RespBody:    string(respBody),
		ExecMS:      execMS,
	}
	return w.record(ctx, ep, ev, result)
}

// record logs one attempt row, flips the event status, and nudges dashboards.
func (w *Worker) record(ctx context.Context, ep *db.Endpoint, ev *db.WebhookEvent, r db.DeliveryResult) error {
	if err := w.store.LogDelivery(ctx, r); err != nil {
		return err
	}
	w.broker.Publish(api.NudgeEventsChanged)
	log.Printf("event %s -> %s attempt: %s (resp=%d, exec=%dms, next=%s)",
		ev.ID, ep.Name, r.Status, r.RespStatus, r.ExecMS, r.NextRetryAt.Format("03:04:05PM"))
	return nil
}

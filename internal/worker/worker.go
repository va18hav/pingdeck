package worker

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"pingdeck/internal/api"
	"pingdeck/internal/db"
)

const (
	// claimBatch is how many due events one claim round takes. A full batch
	// means the queue has more work — claim again immediately; a short batch
	// means the queue is drained and it's safe to sleep.
	claimBatch = 50

	// pollInterval is the idle wait between claim rounds once the queue is empty.
	pollInterval = 5 * time.Second

	// dispatchWorkers bounds concurrent outbound deliveries within a batch.
	dispatchWorkers = 8
)

// Worker polls Postgres for due events and delivers them.
type Worker struct {
	store  *db.Store
	broker *api.Broker
}

func NewWorker(store *db.Store, broker *api.Broker) *Worker {
	return &Worker{store: store, broker: broker}
}

// Start is the main loop: claim due events, deliver them with a bounded
// pool, and nudge dashboard tabs so status flips show up live. Claiming is
// atomic (FOR UPDATE SKIP LOCKED), so a full batch -> claim again right away;
// a short batch -> sleep until the next tick.
func (w *Worker) Start(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		events, err := w.store.ClaimDueEvents(ctx, claimBatch)
		if err != nil {
			log.Println("claim failed:", err)
			time.Sleep(pollInterval)
			continue
		}

		if len(events) > 0 {
			fmt.Println("Worker claimed", len(events), "events")
			w.broker.Publish(api.NudgeEventsChanged)
		}

		w.deliverBatch(ctx, events)

		if len(events) < claimBatch {
			time.Sleep(pollInterval)
		}
	}
}

// deliverBatch fans a claimed batch out to a bounded pool of dispatch
// goroutines and waits for the whole batch to settle before claiming again.
func (w *Worker) deliverBatch(ctx context.Context, events []db.WebhookEvent) {
	var wg sync.WaitGroup
	sem := make(chan struct{}, dispatchWorkers)
	for _, ev := range events {
		wg.Add(1)
		sem <- struct{}{}
		go func(ev db.WebhookEvent) {
			defer wg.Done()
			defer func() { <-sem }()
			if err := w.Deliver(ctx, &ev); err != nil {
				log.Println("dispatch failed:", err)
			}
		}(ev)
	}
	wg.Wait()
}

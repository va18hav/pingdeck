package worker

import (
	"context"
	"fmt"
	"log"
	"pingdeck/internal/api"
	"pingdeck/internal/db"
	"time"
)

// Worker polls Postgres for due events and delivers them.
type Worker struct {
	store  *db.Store
	broker *api.Broker
}

func NewWorker(store *db.Store, broker *api.Broker) *Worker {
	return &Worker{store: store, broker: broker}
}

// Start is the main loop: every 5s, claim due events, nudge dashboard tabs
// so the PENDING → PROCESSING flip shows up, then deliver each one.
func (w *Worker) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			events, err := w.store.ClaimDueEvents(ctx, 10)
			if err != nil {
				log.Println("claim failed:", err)
				continue
			}
			fmt.Println("Worker claimed", len(events), "events")
			w.broker.Publish(api.NudgeEventsChanged)
			for _, ev := range events {
				if err := w.Deliver(ctx, &ev); err != nil {
					log.Println("dispatch failed", err)
					continue
				}
			}
		}
	}
}

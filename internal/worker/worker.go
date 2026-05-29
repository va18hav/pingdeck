package worker

import (
	"context"
	"fmt"
	"log"
	"pingdeck/internal/db"
	"time"
)

// Worker polls Postgres for due events and delivers them.
type Worker struct {
	store *db.Store
}

func NewWorker(store *db.Store) *Worker {
	return &Worker{store: store}
}

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
			for _, ev := range events {
				if err := w.Deliver(ctx, &ev); err != nil {
					log.Println("dispatch failed", err)
					continue
				}
			}
		}
	}
}

// Package api holds the dashboard REST handlers and the SSE broker.
package api

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Broker is an in-process pub/sub for SSE nudges. Safe because ingest,
// worker, and API share one process; multi-instance deploys would swap
// this for Postgres LISTEN/NOTIFY.
type Broker struct {
	mu   sync.Mutex
	subs map[chan string]struct{}
}

func NewBroker() *Broker {
	return &Broker{subs: make(map[chan string]struct{})}
}

// Subscribe registers a buffered channel; cancel unregisters it.
func (b *Broker) Subscribe() (ch chan string, cancel func()) {
	ch = make(chan string, 16)
	b.mu.Lock()
	b.subs[ch] = struct{}{}
	b.mu.Unlock()
	cancel = func() {
		b.mu.Lock()
		delete(b.subs, ch)
		b.mu.Unlock()
	}
	return ch, cancel
}

// Publish sends to every subscriber, dropping messages for slow ones —
// it must never block the worker.
func (b *Broker) Publish(msg string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for ch := range b.subs {
		select {
		case ch <- msg:
		default:
		}
	}
}

// Stream holds one SSE connection open: nudge frames on demand, heartbeat
// comments every 15s, exits when the client disconnects.
func (b *Broker) Stream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch, cancel := b.Subscribe()
	defer cancel()

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case msg := <-ch:
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-heartbeat.C:
			fmt.Fprint(w, ": ping\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

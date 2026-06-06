package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"pingdeck/internal/db"
	"pingdeck/internal/ingest"
	"strconv"
	"time"
)

// NudgeEventsChanged is the only SSE frame type: "refetch now", no payload.
const NudgeEventsChanged = `{"type":"events_changed"}`

type EventHandler struct {
	store  *db.Store
	broker *Broker
}

func NewEvent(store *db.Store, broker *Broker) *EventHandler {
	return &EventHandler{store: store, broker: broker}
}

// Ingest is the public front door: verify the provider signature BEFORE
// storing anything, then persist the raw body unparsed and nudge dashboards.
func (h *EventHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	EndpointID := r.PathValue("endpoint_id")

	ep, err := h.store.GetEndpoint(r.Context(), EndpointID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			http.Error(w, "Endpoint not found", http.StatusNotFound)
			return
		}
		log.Printf("error fetching endpoint for ingest: %v", err)
		http.Error(w, "Failed to process the event", http.StatusInternalServerError)
		return
	}

	raw, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to parse the raw_body: %v", err)
		http.Error(w, "Failed to parse the event", http.StatusInternalServerError)
		return
	}

	if ep.Provider != "" {
		if err := ingest.VerifyInbound(ep.Provider, ep.InboundSecret, r.Header, raw); err != nil {
			log.Printf("ingest verification failed for endpoint %s: %v", EndpointID, err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}

	headersJSON, err := json.Marshal(r.Header)
	if err != nil {
		log.Printf("Failed to parse the header: %v", err)
		http.Error(w, "Failed to parse the event", http.StatusInternalServerError)
		return
	}
	we := db.WebhookEvent{
		EndpointID:  EndpointID,
		Headers:     headersJSON,
		RawBody:     raw,
		ContentType: r.Header.Get("Content-Type"),
	}
	event, err := h.store.CreateEvent(r.Context(), &we)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			http.Error(w, "Endpoint not found", http.StatusNotFound)
			return
		}
		log.Printf("error creating the event: %v", err)
		http.Error(w, "Failed to create the event", http.StatusInternalServerError)
		return
	}

	h.broker.Publish(NudgeEventsChanged)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)

	if err := json.NewEncoder(w).Encode(event); err != nil {
		log.Printf("error encoding event response: %v", err)
		http.Error(w, "Error encoding the event", http.StatusInternalServerError)
		return
	}

}

func (h *EventHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("event_id")
	ewa, err := h.store.GetEventWithAttempts(r.Context(), id)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}
		log.Printf("error fetching the event: %v", err)
		http.Error(w, "Failed to fetch the event", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(ewa); err != nil {
		log.Printf("error encoding event response: %v", err)
		http.Error(w, "Error encoding the event", http.StatusInternalServerError)
		return
	}
}

// Replay resets a FAILED event to PENDING so the worker reclaims it.
func (h *EventHandler) Replay(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("event_id")
	we, err := h.store.ReplayEvent(r.Context(), id)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			http.Error(w, "Event not found or not replayable", http.StatusNotFound)
			return
		}
		log.Printf("error replaying the event: %v", err)
		http.Error(w, "Failed to replay the event", http.StatusInternalServerError)
		return
	}

	h.broker.Publish(NudgeEventsChanged)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	if err := json.NewEncoder(w).Encode(we); err != nil {
		log.Printf("error encoding replay response: %v", err)
		http.Error(w, "Error encoding the event", http.StatusInternalServerError)
		return
	}
}

// ReplayEndpoint batch-resets every FAILED event on one endpoint to PENDING.
func (h *EventHandler) ReplayEndpoint(w http.ResponseWriter, r *http.Request) {
	endpointID := r.PathValue("endpoint_id")
	if !isValidUUID(endpointID) {
		http.Error(w, "Invalid endpoint id", http.StatusBadRequest)
		return
	}

	n, err := h.store.ReplayEndpointEvents(r.Context(), endpointID)
	if err != nil {
		log.Printf("error batch-replaying events for endpoint %s: %v", endpointID, err)
		http.Error(w, "Failed to replay the events", http.StatusInternalServerError)
		return
	}

	h.broker.Publish(NudgeEventsChanged)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	if err := json.NewEncoder(w).Encode(map[string]int{"replayed": n}); err != nil {
		log.Printf("error encoding batch replay response: %v", err)
		http.Error(w, "Error encoding the response", http.StatusInternalServerError)
		return
	}
}

// isValidUUID guards query/path params that flow into SQL casts; malformed
// input gets a 400 instead of a 500 from Postgres.
func isValidUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			isHex := (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
			if !isHex {
				return false
			}
		}
	}
	return true
}

// List supports ?endpoint_id=&status=&limit=&before=&before_id= filters;
// before/before_id form the keyset cursor for "Load more".
func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	var endpointID, status *string
	if v := q.Get("endpoint_id"); v != "" {
		if !isValidUUID(v) {
			http.Error(w, "endpoint_id must be a UUID", http.StatusBadRequest)
			return
		}
		endpointID = &v
	}
	if v := q.Get("status"); v != "" {
		switch db.Status(v) {
		case db.StatusPending, db.StatusProcessing, db.StatusDelivered, db.StatusRetrying, db.StatusFailed:
			status = &v
		default:
			http.Error(w, "Invalid status filter", http.StatusBadRequest)
			return
		}
	}
	limit := 50
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 200 {
			http.Error(w, "limit must be an integer in 1..200", http.StatusBadRequest)
			return
		}
		limit = n
	}

	var before *time.Time
	var beforeID *string
	if v := q.Get("before"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			http.Error(w, "before must be an RFC3339 timestamp", http.StatusBadRequest)
			return
		}
		id := q.Get("before_id")
		if id == "" {
			http.Error(w, "before_id is required together with before", http.StatusBadRequest)
			return
		}
		if !isValidUUID(id) {
			http.Error(w, "before_id must be a UUID", http.StatusBadRequest)
			return
		}
		before, beforeID = &t, &id
	} else if q.Get("before_id") != "" {
		http.Error(w, "before_id is only valid together with before", http.StatusBadRequest)
		return
	}

	events, err := h.store.ListEvents(r.Context(), endpointID, status, limit, before, beforeID)
	if err != nil {
		log.Printf("error fetching the events: %v", err)
		http.Error(w, "Failed to fetch the events", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(events); err != nil {
		log.Printf("error encoding events response: %v", err)
		http.Error(w, "Error encoding the events", http.StatusInternalServerError)
		return
	}
}

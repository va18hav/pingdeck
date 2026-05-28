package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"pingdeck/internal/db"
)

type EventHandler struct {
	store *db.Store
}

func NewEvent(store *db.Store) *EventHandler {
	return &EventHandler{store: store}
}

func (h *EventHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	EndpointID := r.PathValue("endpoint_id")
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to parse the raw_body: %v", err)
		http.Error(w, "Failed to parse the event", http.StatusInternalServerError)
		return
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
		log.Printf("error creating the event: %v", err)
		http.Error(w, "Failed to create the event", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	if err := json.NewEncoder(w).Encode(event); err != nil {
		log.Printf("error encoding event response: %v", err)
		http.Error(w, "Error encoding the event", http.StatusInternalServerError)
	}
}

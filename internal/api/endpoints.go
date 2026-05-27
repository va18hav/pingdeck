package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"

	"pingdeck/internal/db"
)

// EndpointHandler serves the /api/v1/endpoints CRUD surface.
type EndpointHandler struct {
	store *db.Store
}

type CreateEndpointRequest struct {
	Name            string `json:"name"`
	TargetURL       string `json:"target_url"`
	Provider        string `json:"provider"`
	InboundSecret   string `json:"inbound_secret"`
	MaxRetries      int    `json:"max_retries"`
	TimeoutMS       int    `json:"timeout_ms"`
	SlackWebhookURL string `json:"slack_webhook_url"`
}

func NewEndpoint(store *db.Store) *EndpointHandler {
	return &EndpointHandler{store: store}
}

// generateSigningSecret returns "whsec_" + 32 crypto/rand bytes as hex.
func generateSigningSecret() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return "whsec_" + hex.EncodeToString(buf), nil
}

func (h *EndpointHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateEndpointRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("error decoding endpoint request: %v", err)
		http.Error(w, "Error decoding the endpoint", http.StatusBadRequest)
		return
	}
	signingSecret, err := generateSigningSecret()
	if err != nil {
		log.Printf("error generating the signing secret: %v", err)
		http.Error(w, "Failed to generate the signing secret", http.StatusInternalServerError)
		return
	}
	ep := db.Endpoint{
		Name:            req.Name,
		TargetURL:       req.TargetURL,
		Provider:        req.Provider,
		InboundSecret:   req.InboundSecret,
		SigningSecret:   signingSecret,
		MaxRetries:      req.MaxRetries,
		TimeoutMS:       req.TimeoutMS,
		SlackWebhookURL: req.SlackWebhookURL,
	}
	endpoint, err := h.store.CreateEndpoint(r.Context(), &ep)
	if err != nil {
		log.Printf("error creating the endpoint: %v", err)
		http.Error(w, "Failed to create the endpoint", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(endpoint); err != nil {
		log.Printf("error encoding endpoint response: %v", err)
		http.Error(w, "Error encoding the endpoint", http.StatusInternalServerError)
	}
}

func (h *EndpointHandler) List(w http.ResponseWriter, r *http.Request) {
	endpoints, err := h.store.ListEndpoints(r.Context())
	if err != nil {
		log.Printf("error fetching endpoints: %v", err)
		http.Error(w, "Failed to fetch endpoints", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(endpoints); err != nil {
		log.Printf("error encoding endpoints response: %v", err)
		http.Error(w, "error encoding endpoints response", http.StatusInternalServerError)
	}
}

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

type EndpointResponse struct {
	ID                  string
	Name                string
	TargetURL           string
	Provider            string
	InboundSecret       string
	SigningSecretMasked string
	MaxRetries          int
	TimeoutMS           int
	SlackWebhookURL     string
	IsActive            bool
	CreatedAt           string
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

func (h *EndpointHandler) Get(w http.ResponseWriter, r *http.Request) {
	EndpointID := r.PathValue("id")
	endpoint, err := h.store.GetEndpoint(r.Context(), EndpointID)
	if err != nil {
		log.Printf("error fetching endpoint: %v", err)
		http.Error(w, "Failed to fetch endpoint", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(endpoint); err != nil {
		log.Printf("error encoding endpoint response: %v", err)
		http.Error(w, "error encoding endpoint response", http.StatusInternalServerError)
	}
}

func (h *EndpointHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req CreateEndpointRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decoding the endpoint", http.StatusBadRequest)
		return
	}
	ep := db.Endpoint{
		ID: id, Name: req.Name, TargetURL: req.TargetURL, Provider: req.Provider,
		InboundSecret: req.InboundSecret, MaxRetries: req.MaxRetries,
		TimeoutMS: req.TimeoutMS, SlackWebhookURL: req.SlackWebhookURL,
	}
	endpoint, err := h.store.UpdateEndpoint(r.Context(), &ep)
	if err != nil {
		http.Error(w, "Failed to update the endpoint", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(endpoint)
}

func (h *EndpointHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.store.DeleteEndpoint(r.Context(), id); err != nil {
		http.Error(w, "Failed to delete the endpoint", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EndpointHandler) RotateSecret(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	newSecret, err := generateSigningSecret()
	if err != nil {
		http.Error(w, "Failed to generate the signing secret", http.StatusInternalServerError)
		return
	}
	if err := h.store.UpdateSigningSecret(r.Context(), id, newSecret); err != nil {
		http.Error(w, "Failed to rotate the signing secret", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"SigningSecret": newSecret})
}

// maskSigningSecret turns `whsec_<64 hex chars>` into `whsec_9cef…88f7`.
func maskSigningSecret(secret string) string {
	const prefix = "whsec_"
	if len(secret) < len(prefix)+8 {
		return prefix + "****"
	}
	return secret[:len(prefix)+4] + "…" + secret[len(secret)-4:]
}

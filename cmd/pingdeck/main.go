// PingDeck is a single binary: HTTP server (health, dashboard API, ingest)
// plus a background delivery worker. See docs/ARCHITECTURE.md for the flow.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"pingdeck/internal/api"
	"pingdeck/internal/config"
	"pingdeck/internal/db"
	"pingdeck/internal/worker"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}

func main() {
	ctx := context.Background()
	dsn := config.DBURL()
	store, err := db.New(ctx, dsn)
	if err != nil {
		log.Fatal(err)
	}
	hep := api.NewEndpoint(store)
	hwe := api.NewEvent(store)
	defer store.Close()

	http.HandleFunc("GET /healthz", handleHealth)
	http.HandleFunc("GET /api/v1/endpoints", hep.List)
	http.HandleFunc("GET /api/v1/endpoints/{id}", hep.Get)
	http.HandleFunc("POST /api/v1/endpoints", hep.Create)
	http.HandleFunc("PUT /api/v1/endpoints/{id}", hep.Update)
	http.HandleFunc("DELETE /api/v1/endpoints/{id}", hep.Delete)
	http.HandleFunc("POST /api/v1/endpoints/{id}/rotate-secret", hep.RotateSecret)
	http.HandleFunc("GET /api/v1/events", hwe.List)
	http.HandleFunc("GET /api/v1/events/{event_id}", hwe.Get)
	http.HandleFunc("POST /api/v1/events/{event_id}/replay", hwe.Replay)
	http.HandleFunc("POST /api/v1/events/{endpoint_id}", hwe.Ingest)

	wk := worker.NewWorker(store)
	go wk.Start(ctx)
	fmt.Println("PingDeck listening on :8080")
	err = http.ListenAndServe(":8080", api.WithCORS(http.DefaultServeMux))
	if err != nil {
		log.Fatal(err)
	}
}

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
	defer store.Close()

	http.HandleFunc("GET /healthz", handleHealth)
	http.HandleFunc("GET /api/v1/endpoints", hep.List)
	http.HandleFunc("GET /api/v1/endpoints/{id}", hep.Get)
	http.HandleFunc("POST /api/v1/endpoints", hep.Create)

	fmt.Println("PingDeck listening on :8080")
	err = http.ListenAndServe(":8080", http.DefaultServeMux)
	if err != nil {
		log.Fatal(err)
	}
}

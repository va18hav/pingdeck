// PingDeck is a single binary: HTTP server (health, dashboard API, ingest)
// plus a background delivery worker. See docs/ARCHITECTURE.md for the flow.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	broker := api.NewBroker()
	hwe := api.NewEvent(store, broker)
	defer store.Close()
	http.HandleFunc("GET /healthz", handleHealth)
	http.HandleFunc("GET /api/v1/endpoints", hep.List)
	http.HandleFunc("GET /api/v1/endpoints/{id}", hep.Get)
	http.HandleFunc("POST /api/v1/endpoints", hep.Create)
	http.HandleFunc("PUT /api/v1/endpoints/{id}", hep.Update)
	http.HandleFunc("DELETE /api/v1/endpoints/{id}", hep.Delete)
	http.HandleFunc("POST /api/v1/endpoints/{id}/rotate-secret", hep.RotateSecret)
	http.HandleFunc("GET /api/v1/events", hwe.List)
	http.HandleFunc("GET /api/v1/events/stream", broker.Stream)
	http.HandleFunc("GET /api/v1/events/{event_id}", hwe.Get)
	http.HandleFunc("POST /api/v1/events/{event_id}/replay", hwe.Replay)
	http.HandleFunc("POST /api/v1/endpoints/{endpoint_id}/replay", hwe.ReplayEndpoint)
	http.HandleFunc("POST /api/v1/events/{endpoint_id}", hwe.Ingest)

	wk := worker.NewWorker(store, broker)
	go wk.Start(ctx)

	// Serve the built dashboard (web/dist) when present — single-process
	// production mode. Unknown paths fall back to index.html so SPA routes
	// like /endpoints/:id keep working. Dev mode uses the Vite server instead.
	const dist = "web/dist"
	if info, err := os.Stat(dist); err == nil && info.IsDir() {
		http.Handle("/", spa(dist))
	}

	fmt.Println("PingDeck listening on :8080")
	err = http.ListenAndServe(":8080", api.WithCORS(http.DefaultServeMux))
	if err != nil {
		log.Fatal(err)
	}
}

// spa serves static assets from dist, falling back to index.html for
// client-side routes that have no matching file.
func spa(dist string) http.Handler {
	files := http.FileServer(http.Dir(dist))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, err := os.Stat(filepath.Join(dist, filepath.Clean(r.URL.Path)))
		if err == nil && !info.IsDir() {
			files.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dist, "index.html"))
	})
}

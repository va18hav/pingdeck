// Package db wraps pgxpool and holds every SQL query as a plain string.
package db

import (
	"context"

	_ "embed"

	"github.com/jackc/pgx/v5/pgxpool"
)

// initSQL is embedded at build time so the binary is self-contained
// (no migration files needed at runtime — required for the scratch Docker image).
//
//go:embed migrations/001_init.sql
var initSQL string

// Store wraps the pgxpool; all queries go through it.
type Store struct {
	pool *pgxpool.Pool
}

// New connects, pings, and applies the 001_init.sql schema (idempotent
// CREATE IF NOT EXISTS — safe to run on every startup).
func New(ctx context.Context, dbURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	_, err = pool.Exec(ctx, initSQL)
	if err != nil {
		return nil, err
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

// Package db wraps pgxpool and holds every SQL query as a plain string.
package db

import (
	"context"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

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

	sql, err := fetchSQL()
	if err != nil {
		return nil, err
	}

	_, err = pool.Exec(ctx, sql)
	if err != nil {
		return nil, err
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

// fetchSQL reads the migration file at runtime (path relative to the repo root).
func fetchSQL() (string, error) {
	sql, err := os.ReadFile("internal/db/migrations/001_init.sql")
	if err != nil {
		return "", err
	}
	return string(sql), nil
}

package db

import (
	"context"
	"time"
)

// Endpoint mirrors one row of the endpoints table.
type Endpoint struct {
	ID              string
	Provider        string
	InboundSecret   string
	SigningSecret   string
	Name            string
	TargetURL       string
	MaxRetries      int
	TimeoutMS       int
	SlackWebhookURL string
	IsActive        bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (s *Store) CreateEndpoint(ctx context.Context, e *Endpoint) (*Endpoint, error) {
	sql := InsertEndpointString()
	row := s.pool.QueryRow(ctx, sql, e.Name, e.TargetURL, e.Provider, e.InboundSecret, e.SigningSecret, e.MaxRetries, e.TimeoutMS, e.SlackWebhookURL)
	err := row.Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func InsertEndpointString() string {
	return `
	INSERT INTO endpoints (name, target_url, provider, inbound_secret, signing_secret, max_retries, timeout_ms, slack_webhook_url)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	RETURNING id, created_at, updated_at
	`
}

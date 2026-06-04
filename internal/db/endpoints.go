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

func (s *Store) ListEndpoints(ctx context.Context) ([]Endpoint, error) {
	sql := ListEndpointsString()
	rows, err := s.pool.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	endpoints := []Endpoint{}
	defer rows.Close()
	for rows.Next() {
		var ep Endpoint
		if err := rows.Scan(&ep.ID, &ep.Name, &ep.TargetURL, &ep.Provider, &ep.InboundSecret, &ep.SigningSecret, &ep.MaxRetries, &ep.TimeoutMS, &ep.SlackWebhookURL, &ep.IsActive, &ep.CreatedAt, &ep.UpdatedAt); err != nil {
			return nil, err
		}
		endpoints = append(endpoints, ep)
	}
	return endpoints, nil
}

func InsertEndpointString() string {
	return `
	INSERT INTO endpoints (name, target_url, provider, inbound_secret, signing_secret, max_retries, timeout_ms, slack_webhook_url)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	RETURNING id, created_at, updated_at
	`
}

func ListEndpointsString() string {
	return `
	SELECT id, name, target_url, provider, COALESCE(inbound_secret, ''), signing_secret, max_retries, timeout_ms, COALESCE(slack_webhook_url, ''), is_active, created_at, updated_at FROM endpoints ORDER BY created_at DESC
	`
}

func (s *Store) GetEndpoint(ctx context.Context, EndpointID string) (*Endpoint, error) {
	var ep Endpoint
	sql := GetEndpointString()
	err := s.pool.QueryRow(ctx, sql, EndpointID).Scan(
		&ep.ID,
		&ep.Name,
		&ep.TargetURL,
		&ep.Provider,
		&ep.InboundSecret,
		&ep.SigningSecret,
		&ep.MaxRetries,
		&ep.TimeoutMS,
		&ep.SlackWebhookURL,
		&ep.IsActive,
		&ep.CreatedAt,
		&ep.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &ep, nil
}

func GetEndpointString() string {
	return `
	SELECT id, name, target_url, provider, COALESCE(inbound_secret, ''), signing_secret, max_retries, timeout_ms, COALESCE(slack_webhook_url, ''), is_active, created_at, updated_at FROM endpoints WHERE id = $1
	`
}

func (s *Store) UpdateEndpoint(ctx context.Context, e *Endpoint) (*Endpoint, error) {
	sql := UpdateEndpointString()
	row := s.pool.QueryRow(ctx, sql, e.Name, e.TargetURL, e.Provider, e.InboundSecret, e.MaxRetries, e.TimeoutMS, e.SlackWebhookURL, e.ID)
	var ep Endpoint
	err := row.Scan(
		&ep.ID, &ep.Name, &ep.TargetURL, &ep.Provider, &ep.InboundSecret,
		&ep.SigningSecret, &ep.MaxRetries, &ep.TimeoutMS, &ep.SlackWebhookURL,
		&ep.IsActive, &ep.CreatedAt, &ep.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &ep, nil
}

func (s *Store) DeleteEndpoint(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, DeleteEndpointString(), id)
	return err
}

func (s *Store) UpdateSigningSecret(ctx context.Context, id, newSecret string) error {
	_, err := s.pool.Exec(ctx, UpdateSigningSecretString(), newSecret, id)
	return err
}

func UpdateSigningSecretString() string {
	return `UPDATE endpoints SET signing_secret = $1, updated_at = NOW() WHERE id = $2`
}

func DeleteEndpointString() string {
	return `DELETE FROM endpoints WHERE id = $1`
}

func UpdateEndpointString() string {
	return `
	UPDATE endpoints
	SET name = $1, target_url = $2, provider = $3, inbound_secret = $4, max_retries = $5, timeout_ms = $6, slack_webhook_url = $7, updated_at = NOW()
	WHERE id = $8
	RETURNING id, name, target_url, provider, COALESCE(inbound_secret, ''), signing_secret, max_retries, timeout_ms, COALESCE(slack_webhook_url, ''), is_active, created_at, updated_at
	`
}

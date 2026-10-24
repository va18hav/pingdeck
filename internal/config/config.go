// Package config centralizes environment/config reads. Currently just the
// dev database URL.
package config

import (
	"fmt"
	"os"
)

// DBURL returns DATABASE_URL from the environment (used by the Docker
// compose deployment), falling back to the hardcoded dev default that
// matches docker-compose.yml.
func DBURL() string {
	if v := os.Getenv("DATABASE_URL"); v != "" {
		return v
	}
	user := "pingdeck"
	password := "pingdeck_password"
	host := "localhost"
	port := "5432"
	dbname := "pingdeck"
	sslmode := "disable"

	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode,
	)

	return dbURL
}

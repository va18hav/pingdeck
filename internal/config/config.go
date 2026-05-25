// Package config centralizes environment/config reads. Currently just the
// dev database URL.
package config

import "fmt"

// DBURL builds the dev DSN; settings are hardcoded to match docker-compose.yml.
func DBURL() string {
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

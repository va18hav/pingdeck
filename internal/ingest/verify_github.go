package ingest

import (
	"net/http"
	"strings"
)

// verifyGithub checks "X-Hub-Signature-256: sha256=<hex>" — plain HMAC of the body.
func verifyGithub(secret string, h http.Header, body []byte) error {
	sig := strings.TrimPrefix(h.Get("X-Hub-Signature-256"), "sha256=")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMAC(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

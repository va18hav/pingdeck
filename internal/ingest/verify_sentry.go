package ingest

import (
	"net/http"
)

// verifySentry checks hex HMAC-SHA256 of the raw body.
func verifySentry(secret string, h http.Header, body []byte) error {
	sig := h.Get("Sentry-Hook-Signature")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMAC(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

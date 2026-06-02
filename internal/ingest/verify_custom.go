package ingest

import (
	"net/http"
	"strings"
)

// verifyCustom is PingDeck's own scheme: "X-Webhook-Signature: v1=<hex>" over the raw body.
func verifyCustom(secret string, h http.Header, body []byte) error {
	sig := strings.TrimPrefix(h.Get("X-Webhook-Signature"), "v1=")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMAC(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

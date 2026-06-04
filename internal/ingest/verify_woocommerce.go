package ingest

import (
	"net/http"
)

// verifyWooCommerce checks base64 HMAC-SHA256 of the raw body.
func verifyWooCommerce(secret string, h http.Header, body []byte) error {
	sig := h.Get("X-WC-Webhook-Signature")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMACBase64(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

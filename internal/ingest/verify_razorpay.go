package ingest

import (
	"net/http"
)

// verifyRazorpay checks hex HMAC-SHA256 of the raw body.
func verifyRazorpay(secret string, h http.Header, body []byte) error {
	sig := h.Get("X-Razorpay-Signature")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMAC(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

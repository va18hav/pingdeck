package ingest

import (
	"net/http"
)

// verifyShopify checks base64 HMAC-SHA256 of the raw body.
func verifyShopify(secret string, h http.Header, body []byte) error {
	sig := h.Get("X-Shopify-Hmac-Sha256")
	if sig == "" {
		return ErrMissingHeader
	}
	if !hmacEqual(computeHMACBase64(secret, body), sig) {
		return ErrBadSignature
	}
	return nil
}

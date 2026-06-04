// Package ingest verifies inbound provider signatures.
// One scheme per verify_<provider>.go file; register it in the verifiers map below.
package ingest

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
)

var (
	ErrUnknownProvider = errors.New("unknown provider verification scheme")
	ErrMissingSecret   = errors.New("endpoint has no inbound secret")
	ErrMissingHeader   = errors.New("signature header is missing")
	ErrBadSignature    = errors.New("signature does not match")
)

type verifyFunc func(secret string, h http.Header, body []byte) error

var verifiers = map[string]verifyFunc{
	"github":      verifyGithub,
	"custom":      verifyCustom,
	"stripe":      verifyStripe,
	"shopify":     verifyShopify,
	"woocommerce": verifyWooCommerce,
	"razorpay":    verifyRazorpay,
	"sentry":      verifySentry,
	"slack":       verifySlack,
}

func VerifyInbound(provider, secret string, h http.Header, body []byte) error {
	fn, ok := verifiers[provider]
	if !ok {
		return ErrUnknownProvider
	}
	// Endpoint was created without a source secret — nothing to verify against.
	if secret == "" {
		return ErrMissingSecret
	}
	return fn(secret, h, body)
}

// hmacEqual compares two signature strings in constant time.
// == stops at the first mismatching byte, letting a guessing attacker
// measure how close each guess was.
func hmacEqual(a, b string) bool {
	return hmac.Equal([]byte(a), []byte(b))
}

// computeHMAC is the shared primitive every provider builds on:
// HMAC-SHA256 of `content` with `secret`, as lowercase hex.
func computeHMAC(secret string, content []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(content)
	return hex.EncodeToString(mac.Sum(nil))
}

// computeHMACBase64 is the base64 variant (Shopify/WooCommerce encode their hex-less MACs).
func computeHMACBase64(secret string, content []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(content)
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

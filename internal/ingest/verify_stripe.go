package ingest

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var ErrStaleSignature = errors.New("signature timestamp is outside the freshness window")

const stripeTolerance = 5 * time.Minute

// verifyStripe checks Stripe's "t=<unix_ts>,v1=<hex>" header against "<t>.<body>".
// Multiple v1 values are accepted (Stripe key rotation).
func verifyStripe(secret string, h http.Header, body []byte) error {
	header := h.Get("Stripe-Signature")
	if header == "" {
		return ErrMissingHeader
	}

	var tsStr string
	var sent []string
	for _, part := range strings.Split(header, ",") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			tsStr = kv[1]
		case "v1":
			sent = append(sent, kv[1])
		}
	}
	if tsStr == "" || len(sent) == 0 {
		return ErrMissingHeader
	}

	ts, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		return ErrStaleSignature
	}

	if d := time.Since(time.Unix(ts, 0)); d > stripeTolerance || d < -stripeTolerance {
		return ErrStaleSignature
	}

	signedContent := append([]byte(tsStr+"."), body...)
	expected := computeHMAC(secret, signedContent)

	for _, s := range sent {
		if hmacEqual(expected, s) {
			return nil
		}
	}
	return ErrBadSignature
}

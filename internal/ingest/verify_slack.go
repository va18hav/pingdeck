package ingest

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

const slackTolerance = 5 * time.Minute

// verifySlack checks "X-Slack-Signature: v0=<hex>" over "v0:<ts>:<body>",
// with the timestamp coming from the separate X-Slack-Request-Timestamp header.
func verifySlack(secret string, h http.Header, body []byte) error {
	sig := h.Get("X-Slack-Signature")
	if sig == "" {
		return ErrMissingHeader
	}

	sent, ok := strings.CutPrefix(sig, "v0=")
	if !ok || sent == "" {
		return ErrBadSignature
	}

	tsStr := h.Get("X-Slack-Request-Timestamp")
	if tsStr == "" {
		return ErrMissingHeader
	}
	ts, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		return ErrStaleSignature
	}
	if d := time.Since(time.Unix(ts, 0)); d > slackTolerance || d < -slackTolerance {
		return ErrStaleSignature
	}

	signedContent := append([]byte("v0:"+tsStr+":"), body...)
	if !hmacEqual(computeHMAC(secret, signedContent), sent) {
		return ErrBadSignature
	}
	return nil
}

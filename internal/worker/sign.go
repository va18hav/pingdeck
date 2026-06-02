// Package worker claims due events from Postgres and delivers them with
// fresh signatures, scheduling retries on failure.
package worker

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// signPayload builds the outbound X-PingDeck-Signature header value:
// "t=<unix_ts>,v1=<hex>", where <hex> is HMAC-SHA256 of "<t>.<body>".
// The timestamp lives inside the MAC, and this is called once per delivery
// attempt — so retries and replays always carry a fresh, unforgeable t.
func signPayload(secret string, body []byte) string {
	ts := time.Now().Unix()
	signedContent := fmt.Sprintf("%d.", ts)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signedContent))
	mac.Write(body)

	return fmt.Sprintf("t=%d,v1=%s", ts, hex.EncodeToString(mac.Sum(nil)))
}

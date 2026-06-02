package worker

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"
)

// TestSignPayloadReceiverSide re-computes the MAC exactly as a receiving
// server would and verifies it with hmac.Equal.
func TestSignPayloadReceiverSide(t *testing.T) {
	secret := "whsec_9cef33ee3af94e52abe7532a491bd22c3f2018d8ef417d68607f774a599d88f7"
	body := []byte(`{"event":"charge.succeeded","amount":4200}`)

	header := signPayload(secret, body)
	t.Logf("X-PingDeck-Signature: %s", header)

	var ts, sent string
	for i := 0; i+1 < len(header); i++ {
		if header[i] == ',' {
			ts = header[2:i]
			sent = header[i+4:]
			break
		}
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(ts + "."))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expected), []byte(sent)) {
		t.Fatalf("receiver verification FAILED: expected %s got %s", expected, sent)
	}
	t.Log("receiver-side verification PASSED (hmac.Equal)")
}

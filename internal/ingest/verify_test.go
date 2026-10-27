package ingest

import (
	"fmt"
	"net/http"
	"strconv"
	"testing"
	"time"
)

// Each case carries its own signing helper so every provider's scheme is
// spelled out exactly once, in the same file as the assertions about it.
type scheme struct {
	// provider name as stored on the endpoint
	provider string
	// sign returns the headers a real provider would send for this body.
	// Headers are set via h.Set (MIME-canonicalized), mirroring how net/http
	// canonicalizes header names off the wire before handlers see them.
	sign func(secret string, body []byte) http.Header
}

const testSecret = "whsec_test_secret"
const testBody = `{"id":"evt_1","type":"ping"}`

var schemes = []scheme{
	{
		provider: "github",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			h.Set("X-Hub-Signature-256", "sha256="+computeHMAC(secret, body))
			return h
		},
	},
	{
		provider: "custom",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			h.Set("X-Webhook-Signature", "v1="+computeHMAC(secret, body))
			return h
		},
	},
	{
		provider: "razorpay",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			h.Set("X-Razorpay-Signature", computeHMAC(secret, body))
			return h
		},
	},
	{
		provider: "sentry",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			h.Set("Sentry-Hook-Signature", computeHMAC(secret, body))
			return h
		},
	},
	{
		provider: "shopify",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			h.Set("X-Shopify-Hmac-Sha256", computeHMACBase64(secret, body))
			return h
		},
	},
	{
		provider: "woocommerce",
		sign: func(secret string, body []byte) http.Header {
			h := http.Header{}
			// Note: canonicalized to "X-Wc-Webhook-Signature" by Set(),
			// which is what a real WooCommerce delivery looks like in r.Header.
			h.Set("X-WC-Webhook-Signature", computeHMACBase64(secret, body))
			return h
		},
	},
	{
		provider: "stripe",
		sign: func(secret string, body []byte) http.Header {
			ts := strconv.FormatInt(time.Now().Unix(), 10)
			h := http.Header{}
			h.Set("Stripe-Signature", fmt.Sprintf("t=%s,v1=%s", ts, computeHMAC(secret, []byte(ts+"."+string(body)))))
			return h
		},
	},
	{
		provider: "slack",
		sign: func(secret string, body []byte) http.Header {
			ts := strconv.FormatInt(time.Now().Unix(), 10)
			h := http.Header{}
			h.Set("X-Slack-Request-Timestamp", ts)
			h.Set("X-Slack-Signature", "v0="+computeHMAC(secret, []byte("v0:"+ts+":"+string(body))))
			return h
		},
	},
}

func TestVerifyInboundValid(t *testing.T) {
	body := []byte(testBody)
	for _, s := range schemes {
		t.Run(s.provider, func(t *testing.T) {
			err := VerifyInbound(s.provider, testSecret, s.sign(testSecret, body), body)
			if err != nil {
				t.Fatalf("valid signature rejected: %v", err)
			}
		})
	}
}

func TestVerifyInboundTamperedBody(t *testing.T) {
	signed := []byte(testBody)
	tampered := []byte(testBody + ";admin=true")
	for _, s := range schemes {
		t.Run(s.provider, func(t *testing.T) {
			// Headers were made for `signed`, but the attacker mutates the
			// body in transit — signature must no longer match.
			err := VerifyInbound(s.provider, testSecret, s.sign(testSecret, signed), tampered)
			if err != ErrBadSignature {
				t.Fatalf("tampered body accepted, got: %v", err)
			}
		})
	}
}

func TestVerifyInboundWrongSecret(t *testing.T) {
	body := []byte(testBody)
	for _, s := range schemes {
		t.Run(s.provider, func(t *testing.T) {
			err := VerifyInbound(s.provider, "whsec_other", s.sign(testSecret, body), body)
			if err != ErrBadSignature {
				t.Fatalf("wrong secret accepted, got: %v", err)
			}
		})
	}
}

func TestVerifyInboundMissingHeader(t *testing.T) {
	body := []byte(testBody)
	for _, s := range schemes {
		t.Run(s.provider, func(t *testing.T) {
			err := VerifyInbound(s.provider, testSecret, http.Header{}, body)
			if err != ErrMissingHeader {
				t.Fatalf("missing header accepted, got: %v", err)
			}
		})
	}
}

func TestVerifyInboundEmptySecret(t *testing.T) {
	body := []byte(testBody)
	for _, s := range schemes {
		t.Run(s.provider, func(t *testing.T) {
			// Endpoint created without a source secret: nothing to check against.
			err := VerifyInbound(s.provider, "", http.Header{}, body)
			if err != ErrMissingSecret {
				t.Fatalf("empty secret accepted, got: %v", err)
			}
		})
	}
}

func TestVerifyInboundUnknownProvider(t *testing.T) {
	err := VerifyInbound("muji", testSecret, http.Header{}, []byte(testBody))
	if err != ErrUnknownProvider {
		t.Fatalf("unknown provider accepted, got: %v", err)
	}
}

// The timestamp-based schemes (Stripe, Slack) have extra rules the plain
// HMAC providers don't, so they get their own tables.

func TestVerifyStripeOldAndFutureTimestamps(t *testing.T) {
	body := []byte(testBody)
	cases := []struct {
		name string
		age  time.Duration
		want error
	}{
		{"within-tolerance", 4 * time.Minute, nil},
		{"stale", 6 * time.Minute, ErrStaleSignature},
		{"from-the-future", -6 * time.Minute, ErrStaleSignature},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			ts := strconv.FormatInt(time.Now().Add(-c.age).Unix(), 10)
			h := http.Header{"Stripe-Signature": {"t=" + ts + ",v1=" + computeHMAC(testSecret, []byte(ts+"."+string(body)))}}
			if err := verifyStripe(testSecret, h, body); err != c.want {
				t.Fatalf("got %v, want %v", err, c.want)
			}
		})
	}
	// A garbage timestamp parses as neither fresh nor valid.
	h := http.Header{"Stripe-Signature": {"t=not-a-number,v1=" + computeHMAC(testSecret, []byte("x."+string(body)))}}
	if err := verifyStripe(testSecret, h, body); err != ErrStaleSignature {
		t.Fatalf("garbage timestamp got %v, want %v", err, ErrStaleSignature)
	}
}

func TestVerifyStripeKeyRotation(t *testing.T) {
	body := []byte(testBody)
	ts := strconv.FormatInt(time.Now().Unix(), 10)

	// Stripe may send several v1 values during a key rotation; the request
	// is accepted if any one of them matches the current secret.
	old := computeHMAC("whsec_old", []byte(ts+"."+string(body)))
	current := computeHMAC(testSecret, []byte(ts+"."+string(body)))
	h := http.Header{"Stripe-Signature": {"t=" + ts + ",v1=" + old + ",v1=" + current}}

	if err := verifyStripe(testSecret, h, body); err != nil {
		t.Fatalf("multi-v1 with a matching current key rejected: %v", err)
	}

	// Only stale keys: must fail even though the header looks well-formed.
	onlyOld := http.Header{"Stripe-Signature": {"t=" + ts + ",v1=" + old + ",v1=" + old}}
	if err := verifyStripe(testSecret, onlyOld, body); err != ErrBadSignature {
		t.Fatalf("mismatched v1 accepted, got: %v", err)
	}
}

func TestVerifySlackBadCases(t *testing.T) {
	body := []byte(testBody)
	ts := strconv.FormatInt(time.Now().Unix(), 10)

	// Wrong scheme prefix: Slack rejects anything without the exact v0= prefix.
	wrongPrefix := http.Header{"X-Slack-Signature": {"v01=" + computeHMAC(testSecret, []byte("v0:"+ts+":"+string(body)))},
		"X-Slack-Request-Timestamp": {ts}}
	if err := verifySlack(testSecret, wrongPrefix, body); err != ErrBadSignature {
		t.Fatalf("sig without v0= accepted, got: %v", err)
	}

	// Timestamp header missing even though the signature is there.
	noTs := http.Header{"X-Slack-Signature": {"v0=" + computeHMAC(testSecret, []byte("v0:123:"+string(body)))}}
	if err := verifySlack(testSecret, noTs, body); err != ErrMissingHeader {
		t.Fatalf("missing timestamp accepted, got: %v", err)
	}

	// A stale timestamp must fail even with a perfectly matching signature.
	staleTs := strconv.FormatInt(time.Now().Add(-6*time.Minute).Unix(), 10)
	stale := http.Header{
		"X-Slack-Request-Timestamp": {staleTs},
		"X-Slack-Signature":         {"v0=" + computeHMAC(testSecret, []byte("v0:"+staleTs+":"+string(body)))},
	}
	if err := verifySlack(testSecret, stale, body); err != ErrStaleSignature {
		t.Fatalf("stale Slack signature accepted, got: %v", err)
	}
}

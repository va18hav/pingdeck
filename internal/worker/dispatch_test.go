package worker

import (
	"testing"
	"time"
)

// TestBackoffDelay pins the exponential backoff schedule and its 1h cap.
func TestBackoffDelay(t *testing.T) {
	tests := []struct {
		name    string
		attempt int
		want    time.Duration
	}{
		{"first retry waits 1s", 0, 1 * time.Second},
		{"second retry waits 2s", 1, 2 * time.Second},
		{"third retry waits 4s", 2, 4 * time.Second},
		{"sixth retry waits 32s", 5, 32 * time.Second},
		{"capped at 1 hour", 12, time.Hour},
		{"huge attempt still capped", 30, time.Hour},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := backoffDelay(tt.attempt)
			if got != tt.want {
				t.Errorf("backoffDelay(%d) = %v, want %v", tt.attempt, got, tt.want)
			}
		})
	}
}

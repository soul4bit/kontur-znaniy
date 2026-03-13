package app

import (
	"net/http/httptest"
	"testing"
)

func TestRequestClientIdentifierIgnoresForwardedHeadersWithoutTrustedProxy(t *testing.T) {
	a := &Application{}
	r := httptest.NewRequest("GET", "http://example.com", nil)
	r.RemoteAddr = "198.51.100.24:54321"
	r.Header.Set("X-Forwarded-For", "203.0.113.10")
	r.Header.Set("X-Real-IP", "203.0.113.11")

	got := a.requestClientIdentifier(r)
	want := "198.51.100.24"
	if got != want {
		t.Fatalf("requestClientIdentifier() = %q, want %q", got, want)
	}
}

func TestRequestClientIdentifierUsesForwardedHeadersFromTrustedProxy(t *testing.T) {
	trusted, err := parseTrustedProxyCIDRs("127.0.0.1/32")
	if err != nil {
		t.Fatalf("parseTrustedProxyCIDRs() error = %v", err)
	}

	a := &Application{trustedProxies: trusted}
	r := httptest.NewRequest("GET", "http://example.com", nil)
	r.RemoteAddr = "127.0.0.1:9000"
	r.Header.Set("X-Forwarded-For", "203.0.113.10, 127.0.0.1")

	got := a.requestClientIdentifier(r)
	want := "203.0.113.10"
	if got != want {
		t.Fatalf("requestClientIdentifier() = %q, want %q", got, want)
	}
}

func TestRequestClientIdentifierFallsBackToXRealIPFromTrustedProxy(t *testing.T) {
	trusted, err := parseTrustedProxyCIDRs("10.0.0.0/8")
	if err != nil {
		t.Fatalf("parseTrustedProxyCIDRs() error = %v", err)
	}

	a := &Application{trustedProxies: trusted}
	r := httptest.NewRequest("GET", "http://example.com", nil)
	r.RemoteAddr = "10.1.2.3:1234"
	r.Header.Set("X-Forwarded-For", "not-an-ip")
	r.Header.Set("X-Real-IP", "203.0.113.11")

	got := a.requestClientIdentifier(r)
	want := "203.0.113.11"
	if got != want {
		t.Fatalf("requestClientIdentifier() = %q, want %q", got, want)
	}
}

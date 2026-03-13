package app

import (
	"fmt"
	"net"
	"net/http"
	"strings"
	"unicode"
)

func parseTrustedProxyCIDRs(raw string) ([]*net.IPNet, error) {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return nil, nil
	}

	parts := strings.FieldsFunc(clean, func(r rune) bool {
		return r == ',' || r == ';' || unicode.IsSpace(r)
	})

	result := make([]*net.IPNet, 0, len(parts))
	for _, part := range parts {
		entry := strings.TrimSpace(part)
		if entry == "" {
			continue
		}

		if strings.Contains(entry, "/") {
			_, network, err := net.ParseCIDR(entry)
			if err != nil {
				return nil, fmt.Errorf("parse TRUSTED_PROXY_CIDRS entry %q: %w", entry, err)
			}
			result = append(result, network)
			continue
		}

		ip := net.ParseIP(entry)
		if ip == nil {
			return nil, fmt.Errorf("parse TRUSTED_PROXY_CIDRS entry %q: invalid ip/cidr", entry)
		}

		maskBits := 128
		if ipv4 := ip.To4(); ipv4 != nil {
			ip = ipv4
			maskBits = 32
		}
		mask := net.CIDRMask(maskBits, maskBits)
		result = append(result, &net.IPNet{
			IP:   ip.Mask(mask),
			Mask: mask,
		})
	}

	return result, nil
}

func parseIPFromRemoteAddr(remoteAddr string) net.IP {
	raw := strings.TrimSpace(remoteAddr)
	if raw == "" {
		return nil
	}

	if host, _, err := net.SplitHostPort(raw); err == nil {
		raw = host
	}

	return net.ParseIP(strings.Trim(raw, "[]"))
}

func remoteAddrIdentifier(remoteAddr string) string {
	raw := strings.TrimSpace(remoteAddr)
	if raw == "" {
		return ""
	}

	if host, _, err := net.SplitHostPort(raw); err == nil {
		raw = host
	}

	if ip := normalizeIP(raw); ip != "" {
		return ip
	}

	return strings.TrimSpace(strings.Trim(raw, "[]"))
}

func normalizeIP(value string) string {
	clean := strings.TrimSpace(strings.Trim(value, "[]"))
	if clean == "" {
		return ""
	}

	parsed := net.ParseIP(clean)
	if parsed == nil {
		return ""
	}
	return parsed.String()
}

func firstForwardedIP(raw string) string {
	for _, part := range strings.Split(raw, ",") {
		if ip := normalizeIP(part); ip != "" {
			return ip
		}
	}
	return ""
}

func (a *Application) isTrustedProxy(remoteAddr string) bool {
	if a == nil || len(a.trustedProxies) == 0 {
		return false
	}

	remoteIP := parseIPFromRemoteAddr(remoteAddr)
	if remoteIP == nil {
		return false
	}

	for _, network := range a.trustedProxies {
		if network != nil && network.Contains(remoteIP) {
			return true
		}
	}

	return false
}

func (a *Application) extractClientIP(r *http.Request) string {
	if r == nil {
		return ""
	}

	if a.isTrustedProxy(r.RemoteAddr) {
		if ip := normalizeIP(r.Header.Get("CF-Connecting-IP")); ip != "" {
			return ip
		}
		if ip := firstForwardedIP(r.Header.Get("X-Forwarded-For")); ip != "" {
			return ip
		}
		if ip := normalizeIP(r.Header.Get("X-Real-IP")); ip != "" {
			return ip
		}
	}

	return remoteAddrIdentifier(r.RemoteAddr)
}

func (a *Application) requestClientIdentifier(r *http.Request) string {
	return strings.TrimSpace(a.extractClientIP(r))
}

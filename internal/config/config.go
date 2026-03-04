package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppName             string
	Port                string
	AppBaseURL          string
	DatabaseURL         string
	SessionCookieName   string
	SessionTTL          time.Duration
	SecureCookies       bool
	SMTPHost            string
	SMTPPort            int
	SMTPSecure          bool
	SMTPUser            string
	SMTPPassword        string
	MailFrom            string
	TelegramBotToken    string
	TelegramAdminChatID string
}

func Load() Config {
	appEnv := getEnv("APP_ENV", "development")
	ttlHours := getEnvInt("SESSION_TTL_HOURS", 168)
	if ttlHours < 1 {
		ttlHours = 168
	}

	secureByDefault := appEnv == "production"
	defaultDatabaseURL := "postgres://kontur_znaniy:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/kontur_znaniy?sslmode=disable"
	databaseURL := getEnv("DATABASE_URL", getEnv("DATABASE_DSN", defaultDatabaseURL))

	return Config{
		AppName:             getEnv("APP_NAME", "Контур Знаний"),
		Port:                getEnv("APP_PORT", "8080"),
		AppBaseURL:          strings.TrimRight(getEnv("APP_BASE_URL", "http://localhost:8080"), "/"),
		DatabaseURL:         databaseURL,
		SessionCookieName:   getEnv("SESSION_COOKIE_NAME", "kontur_session"),
		SessionTTL:          time.Duration(ttlHours) * time.Hour,
		SecureCookies:       getEnvBool("SECURE_COOKIES", secureByDefault),
		SMTPHost:            getEnv("SMTP_HOST", ""),
		SMTPPort:            getEnvInt("SMTP_PORT", 465),
		SMTPSecure:          getEnvBool("SMTP_SECURE", true),
		SMTPUser:            getEnv("SMTP_USER", ""),
		SMTPPassword:        getEnv("SMTP_PASSWORD", ""),
		MailFrom:            getEnv("MAIL_FROM", ""),
		TelegramBotToken:    getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramAdminChatID: getEnv("TELEGRAM_ADMIN_CHAT_ID", ""),
	}
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}

	return value
}

func getEnvBool(key string, fallback bool) bool {
	raw := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if raw == "" {
		return fallback
	}

	switch raw {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}

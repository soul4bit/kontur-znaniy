package app

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func normalizeS3Endpoint(raw string) (host string, secure bool, err error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", false, fmt.Errorf("S3 endpoint is empty")
	}

	if !strings.Contains(trimmed, "://") {
		trimmed = "https://" + trimmed
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return "", false, fmt.Errorf("invalid S3 endpoint: %w", err)
	}
	if strings.TrimSpace(parsed.Host) == "" {
		return "", false, fmt.Errorf("invalid S3 endpoint host")
	}

	return parsed.Host, strings.EqualFold(parsed.Scheme, "https"), nil
}

func (a *Application) checkS3(ctx context.Context) s3CheckResult {
	result := s3CheckResult{
		Checked:  true,
		Endpoint: strings.TrimSpace(a.cfg.S3Endpoint),
		Bucket:   strings.TrimSpace(a.cfg.S3Bucket),
	}

	if result.Endpoint == "" || result.Bucket == "" {
		result.Message = "Заполните S3_ENDPOINT и S3_BUCKET."
		return result
	}

	if strings.TrimSpace(a.cfg.S3AccessKey) == "" || strings.TrimSpace(a.cfg.S3SecretKey) == "" {
		result.Message = "Заполните S3_ACCESS_KEY и S3_SECRET_KEY."
		return result
	}

	host, secure, err := normalizeS3Endpoint(result.Endpoint)
	if err != nil {
		result.Message = err.Error()
		return result
	}

	client, err := minio.New(host, &minio.Options{
		Creds:  credentials.NewStaticV4(a.cfg.S3AccessKey, a.cfg.S3SecretKey, ""),
		Secure: secure,
	})
	if err != nil {
		result.Message = fmt.Sprintf("Не удалось создать S3-клиент: %v", err)
		return result
	}

	checkCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	exists, err := client.BucketExists(checkCtx, result.Bucket)
	if err != nil {
		result.Message = fmt.Sprintf("Ошибка доступа к бакету: %v", err)
		return result
	}

	if !exists {
		result.Message = "Бакет не найден или недоступен."
		return result
	}

	result.OK = true
	result.Message = "S3 подключен: бакет доступен, ключи валидны."
	return result
}

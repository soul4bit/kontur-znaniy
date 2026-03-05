package app

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

func (a *Application) getRateLimitBlockUntil(action string, identifier string, now time.Time) (time.Time, bool, error) {
	action = strings.TrimSpace(action)
	identifier = strings.TrimSpace(identifier)
	if action == "" || identifier == "" {
		return time.Time{}, false, nil
	}

	var blockedUntil sql.NullTime
	err := a.db.QueryRow(
		`select blocked_until
		from auth_rate_limits
		where action = $1 and identifier = $2
		limit 1`,
		action,
		identifier,
	).Scan(&blockedUntil)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return time.Time{}, false, nil
		}
		return time.Time{}, false, err
	}

	if blockedUntil.Valid && blockedUntil.Time.After(now) {
		return blockedUntil.Time, true, nil
	}

	return time.Time{}, false, nil
}

func (a *Application) registerRateLimitFailure(action string, identifier string, now time.Time, window time.Duration, maxAttempts int, blockFor time.Duration) (time.Time, bool, error) {
	action = strings.TrimSpace(action)
	identifier = strings.TrimSpace(identifier)
	if action == "" || identifier == "" {
		return time.Time{}, false, nil
	}
	if maxAttempts < 1 {
		maxAttempts = 1
	}
	if window < time.Second {
		window = time.Minute
	}
	if blockFor < time.Second {
		blockFor = time.Minute
	}

	tx, err := a.db.Begin()
	if err != nil {
		return time.Time{}, false, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var attempts int
	var windowStartedAt time.Time
	var blockedUntil sql.NullTime
	err = tx.QueryRow(
		`select attempts, window_started_at, blocked_until
		from auth_rate_limits
		where action = $1 and identifier = $2
		for update`,
		action,
		identifier,
	).Scan(&attempts, &windowStartedAt, &blockedUntil)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return time.Time{}, false, err
	}

	if errors.Is(err, sql.ErrNoRows) {
		attempts = 1
		windowStartedAt = now
		blockedUntil = sql.NullTime{}
		if attempts >= maxAttempts {
			blockedUntil = sql.NullTime{Time: now.Add(blockFor), Valid: true}
		}

		_, err = tx.Exec(
			`insert into auth_rate_limits (
				action,
				identifier,
				attempts,
				window_started_at,
				blocked_until,
				updated_at
			) values ($1, $2, $3, $4, $5, $6)`,
			action,
			identifier,
			attempts,
			windowStartedAt,
			blockedUntil,
			now,
		)
		if err != nil {
			return time.Time{}, false, err
		}
		if err := tx.Commit(); err != nil {
			return time.Time{}, false, err
		}
		if blockedUntil.Valid && blockedUntil.Time.After(now) {
			return blockedUntil.Time, true, nil
		}
		return time.Time{}, false, nil
	}

	if blockedUntil.Valid && blockedUntil.Time.After(now) {
		_, err = tx.Exec(
			`update auth_rate_limits
			set updated_at = $3
			where action = $1 and identifier = $2`,
			action,
			identifier,
			now,
		)
		if err != nil {
			return time.Time{}, false, err
		}
		if err := tx.Commit(); err != nil {
			return time.Time{}, false, err
		}
		return blockedUntil.Time, true, nil
	}

	if now.Sub(windowStartedAt) >= window {
		attempts = 1
		windowStartedAt = now
	} else {
		attempts++
	}

	blockedUntil = sql.NullTime{}
	if attempts >= maxAttempts {
		blockedUntil = sql.NullTime{Time: now.Add(blockFor), Valid: true}
	}

	_, err = tx.Exec(
		`update auth_rate_limits
		set
			attempts = $3,
			window_started_at = $4,
			blocked_until = $5,
			updated_at = $6
		where action = $1 and identifier = $2`,
		action,
		identifier,
		attempts,
		windowStartedAt,
		blockedUntil,
		now,
	)
	if err != nil {
		return time.Time{}, false, err
	}

	if err := tx.Commit(); err != nil {
		return time.Time{}, false, err
	}

	if blockedUntil.Valid && blockedUntil.Time.After(now) {
		return blockedUntil.Time, true, nil
	}

	return time.Time{}, false, nil
}

func (a *Application) clearRateLimit(action string, identifier string) error {
	action = strings.TrimSpace(action)
	identifier = strings.TrimSpace(identifier)
	if action == "" || identifier == "" {
		return nil
	}
	_, err := a.db.Exec(
		`delete from auth_rate_limits where action = $1 and identifier = $2`,
		action,
		identifier,
	)
	return err
}

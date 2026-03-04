package app

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

type authStats struct {
	UsersTotal     int
	ActiveSessions int
}

func (a *Application) createUser(name string, email string, passwordHash string) (*User, error) {
	now := time.Now().UTC()
	row := a.db.QueryRow(
		`insert into users (email, name, password_hash, created_at)
		 values ($1, $2, $3, $4)
		 returning id, email, name, created_at`,
		email,
		name,
		passwordHash,
		now,
	)

	var user User
	if err := row.Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt); err != nil {
		return nil, err
	}

	return &user, nil
}

func (a *Application) getUserByID(userID int64) (*User, error) {
	row := a.db.QueryRow(
		`select id, email, name, created_at from users where id = $1 limit 1`,
		userID,
	)

	var user User
	if err := row.Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt); err != nil {
		return nil, err
	}

	return &user, nil
}

func (a *Application) getCredentialsByEmail(email string) (*userCredentials, error) {
	row := a.db.QueryRow(
		`select id, email, name, password_hash, created_at from users where email = $1 limit 1`,
		email,
	)

	var creds userCredentials
	if err := row.Scan(
		&creds.ID,
		&creds.Email,
		&creds.Name,
		&creds.PasswordHash,
		&creds.CreatedAt,
	); err != nil {
		return nil, err
	}

	return &creds, nil
}

func (a *Application) createSession(userID int64) (token string, expiresAt time.Time, err error) {
	if err := a.cleanupExpiredSessions(); err != nil {
		return "", time.Time{}, err
	}

	token, err = generateSessionToken()
	if err != nil {
		return "", time.Time{}, err
	}

	now := time.Now().UTC()
	expiresAt = now.Add(a.cfg.SessionTTL)
	tokenHash := hashSessionToken(token)

	_, err = a.db.Exec(
		`insert into sessions (user_id, token_hash, created_at, expires_at) values ($1, $2, $3, $4)`,
		userID,
		tokenHash,
		now,
		expiresAt,
	)
	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

func (a *Application) getUserBySessionToken(token string) (*User, error) {
	tokenHash := hashSessionToken(token)
	row := a.db.QueryRow(
		`select
			u.id,
			u.email,
			u.name,
			u.created_at,
			s.expires_at
		from sessions s
		join users u on u.id = s.user_id
		where s.token_hash = $1
		limit 1`,
		tokenHash,
	)

	var user User
	var expiresAt time.Time
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.CreatedAt,
		&expiresAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if !expiresAt.After(time.Now().UTC()) {
		if delErr := a.deleteSessionByToken(token); delErr != nil {
			a.logger.Printf("delete expired session: %v", delErr)
		}
		return nil, nil
	}

	return &user, nil
}

func (a *Application) deleteSessionByToken(token string) error {
	tokenHash := hashSessionToken(token)
	_, err := a.db.Exec(`delete from sessions where token_hash = $1`, tokenHash)
	return err
}

func (a *Application) cleanupExpiredSessions() error {
	_, err := a.db.Exec(
		`delete from sessions where expires_at <= $1`,
		time.Now().UTC(),
	)
	return err
}

func (a *Application) getAuthStats() (authStats, error) {
	now := time.Now().UTC()
	row := a.db.QueryRow(
		`select
			(select count(*) from users),
			(select count(*) from sessions where expires_at > $1)`,
		now,
	)

	var stats authStats
	if err := row.Scan(&stats.UsersTotal, &stats.ActiveSessions); err != nil {
		return authStats{}, err
	}

	return stats, nil
}

func isUniqueEmailError(err error) bool {
	if err == nil {
		return false
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code != "23505" {
			return false
		}

		if pgErr.ConstraintName == "users_email_key" {
			return true
		}

		return strings.Contains(strings.ToLower(pgErr.Message), "email")
	}

	text := strings.ToLower(err.Error())
	return strings.Contains(text, "users_email_key") ||
		(strings.Contains(text, "duplicate key") && strings.Contains(text, "email"))
}

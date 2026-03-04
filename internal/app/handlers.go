package app

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func (a *Application) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := a.currentUser(r)
		if err != nil {
			a.logger.Printf("resolve user: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		if user == nil {
			a.clearSessionCookie(w)
			http.Redirect(w, r, "/auth/login?next="+r.URL.Path, http.StatusSeeOther)
			return
		}

		ctx := r.Context()
		ctx = contextWithUser(ctx, user)
		next(w, r.WithContext(ctx))
	}
}

func contextWithUser(ctx context.Context, user *User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

func (a *Application) authViewData(title string) viewData {
	data := viewData{
		AppName: a.cfg.AppName,
		Title:   title,
	}

	stats, err := a.getAuthStats()
	if err != nil {
		a.logger.Printf("get auth stats: %v", err)
		return data
	}

	data.UsersTotal = stats.UsersTotal
	data.ActiveSessions = stats.ActiveSessions
	return data
}

func (a *Application) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := a.currentUser(r)
	if err != nil {
		a.logger.Printf("root user lookup: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if user != nil {
		http.Redirect(w, r, "/app", http.StatusSeeOther)
		return
	}

	http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
}

func (a *Application) handleLogin(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		user, err := a.currentUser(r)
		if err != nil {
			a.logger.Printf("login user lookup: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if user != nil {
			http.Redirect(w, r, "/app", http.StatusSeeOther)
			return
		}

		data := a.authViewData("Вход")
		data.Success = strings.TrimSpace(r.URL.Query().Get("success"))
		data.Next = strings.TrimSpace(r.URL.Query().Get("next"))
		a.renderTemplate(w, "login.tmpl", data)
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Error(w, "invalid form data", http.StatusBadRequest)
			return
		}

		email := normalizeEmail(r.FormValue("email"))
		password := r.FormValue("password")
		next := strings.TrimSpace(r.FormValue("next"))

		data := a.authViewData("Вход")
		data.Email = email
		data.Next = next

		if email == "" || password == "" {
			data.Error = "Введите email и пароль."
			a.renderTemplate(w, "login.tmpl", data)
			return
		}

		creds, err := a.getCredentialsByEmail(email)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				if reg, regErr := a.getRegistrationRequestByEmail(email); regErr == nil {
					switch reg.Status {
					case registrationStatusPending:
						data.Error = "Заявка еще на рассмотрении. Дождитесь решения в письме."
					case registrationStatusApproved:
						data.Error = "Заявка одобрена. Подтвердите email по ссылке из письма."
					case registrationStatusRejected:
						data.Error = "Заявка отклонена. Можно отправить новую регистрацию."
					default:
						data.Error = "Неверный email или пароль."
					}
				} else {
					data.Error = "Неверный email или пароль."
				}
				a.renderTemplate(w, "login.tmpl", data)
				return
			}
			a.logger.Printf("get credentials by email: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(password)); err != nil {
			data.Error = "Неверный email или пароль."
			a.renderTemplate(w, "login.tmpl", data)
			return
		}

		token, expiresAt, err := a.createSession(creds.ID)
		if err != nil {
			a.logger.Printf("create session: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, a.sessionCookie(token, expiresAt))

		target := "/app"
		if isSafeRedirectTarget(next) {
			target = next
		}
		http.Redirect(w, r, target, http.StatusSeeOther)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *Application) handleRegister(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		user, err := a.currentUser(r)
		if err != nil {
			a.logger.Printf("register user lookup: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if user != nil {
			http.Redirect(w, r, "/app", http.StatusSeeOther)
			return
		}

		a.renderTemplate(w, "register.tmpl", a.authViewData("Регистрация"))
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Error(w, "invalid form data", http.StatusBadRequest)
			return
		}

		name := strings.TrimSpace(r.FormValue("name"))
		email := normalizeEmail(r.FormValue("email"))
		password := r.FormValue("password")
		confirmPassword := r.FormValue("confirm_password")

		data := a.authViewData("Регистрация")
		data.Name = name
		data.Email = email

		if !a.hasRegistrationIntegrations() {
			data.Error = "Регистрация временно недоступна: не настроены SMTP/Telegram интеграции."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if len(name) < 2 {
			data.Error = "Ник должен быть минимум 2 символа."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if _, err := mail.ParseAddress(email); err != nil {
			data.Error = "Введите корректный email."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if len(password) < 10 {
			data.Error = "Пароль должен быть не короче 10 символов."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if password != confirmPassword {
			data.Error = "Пароли не совпадают."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if existingUser, err := a.getUserByEmail(email); err == nil && existingUser != nil {
			data.Error = "Аккаунт с таким email уже существует."
			a.renderTemplate(w, "register.tmpl", data)
			return
		} else if err != nil && !errors.Is(err, sql.ErrNoRows) {
			a.logger.Printf("lookup existing user by email: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		if existingReq, err := a.getRegistrationRequestByEmail(email); err == nil {
			switch existingReq.Status {
			case registrationStatusPending:
				data.Error = "Заявка уже отправлена и ждет решения модератора."
				a.renderTemplate(w, "register.tmpl", data)
				return
			case registrationStatusApproved:
				data.Error = "Заявка уже одобрена. Проверьте письмо и подтвердите email."
				a.renderTemplate(w, "register.tmpl", data)
				return
			case registrationStatusCompleted:
				data.Error = "Этот email уже подтвержден и активирован. Войдите в аккаунт."
				a.renderTemplate(w, "register.tmpl", data)
				return
			}
		} else if !errors.Is(err, sql.ErrNoRows) {
			a.logger.Printf("lookup registration request by email: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			a.logger.Printf("hash password: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		moderationToken, err := generateSessionToken()
		if err != nil {
			a.logger.Printf("generate moderation token: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		request, err := a.upsertRegistrationRequest(name, email, string(passwordHash), moderationToken)
		if err != nil {
			a.logger.Printf("upsert registration request: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		if err := a.sendRegistrationRequestToTelegram(request); err != nil {
			a.logger.Printf("send registration request to telegram: %v", err)
			if delErr := a.deleteRegistrationRequestByEmail(email); delErr != nil {
				a.logger.Printf("rollback registration request after telegram error: %v", delErr)
			}
			data.Error = "Не удалось отправить заявку модератору. Попробуйте еще раз чуть позже."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		success := url.QueryEscape("Заявка отправлена. После решения модератора придет письмо.")
		http.Redirect(w, r, "/auth/login?success="+success, http.StatusSeeOther)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *Application) handleApproveRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		a.renderPlainMessage(w, http.StatusBadRequest, "Пустой токен модерации.")
		return
	}

	emailVerifyToken, err := generateSessionToken()
	if err != nil {
		a.logger.Printf("generate email verify token: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Не удалось сгенерировать токен подтверждения email.")
		return
	}

	req, err := a.approveRegistrationRequest(token, emailVerifyToken)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			existing, lookupErr := a.getRegistrationRequestByModerationToken(token)
			if lookupErr != nil {
				a.renderPlainMessage(w, http.StatusNotFound, "Заявка не найдена или ссылка устарела.")
				return
			}

			switch existing.Status {
			case registrationStatusApproved:
				if existing.EmailVerifyToken.Valid && strings.TrimSpace(existing.EmailVerifyToken.String) != "" {
					if mailErr := a.sendRegistrationApprovedEmail(existing); mailErr != nil {
						a.logger.Printf("resend approved email: %v", mailErr)
						a.renderPlainMessage(w, http.StatusInternalServerError, "Заявка уже одобрена, но письмо повторно отправить не удалось.")
						return
					}
					a.renderPlainMessage(w, http.StatusOK, "Заявка уже была одобрена. Письмо с подтверждением отправлено повторно.")
					return
				}
				a.renderPlainMessage(w, http.StatusOK, "Заявка уже одобрена.")
			case registrationStatusRejected:
				a.renderPlainMessage(w, http.StatusConflict, "Заявка уже отклонена.")
			case registrationStatusCompleted:
				a.renderPlainMessage(w, http.StatusConflict, "Email уже подтвержден, пользователь активирован.")
			default:
				a.renderPlainMessage(w, http.StatusConflict, "Заявка уже обработана.")
			}
			return
		}

		a.logger.Printf("approve registration request: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Ошибка при одобрении заявки.")
		return
	}

	if err := a.sendRegistrationApprovedEmail(req); err != nil {
		a.logger.Printf("send approved email: %v", err)
		a.renderPlainMessage(
			w,
			http.StatusInternalServerError,
			"Заявка одобрена, но письмо отправить не удалось. Нажмите эту же ссылку еще раз для повторной отправки.",
		)
		return
	}

	a.renderPlainMessage(w, http.StatusOK, fmt.Sprintf("Заявка одобрена. На %s отправлено письмо с подтверждением.", req.Email))
}

func (a *Application) handleRejectRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		a.renderPlainMessage(w, http.StatusBadRequest, "Пустой токен модерации.")
		return
	}

	reason := strings.TrimSpace(r.URL.Query().Get("reason"))
	if reason == "" {
		reason = defaultAdminRejectReason
	}

	req, err := a.rejectRegistrationRequest(token, reason)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			existing, lookupErr := a.getRegistrationRequestByModerationToken(token)
			if lookupErr != nil {
				a.renderPlainMessage(w, http.StatusNotFound, "Заявка не найдена или ссылка устарела.")
				return
			}

			switch existing.Status {
			case registrationStatusRejected:
				rejectReason := defaultAdminRejectReason
				if existing.RejectionReason.Valid && strings.TrimSpace(existing.RejectionReason.String) != "" {
					rejectReason = existing.RejectionReason.String
				}
				if mailErr := a.sendRegistrationRejectedEmail(existing, rejectReason); mailErr != nil {
					a.logger.Printf("resend rejected email: %v", mailErr)
					a.renderPlainMessage(w, http.StatusInternalServerError, "Заявка уже отклонена, но повторно отправить письмо не удалось.")
					return
				}
				a.renderPlainMessage(w, http.StatusOK, "Заявка уже была отклонена. Письмо отправлено повторно.")
			case registrationStatusApproved:
				a.renderPlainMessage(w, http.StatusConflict, "Заявка уже одобрена.")
			case registrationStatusCompleted:
				a.renderPlainMessage(w, http.StatusConflict, "Email уже подтвержден, пользователь активирован.")
			default:
				a.renderPlainMessage(w, http.StatusConflict, "Заявка уже обработана.")
			}
			return
		}

		a.logger.Printf("reject registration request: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Ошибка при отклонении заявки.")
		return
	}

	if err := a.sendRegistrationRejectedEmail(req, reason); err != nil {
		a.logger.Printf("send rejected email: %v", err)
		a.renderPlainMessage(
			w,
			http.StatusInternalServerError,
			"Заявка отклонена, но письмо отправить не удалось. Нажмите эту же ссылку еще раз для повторной отправки.",
		)
		return
	}

	a.renderPlainMessage(w, http.StatusOK, fmt.Sprintf("Заявка отклонена. На %s отправлено письмо.", req.Email))
}

func (a *Application) handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		a.renderPlainMessage(w, http.StatusBadRequest, "Пустой токен подтверждения email.")
		return
	}

	user, err := a.completeRegistrationByVerifyToken(token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			a.renderPlainMessage(w, http.StatusBadRequest, "Ссылка подтверждения недействительна или уже использована.")
			return
		}
		a.logger.Printf("complete registration by verify token: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Ошибка при подтверждении email.")
		return
	}

	sessionToken, expiresAt, err := a.createSession(user.ID)
	if err != nil {
		a.logger.Printf("create session after email verify: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Email подтвержден, но вход выполнить не удалось.")
		return
	}

	http.SetCookie(w, a.sessionCookie(sessionToken, expiresAt))
	http.Redirect(w, r, "/app", http.StatusSeeOther)
}

func (a *Application) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := userFromContext(r.Context())
	if user == nil {
		http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
		return
	}

	data := viewData{
		AppName: a.cfg.AppName,
		Title:   "Рабочее пространство",
		User:    user,
	}

	stats, err := a.getAuthStats()
	if err != nil {
		a.logger.Printf("get dashboard stats: %v", err)
	} else {
		data.UsersTotal = stats.UsersTotal
		data.ActiveSessions = stats.ActiveSessions
	}

	a.renderTemplate(w, "dashboard.tmpl", data)
}

func (a *Application) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if cookie, err := r.Cookie(a.cfg.SessionCookieName); err == nil {
		if err := a.deleteSessionByToken(cookie.Value); err != nil {
			a.logger.Printf("delete session on logout: %v", err)
		}
	}

	a.clearSessionCookie(w)
	http.Redirect(w, r, "/auth/login?success=Вы вышли из системы.", http.StatusSeeOther)
}

func (a *Application) renderPlainMessage(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(message))
}

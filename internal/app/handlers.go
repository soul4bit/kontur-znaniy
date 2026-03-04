package app

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"unicode/utf8"

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

func (a *Application) appViewData(user *User, title string) viewData {
	return viewData{
		AppName:    a.cfg.AppName,
		Title:      title,
		User:       user,
		Sections:   wikiSections(),
		S3Endpoint: a.cfg.S3Endpoint,
		S3Bucket:   a.cfg.S3Bucket,
	}
}

func decorateArticles(articles []Article) {
	for i := range articles {
		articles[i].SectionName = wikiSectionName(articles[i].SectionSlug)
	}
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

		data := a.authViewData("Р’С…РѕРґ")
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

		data := a.authViewData("Р’С…РѕРґ")
		data.Email = email
		data.Next = next

		if email == "" || password == "" {
			data.Error = "Р’РІРµРґРёС‚Рµ email Рё РїР°СЂРѕР»СЊ."
			a.renderTemplate(w, "login.tmpl", data)
			return
		}

		creds, err := a.getCredentialsByEmail(email)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				if reg, regErr := a.getRegistrationRequestByEmail(email); regErr == nil {
					switch reg.Status {
					case registrationStatusPending:
						data.Error = "Р—Р°СЏРІРєР° РµС‰Рµ РЅР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё. Р”РѕР¶РґРёС‚РµСЃСЊ СЂРµС€РµРЅРёСЏ РІ РїРёСЃСЊРјРµ."
					case registrationStatusApproved:
						data.Error = "Р—Р°СЏРІРєР° РѕРґРѕР±СЂРµРЅР°. РџРѕРґС‚РІРµСЂРґРёС‚Рµ email РїРѕ СЃСЃС‹Р»РєРµ РёР· РїРёСЃСЊРјР°."
					case registrationStatusRejected:
						data.Error = "Р—Р°СЏРІРєР° РѕС‚РєР»РѕРЅРµРЅР°. РњРѕР¶РЅРѕ РѕС‚РїСЂР°РІРёС‚СЊ РЅРѕРІСѓСЋ СЂРµРіРёСЃС‚СЂР°С†РёСЋ."
					default:
						data.Error = "РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ."
					}
				} else {
					data.Error = "РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ."
				}
				a.renderTemplate(w, "login.tmpl", data)
				return
			}
			a.logger.Printf("get credentials by email: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(password)); err != nil {
			data.Error = "РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ."
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

		a.renderTemplate(w, "register.tmpl", a.authViewData("Р РµРіРёСЃС‚СЂР°С†РёСЏ"))
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Error(w, "invalid form data", http.StatusBadRequest)
			return
		}

		name := strings.TrimSpace(r.FormValue("name"))
		email := normalizeEmail(r.FormValue("email"))
		password := r.FormValue("password")
		confirmPassword := r.FormValue("confirm_password")

		data := a.authViewData("Р РµРіРёСЃС‚СЂР°С†РёСЏ")
		data.Name = name
		data.Email = email

		if !a.hasRegistrationIntegrations() {
			data.Error = "Р РµРіРёСЃС‚СЂР°С†РёСЏ РІСЂРµРјРµРЅРЅРѕ РЅРµРґРѕСЃС‚СѓРїРЅР°: РЅРµ РЅР°СЃС‚СЂРѕРµРЅС‹ SMTP/Telegram РёРЅС‚РµРіСЂР°С†РёРё."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if len(name) < 2 {
			data.Error = "РќРёРє РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РјРёРЅРёРјСѓРј 2 СЃРёРјРІРѕР»Р°."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if _, err := mail.ParseAddress(email); err != nil {
			data.Error = "Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ email."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if len(password) < 10 {
			data.Error = "РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РЅРµ РєРѕСЂРѕС‡Рµ 10 СЃРёРјРІРѕР»РѕРІ."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if password != confirmPassword {
			data.Error = "РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		if existingUser, err := a.getUserByEmail(email); err == nil && existingUser != nil {
			data.Error = "РђРєРєР°СѓРЅС‚ СЃ С‚Р°РєРёРј email СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚."
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
				data.Error = "Р—Р°СЏРІРєР° СѓР¶Рµ РѕС‚РїСЂР°РІР»РµРЅР° Рё Р¶РґРµС‚ СЂРµС€РµРЅРёСЏ РјРѕРґРµСЂР°С‚РѕСЂР°."
				a.renderTemplate(w, "register.tmpl", data)
				return
			case registrationStatusApproved:
				data.Error = "Р—Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°. РџСЂРѕРІРµСЂСЊС‚Рµ РїРёСЃСЊРјРѕ Рё РїРѕРґС‚РІРµСЂРґРёС‚Рµ email."
				a.renderTemplate(w, "register.tmpl", data)
				return
			case registrationStatusCompleted:
				data.Error = "Р­С‚РѕС‚ email СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ Рё Р°РєС‚РёРІРёСЂРѕРІР°РЅ. Р’РѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚."
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

		if err := a.sendRegistrationRequestToTelegram(request, r); err != nil {
			a.logger.Printf("send registration request to telegram: %v", err)
			if delErr := a.deleteRegistrationRequestByEmail(email); delErr != nil {
				a.logger.Printf("rollback registration request after telegram error: %v", delErr)
			}
			data.Error = "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ РјРѕРґРµСЂР°С‚РѕСЂСѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р· С‡СѓС‚СЊ РїРѕР·Р¶Рµ."
			a.renderTemplate(w, "register.tmpl", data)
			return
		}

		success := url.QueryEscape("Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. РџРѕСЃР»Рµ СЂРµС€РµРЅРёСЏ РјРѕРґРµСЂР°С‚РѕСЂР° РїСЂРёРґРµС‚ РїРёСЃСЊРјРѕ.")
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
		a.renderModerationPage(w, http.StatusBadRequest, "РќРµРєРѕСЂСЂРµРєС‚РЅР°СЏ СЃСЃС‹Р»РєР°", "РџСѓСЃС‚РѕР№ С‚РѕРєРµРЅ РјРѕРґРµСЂР°С†РёРё.")
		return
	}

	emailVerifyToken, err := generateSessionToken()
	if err != nil {
		a.logger.Printf("generate email verify token: %v", err)
		a.renderModerationPage(w, http.StatusInternalServerError, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР°", "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ С‚РѕРєРµРЅ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ email.")
		return
	}

	req, err := a.approveRegistrationRequest(token, emailVerifyToken)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			existing, lookupErr := a.getRegistrationRequestByModerationToken(token)
			if lookupErr != nil {
				a.renderModerationPage(w, http.StatusNotFound, "Р—Р°СЏРІРєР° РЅРµ РЅР°Р№РґРµРЅР°", "Р—Р°СЏРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё СЃСЃС‹Р»РєР° СѓСЃС‚Р°СЂРµР»Р°.")
				return
			}

			switch existing.Status {
			case registrationStatusApproved:
				if existing.EmailVerifyToken.Valid && strings.TrimSpace(existing.EmailVerifyToken.String) != "" {
					if mailErr := a.sendRegistrationApprovedEmail(existing); mailErr != nil {
						a.logger.Printf("resend approved email: %v", mailErr)
						a.renderModerationPage(w, http.StatusInternalServerError, "РџРёСЃСЊРјРѕ РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ", "Р—Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°, РЅРѕ РїРёСЃСЊРјРѕ РїРѕРІС‚РѕСЂРЅРѕ РѕС‚РїСЂР°РІРёС‚СЊ РЅРµ СѓРґР°Р»РѕСЃСЊ.")
						return
					}
					a.renderModerationPage(w, http.StatusOK, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°", "РџРёСЃСЊРјРѕ СЃ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµРј РѕС‚РїСЂР°РІР»РµРЅРѕ РїРѕРІС‚РѕСЂРЅРѕ.")
					return
				}
				a.renderModerationPage(w, http.StatusOK, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°", "Р­С‚Р° Р·Р°СЏРІРєР° СѓР¶Рµ Р±С‹Р»Р° РѕР±СЂР°Р±РѕС‚Р°РЅР° СЂР°РЅРµРµ.")
			case registrationStatusRejected:
				a.renderModerationPage(w, http.StatusConflict, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕС‚РєР»РѕРЅРµРЅР°", "Р­С‚Р° Р·Р°СЏРІРєР° СѓР¶Рµ РѕС‚РєР»РѕРЅРµРЅР°.")
			case registrationStatusCompleted:
				a.renderModerationPage(w, http.StatusConflict, "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СѓР¶Рµ Р°РєС‚РёРІРёСЂРѕРІР°РЅ", "Email СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ, РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ Р°РєС‚РёРІРёСЂРѕРІР°РЅ.")
			default:
				a.renderModerationPage(w, http.StatusConflict, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕР±СЂР°Р±РѕС‚Р°РЅР°", "Р­С‚Р° СЃСЃС‹Р»РєР° СѓР¶Рµ Р±С‹Р»Р° РёСЃРїРѕР»СЊР·РѕРІР°РЅР°.")
			}
			return
		}

		a.logger.Printf("approve registration request: %v", err)
		a.renderModerationPage(w, http.StatusInternalServerError, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР°", "РћС€РёР±РєР° РїСЂРё РѕРґРѕР±СЂРµРЅРёРё Р·Р°СЏРІРєРё.")
		return
	}

	if err := a.sendRegistrationApprovedEmail(req); err != nil {
		a.logger.Printf("send approved email: %v", err)
		a.renderModerationPage(
			w,
			http.StatusInternalServerError,
			"РџРёСЃСЊРјРѕ РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ",
			"Р—Р°СЏРІРєР° РѕРґРѕР±СЂРµРЅР°, РЅРѕ РїРёСЃСЊРјРѕ РѕС‚РїСЂР°РІРёС‚СЊ РЅРµ СѓРґР°Р»РѕСЃСЊ. РќР°Р¶РјРёС‚Рµ СЌС‚Сѓ Р¶Рµ СЃСЃС‹Р»РєСѓ РµС‰Рµ СЂР°Р· РґР»СЏ РїРѕРІС‚РѕСЂРЅРѕР№ РѕС‚РїСЂР°РІРєРё.",
		)
		return
	}

	a.renderModerationPage(w, http.StatusOK, "Р—Р°СЏРІРєР° РѕРґРѕР±СЂРµРЅР°", fmt.Sprintf("РќР° %s РѕС‚РїСЂР°РІР»РµРЅРѕ РїРёСЃСЊРјРѕ СЃ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµРј.", req.Email))
}

func (a *Application) handleRejectRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		a.renderModerationPage(w, http.StatusBadRequest, "РќРµРєРѕСЂСЂРµРєС‚РЅР°СЏ СЃСЃС‹Р»РєР°", "РџСѓСЃС‚РѕР№ С‚РѕРєРµРЅ РјРѕРґРµСЂР°С†РёРё.")
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
				a.renderModerationPage(w, http.StatusNotFound, "Р—Р°СЏРІРєР° РЅРµ РЅР°Р№РґРµРЅР°", "Р—Р°СЏРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РёР»Рё СЃСЃС‹Р»РєР° СѓСЃС‚Р°СЂРµР»Р°.")
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
					a.renderModerationPage(w, http.StatusInternalServerError, "РџРёСЃСЊРјРѕ РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ", "Р—Р°СЏРІРєР° СѓР¶Рµ РѕС‚РєР»РѕРЅРµРЅР°, РЅРѕ РїРѕРІС‚РѕСЂРЅРѕ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ РЅРµ СѓРґР°Р»РѕСЃСЊ.")
					return
				}
				a.renderModerationPage(w, http.StatusOK, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕС‚РєР»РѕРЅРµРЅР°", "РџРёСЃСЊРјРѕ СЃ СЂРµС€РµРЅРёРµРј РѕС‚РїСЂР°РІР»РµРЅРѕ РїРѕРІС‚РѕСЂРЅРѕ.")
			case registrationStatusApproved:
				a.renderModerationPage(w, http.StatusConflict, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°", "Р­С‚Р° Р·Р°СЏРІРєР° СѓР¶Рµ РѕРґРѕР±СЂРµРЅР°.")
			case registrationStatusCompleted:
				a.renderModerationPage(w, http.StatusConflict, "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СѓР¶Рµ Р°РєС‚РёРІРёСЂРѕРІР°РЅ", "Email СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ, РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ Р°РєС‚РёРІРёСЂРѕРІР°РЅ.")
			default:
				a.renderModerationPage(w, http.StatusConflict, "Р—Р°СЏРІРєР° СѓР¶Рµ РѕР±СЂР°Р±РѕС‚Р°РЅР°", "Р­С‚Р° СЃСЃС‹Р»РєР° СѓР¶Рµ Р±С‹Р»Р° РёСЃРїРѕР»СЊР·РѕРІР°РЅР°.")
			}
			return
		}

		a.logger.Printf("reject registration request: %v", err)
		a.renderModerationPage(w, http.StatusInternalServerError, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР°", "РћС€РёР±РєР° РїСЂРё РѕС‚РєР»РѕРЅРµРЅРёРё Р·Р°СЏРІРєРё.")
		return
	}

	if err := a.sendRegistrationRejectedEmail(req, reason); err != nil {
		a.logger.Printf("send rejected email: %v", err)
		a.renderModerationPage(
			w,
			http.StatusInternalServerError,
			"РџРёСЃСЊРјРѕ РЅРµ РѕС‚РїСЂР°РІР»РµРЅРѕ",
			"Р—Р°СЏРІРєР° РѕС‚РєР»РѕРЅРµРЅР°, РЅРѕ РїРёСЃСЊРјРѕ РѕС‚РїСЂР°РІРёС‚СЊ РЅРµ СѓРґР°Р»РѕСЃСЊ. РќР°Р¶РјРёС‚Рµ СЌС‚Сѓ Р¶Рµ СЃСЃС‹Р»РєСѓ РµС‰Рµ СЂР°Р· РґР»СЏ РїРѕРІС‚РѕСЂРЅРѕР№ РѕС‚РїСЂР°РІРєРё.",
		)
		return
	}

	a.renderModerationPage(w, http.StatusOK, "Р—Р°СЏРІРєР° РѕС‚РєР»РѕРЅРµРЅР°", fmt.Sprintf("РќР° %s РѕС‚РїСЂР°РІР»РµРЅРѕ РїРёСЃСЊРјРѕ СЃ СЂРµС€РµРЅРёРµРј.", req.Email))
}

func (a *Application) handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		a.renderPlainMessage(w, http.StatusBadRequest, "РџСѓСЃС‚РѕР№ С‚РѕРєРµРЅ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ email.")
		return
	}

	user, err := a.completeRegistrationByVerifyToken(token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			a.renderPlainMessage(w, http.StatusBadRequest, "РЎСЃС‹Р»РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅР° РёР»Рё СѓР¶Рµ РёСЃРїРѕР»СЊР·РѕРІР°РЅР°.")
			return
		}
		a.logger.Printf("complete registration by verify token: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "РћС€РёР±РєР° РїСЂРё РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРё email.")
		return
	}

	sessionToken, expiresAt, err := a.createSession(user.ID)
	if err != nil {
		a.logger.Printf("create session after email verify: %v", err)
		a.renderPlainMessage(w, http.StatusInternalServerError, "Email РїРѕРґС‚РІРµСЂР¶РґРµРЅ, РЅРѕ РІС…РѕРґ РІС‹РїРѕР»РЅРёС‚СЊ РЅРµ СѓРґР°Р»РѕСЃСЊ.")
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

	data := a.appViewData(user, "Контур знаний")
	data.CurrentPage = "dashboard"
	data.Success = strings.TrimSpace(r.URL.Query().Get("success"))

	recent, err := a.getRecentArticles(8)
	if err != nil {
		a.logger.Printf("get recent articles: %v", err)
	} else {
		decorateArticles(recent)
		data.RecentArticles = recent
	}

	a.renderTemplate(w, "dashboard.tmpl", data)
}

func (a *Application) handleSection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := userFromContext(r.Context())
	if user == nil {
		http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
		return
	}

	sectionSlug := strings.TrimSpace(r.URL.Query().Get("slug"))
	section, ok := findWikiSection(sectionSlug)
	if !ok {
		http.NotFound(w, r)
		return
	}

	data := a.appViewData(user, "Раздел: "+section.Name)
	data.CurrentPage = "section"
	data.CurrentSection = &section
	data.CurrentSectionSlug = section.Slug
	data.Success = strings.TrimSpace(r.URL.Query().Get("success"))

	articles, err := a.getArticlesBySection(section.Slug, 100)
	if err != nil {
		a.logger.Printf("get articles by section: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	decorateArticles(articles)
	data.SectionArticles = articles

	a.renderTemplate(w, "section.tmpl", data)
}

func (a *Application) handleArticleNew(w http.ResponseWriter, r *http.Request) {
	user := userFromContext(r.Context())
	if user == nil {
		http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
		return
	}

	switch r.Method {
	case http.MethodGet:
		sectionSlug := strings.TrimSpace(r.URL.Query().Get("section"))
		section, ok := findWikiSection(sectionSlug)
		if !ok {
			http.Redirect(w, r, "/app", http.StatusSeeOther)
			return
		}

		data := a.appViewData(user, "Новая статья")
		data.CurrentPage = "article-new"
		data.CurrentSection = &section
		data.CurrentSectionSlug = section.Slug
		a.renderTemplate(w, "article_new.tmpl", data)
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Error(w, "invalid form data", http.StatusBadRequest)
			return
		}

		sectionSlug := strings.TrimSpace(r.FormValue("section"))
		section, ok := findWikiSection(sectionSlug)
		if !ok {
			http.Error(w, "unknown section", http.StatusBadRequest)
			return
		}

		title := strings.TrimSpace(r.FormValue("title"))
		body := strings.TrimSpace(r.FormValue("body"))

		data := a.appViewData(user, "Новая статья")
		data.CurrentPage = "article-new"
		data.CurrentSection = &section
		data.CurrentSectionSlug = section.Slug
		data.ArticleTitle = title
		data.ArticleBody = body

		if utf8.RuneCountInString(title) < 4 {
			data.Error = "Заголовок должен быть минимум 4 символа."
			a.renderTemplate(w, "article_new.tmpl", data)
			return
		}

		if utf8.RuneCountInString(body) < 20 {
			data.Error = "Текст статьи должен быть минимум 20 символов."
			a.renderTemplate(w, "article_new.tmpl", data)
			return
		}

		if _, err := a.createArticle(user.ID, section.Slug, title, body); err != nil {
			a.logger.Printf("create article: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		success := url.QueryEscape("Статья сохранена.")
		http.Redirect(w, r, "/app/section?slug="+url.QueryEscape(section.Slug)+"&success="+success, http.StatusSeeOther)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *Application) handleS3Check(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := userFromContext(r.Context())
	if user == nil {
		http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
		return
	}

	data := a.appViewData(user, "Проверка S3")
	data.CurrentPage = "s3"

	if strings.TrimSpace(r.URL.Query().Get("run")) == "1" {
		result := a.checkS3(r.Context())
		data.S3Check = &result
	}

	a.renderTemplate(w, "s3_check.tmpl", data)
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
	http.Redirect(w, r, "/auth/login?success=Р’С‹ РІС‹С€Р»Рё РёР· СЃРёСЃС‚РµРјС‹.", http.StatusSeeOther)
}

func (a *Application) renderModerationPage(w http.ResponseWriter, status int, title string, message string) {
	pageTitle := strings.TrimSpace(title)
	if pageTitle == "" {
		pageTitle = "РЎС‚Р°С‚СѓСЃ РјРѕРґРµСЂР°С†РёРё"
	}

	pageMessage := strings.TrimSpace(message)
	if pageMessage == "" {
		pageMessage = "РћРїРµСЂР°С†РёСЏ Р·Р°РІРµСЂС€РµРЅР°."
	}

	appName := strings.TrimSpace(a.cfg.AppName)
	if appName == "" {
		appName = "Kontur Znaniy"
	}

	accent := "#0d766d"
	glow := "rgba(13, 118, 109, 0.28)"
	badge := "РњРѕРґРµСЂР°С†РёСЏ"
	if status >= http.StatusInternalServerError {
		accent = "#8f2d3f"
		glow = "rgba(143, 45, 63, 0.28)"
		badge = "РЎР±РѕР№"
	} else if status >= http.StatusBadRequest {
		accent = "#9a5b2f"
		glow = "rgba(154, 91, 47, 0.28)"
		badge = "Р’РЅРёРјР°РЅРёРµ"
	}

	escapedTitle := html.EscapeString(pageTitle)
	escapedMessage := html.EscapeString(pageMessage)
	escapedMessage = strings.ReplaceAll(escapedMessage, "\n", "<br />")
	escapedAppName := html.EscapeString(appName)
	escapedBadge := html.EscapeString(badge)

	actionHref := "/auth/login"
	actionLabel := "РћС‚РєСЂС‹С‚СЊ РІС…РѕРґ"
	if status >= http.StatusBadRequest {
		actionHref = "/auth/register"
		actionLabel = "Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє С„РѕСЂРјРµ"
	}

	page := fmt.Sprintf(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>%s В· %s</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: only light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      font-family: "Manrope", "Segoe UI", "Trebuchet MS", sans-serif;
      background:
        radial-gradient(circle at 12%% 10%%, rgba(13, 118, 109, 0.25), transparent 36%%),
        radial-gradient(circle at 86%% 8%%, rgba(201, 153, 96, 0.22), transparent 30%%),
        linear-gradient(160deg, #f2f4ee 0%%, #e7ece4 100%%);
      color: #17211f;
    }
    .panel {
      width: min(640px, 100%%);
      border: 1px solid #d3ddd7;
      border-radius: 22px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 22px 58px %s;
      animation: panel-in .28s ease-out both;
    }
    .head {
      padding: 20px 24px;
      color: #f4fffc;
      background: linear-gradient(145deg, #0b5e57 0%%, #0d766d 58%%, #1a8d84 100%%);
    }
    .eyebrow {
      margin: 0 0 8px;
      letter-spacing: .14em;
      text-transform: uppercase;
      font-size: 12px;
      font-family: "IBM Plex Mono", "Consolas", monospace;
      color: rgba(237, 253, 248, .88);
    }
    .title {
      margin: 0;
      font-size: clamp(28px, 4vw, 34px);
      line-height: 1.1;
    }
    .body {
      padding: 22px 24px 24px;
      display: grid;
      gap: 16px;
    }
    .badge {
      width: fit-content;
      border-radius: 999px;
      padding: 6px 12px;
      border: 1px solid rgba(23, 33, 31, 0.14);
      background: #f8fbf8;
      color: #52645e;
      font-size: 12px;
      font-family: "IBM Plex Mono", "Consolas", monospace;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .message {
      margin: 0;
      line-height: 1.65;
      color: #31413c;
      font-size: 16px;
    }
    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      padding-top: 6px;
    }
    .action-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      padding: 11px 16px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      background: %s;
      box-shadow: 0 14px 34px %s;
    }
    .action-link:hover { filter: brightness(1.05); }
    .muted {
      font-size: 13px;
      color: #63766f;
    }
    @keyframes panel-in {
      from { opacity: 0; transform: translateY(8px) scale(.992); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (max-width: 680px) {
      .head { padding: 18px 18px; }
      .body { padding: 18px 18px 20px; }
      .title { font-size: 27px; }
    }
  </style>
</head>
<body>
  <main class="panel">
    <header class="head">
      <p class="eyebrow">%s В· %s</p>
      <h1 class="title">%s</h1>
    </header>
    <section class="body">
      <span class="badge">%s</span>
      <p class="message">%s</p>
      <div class="actions">
        <a class="action-link" href="%s">%s</a>
        <span class="muted">РњРѕР¶РЅРѕ Р·Р°РєСЂС‹С‚СЊ РІРєР»Р°РґРєСѓ РїРѕСЃР»Рµ РїСЂРѕСЃРјРѕС‚СЂР°.</span>
      </div>
    </section>
  </main>
</body>
</html>`,
		escapedTitle,
		escapedAppName,
		glow,
		accent,
		glow,
		escapedAppName,
		escapedBadge,
		escapedTitle,
		escapedBadge,
		escapedMessage,
		html.EscapeString(actionHref),
		html.EscapeString(actionLabel),
	)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(page))
}

func (a *Application) renderPlainMessage(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(message))
}

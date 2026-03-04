# Контур Знаний (Full Go)

Полный перезапуск проекта на Go без Node/Next.

Текущий этап: базовый auth-контур:
- регистрация
- вход
- выход
- защищенная страница `/app`

## Стек

- Go `net/http`
- HTML templates
- SQLite (`modernc.org/sqlite`, pure Go)
- `bcrypt` для паролей
- Сессии в БД + HttpOnly cookie

## Быстрый старт

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Запустите сервер:

```bash
go run ./cmd/server
```

3. Откройте:

`http://localhost:8080`

## Переменные окружения

```env
APP_NAME="Контур Знаний"
APP_PORT=8080
APP_ENV=development
DATABASE_DSN="file:data/kontur.db"
SESSION_COOKIE_NAME=kontur_session
SESSION_TTL_HOURS=168
SECURE_COOKIES=false
```

## Структура

```text
cmd/server/main.go        # запуск HTTP сервера
internal/config           # конфиг из env
internal/app              # handlers + store + auth/session
web/templates             # html шаблоны
web/static                # css
```

## Что дальше

- подтверждение email
- восстановление пароля
- роли/ACL
- Wiki-узлы и граф знаний

## Deploy на VPS

Workflow: `.github/workflows/deploy.yml`

Что делает:
- синхронизирует репозиторий в `/var/www/kontur-znaniy`
- собирает бинарник `bin/kontur-znaniy`
- устанавливает/обновляет systemd unit `kontur-znaniy.service`
- перезапускает `kontur-znaniy`

Нужные secrets в GitHub:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`

Перед первым деплоем на сервере:

```bash
mkdir -p /var/www/kontur-znaniy
cd /var/www/kontur-znaniy
git clone <repo-url> .
cp .env.example .env
# заполните .env
```

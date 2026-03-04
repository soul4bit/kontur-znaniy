# Контур Знаний (Full Go)

Go-приложение с авторизацией, модерацией регистрации через Telegram и подтверждением email.

## Что уже работает

- Заявка на регистрацию (`/auth/register`)
- Отправка заявки админу в Telegram (`Одобрить` / `Отклонить`)
- Письмо пользователю после решения модератора
- Подтверждение email по ссылке из письма
- Создание аккаунта только после подтверждения email
- Вход/выход и защищенная страница `/app`

## Стек

- Go `net/http`
- HTML templates
- PostgreSQL
- `database/sql` + `pgx`
- `bcrypt` для паролей
- SMTP для писем
- Telegram Bot API для модерации заявок

## Быстрый старт

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

## Разделы и статьи

- `/app` — главная панель.
- `/app/section?slug=linux` — страница раздела с заметками.
- `/app/article/new?section=linux` — форма создания статьи в разделе.

Доступные `slug`: `linux`, `docker`, `network`, `k8s`, `ci-cd`, `general`.

## Как проверить S3

1. Заполните в `.env`:
   - `S3_ENDPOINT`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
2. Откройте в приложении `/app/s3`.
3. Нажмите `Запустить проверку`.

Если всё настроено корректно, страница покажет: `S3 подключен: бакет доступен, ключи валидны.`

2. Поднимите PostgreSQL:

```bash
docker run --name kontur-postgres \
  -e POSTGRES_USER=kontur_znaniy \
  -e POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD \
  -e POSTGRES_DB=kontur_znaniy \
  -p 5432:5432 -d postgres:16
```

3. Запустите сервер:

```bash
go run ./cmd/server
```

4. Откройте:

`http://localhost:8080`

## Переменные окружения

```env
APP_NAME="Контур Знаний"
APP_PORT=8080
APP_ENV=development
APP_BASE_URL="http://localhost:8080"

DATABASE_URL="postgres://kontur_znaniy:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/kontur_znaniy?sslmode=disable"

SESSION_COOKIE_NAME=kontur_session
SESSION_TTL_HOURS=168
SECURE_COOKIES=false

SMTP_HOST=smtp.beget.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="kontur-znaniy@xn----8sbuffbvcbexxn.xn--p1ai"
SMTP_PASSWORD="CHANGE_ME_SMTP_PASSWORD"
MAIL_FROM="Kontur <kontur-znaniy@xn----8sbuffbvcbexxn.xn--p1ai>"

TELEGRAM_BOT_TOKEN=CHANGE_ME_TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID=CHANGE_ME_TELEGRAM_ID

S3_ENDPOINT="https://s3.ru1.storage.beget.cloud"
S3_BUCKET="156f31dd20b1-kontur-znaniy-s3"
S3_ACCESS_KEY="CHANGE_ME_S3_ACCESS_KEY"
S3_SECRET_KEY="CHANGE_ME_S3_SECRET_KEY"
S3_PUBLIC_BASE_URL="https://files.xn----8sbuffbvcbexxn.xn--p1ai"
```

## S3 стратегия

- Статьи и метаданные лучше хранить в PostgreSQL.
- Файлы (вложения, картинки, экспорты) лучше складывать в S3.
- Для удобных ссылок на скачивание используйте `S3_PUBLIC_BASE_URL` (ваш поддомен `files.*`).
- Ключи доступа храните только в `.env` на сервере и в GitHub Secrets, не в репозитории.

## Как работает регистрация

1. Пользователь отправляет форму регистрации.
2. Создается заявка со статусом `pending`.
3. Админу в Telegram приходит сообщение с кнопками `Одобрить` / `Отклонить`.
4. При одобрении пользователю отправляется письмо со ссылкой подтверждения email.
5. После перехода по ссылке создается аккаунт и пользователь автоматически входит в систему.

## Структура

```text
cmd/server/main.go        # запуск HTTP сервера
internal/config           # конфиг из env
internal/app              # handlers + store + auth/session + уведомления
web/templates             # html шаблоны
web/static                # css/js
```

## Deploy на VPS

Workflow: `.github/workflows/deploy.yml`

Перед первым деплоем:

```bash
mkdir -p /var/www/kontur-znaniy
cd /var/www/kontur-znaniy
git clone <repo-url> .
cp .env.example .env
```

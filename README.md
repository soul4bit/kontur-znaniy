# Контур Знаний (Full Go)

Полный перезапуск проекта на Go без Node/Next.

Текущий этап:
- регистрация
- вход
- выход
- защищенная страница `/app`

## Стек

- Go `net/http`
- HTML templates
- PostgreSQL
- `database/sql` + `pgx` драйвер
- `bcrypt` для паролей
- Сессии в БД + HttpOnly cookie

## Быстрый старт

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Поднимите PostgreSQL (локально пример):

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
DATABASE_URL="postgres://kontur_znaniy:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/kontur_znaniy?sslmode=disable"
SESSION_COOKIE_NAME=kontur_session
SESSION_TTL_HOURS=168
SECURE_COOKIES=false
```

## Очистить old `nook` и создать новую БД

Внимание: команды ниже удаляют старые сущности `nook`.

```bash
sudo -u postgres psql <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname IN ('nook', 'kontur_znaniy')
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS nook;
DROP ROLE IF EXISTS nook;
DROP DATABASE IF EXISTS kontur_znaniy;
DROP ROLE IF EXISTS kontur_znaniy;

CREATE ROLE kontur_znaniy WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE kontur_znaniy OWNER kontur_znaniy;
SQL
```

Потом проверьте `.env`:

```bash
DATABASE_URL="postgres://kontur_znaniy:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/kontur_znaniy?sslmode=disable"
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
- wiki-узлы и граф знаний

## Deploy на VPS

Workflow: `.github/workflows/deploy.yml`

Что делает:
- синхронизирует репозиторий в `/var/www/kontur-znaniy`
- собирает бинарник `bin/kontur-znaniy`
- перезапускает `kontur-znaniy` через systemd

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
```

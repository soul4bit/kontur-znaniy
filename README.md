# Контур Знаний

Личная DevOps-вики: заметки, статьи и база знаний в одном месте.

![Обложка проекта](./public/readme/hero.svg)

## Что уже есть

- Авторизация и регистрация на `Better Auth` + `PostgreSQL`
- Защита auth-форм (rate limit и guard-логи в БД)
- Статьи в формате `markdown + html + json (Tiptap)`
- Категории и темы (Linux, Docker, Сети, Ansible, K8S, Terraform, CI/CD)
- Картинки в статьях
- Профиль пользователя (аватар, смена пароля с ограничением по времени)
- Полнотекстовый поиск по статьям (PostgreSQL FTS)
- Wiki-ссылки в тексте `[[slug-статьи]]`
- Кодовые сниппеты с подсветкой и кнопкой `Копировать`

## Архитектура

![Схема архитектуры](./public/readme/architecture.svg)

## Стек

- `Next.js 16` (App Router, SSR)
- `React 19`
- `Tailwind CSS + shadcn/ui`
- `Tiptap`
- `PostgreSQL (pg)`
- `Better Auth`
- `Nodemailer (SMTP)`
- `highlight.js` (подсветка кода)
- `Dexie` (опционально, для локального кеша)

## Быстрый старт (локально)

1. Установить Node.js LTS (рекомендуется Node 22+).
2. Скопировать переменные окружения:
   ```bash
   cp .env.example .env.local
   ```
3. Заполнить `.env.local` (пример ниже).
4. Установить зависимости:
   ```bash
   npm ci
   ```
5. Выполнить миграции:
   ```bash
   npm run auth:migrate
   npm run auth:guard:migrate
   npm run articles:migrate
   npm run account:migrate
   ```
6. Создать администратора:
   ```bash
   npm run admin:create -- --email=admin@example.com --password=CHANGE_ME --name="Admin"
   ```
7. Запустить проект:
   ```bash
   npm run dev
   ```
8. Открыть `http://localhost:3000`.

## Переменные окружения

Пример файла: [`.env.example`](./.env.example)

```env
DATABASE_URL=postgres://nook:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/nook
BETTER_AUTH_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
BETTER_AUTH_URL=http://localhost:3000
SMTP_HOST=smtp.beget.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=nook@wiki-soul4bit.ru
SMTP_PASSWORD=CHANGE_ME_MAIL_PASSWORD
MAIL_FROM="Nook <nook@wiki-soul4bit.ru>"
```

## Полезные npm-скрипты

```bash
npm run dev
npm run build
npm run start
npm run lint

npm run auth:sql
npm run auth:migrate
npm run auth:guard:migrate
npm run articles:migrate
npm run account:migrate

npm run admin:create -- --email=admin@example.com --password=CHANGE_ME --name="Admin"
```

## Деплой на VPS (Nginx + systemd)

Базовый порядок:

1. На сервере:
   ```bash
   cd /var/www/nook
   git pull --ff-only origin main
   npm ci
   npm run auth:migrate
   npm run auth:guard:migrate
   npm run articles:migrate
   npm run account:migrate
   npm run build
   sudo systemctl restart nook
   ```
2. Проверка сервиса:
   ```bash
   sudo systemctl status nook --no-pager
   sudo journalctl -u nook -n 100 --no-pager
   ```

## SSL и домен

- Для IDN-домена (кириллица) в `certbot` и `nginx` используйте `punycode` (`xn--...`).
- Перед выпуском сертификата убедитесь, что домен уже резолвится:
  ```bash
  dig +short A your-domain
  ```
- После смены домена обновите:
  - `BETTER_AUTH_URL`
  - `MAIL_FROM` и SMTP (если меняется почтовый домен)

## Поиск, wiki-ссылки и сниппеты

- Поиск: строка в боковой панели `/app` ищет по `title`, `summary`, `content_text`, `content_markdown`.
- Wiki-ссылки: в тексте статьи пишите `[[slug-статьи]]`.
- Сниппеты: код-блоки в статье рендерятся с подсветкой и кнопкой копирования.

## Частые проблемы

- `Supabase env vars missing...`
  - Проект больше не использует Supabase. Проверьте, что заполнены `DATABASE_URL` и `BETTER_AUTH_*`.
- `Form is outdated` / `Слишком быстрый запрос`
  - Обновите страницу и повторите ввод.
- `password authentication failed for user`
  - Проверьте пароль пользователя PostgreSQL в `DATABASE_URL`.
- `NXDOMAIN` при certbot
  - DNS-запись домена еще не разошлась или указан неверный `punycode`.

## Планы развития

- История версий статей + diff + откат
- Экспорт/импорт базы статей (markdown + assets)
- Backlinks и граф связей между статьями
- ACL/роли для командной работы

import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for registration approval migrations.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const migrationSql = `
  create table if not exists registration_requests (
    id text primary key,
    email text not null,
    name text not null,
    password_hash text not null,
    callback_url text not null default '',
    status text not null default 'pending',
    request_ip text not null default 'unknown',
    user_agent text not null default 'unknown',
    approve_token_hash text not null unique,
    reject_token_hash text not null unique,
    requested_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by text,
    review_note text,
    created_user_id text references "user"(id) on delete set null,
    telegram_chat_id text,
    telegram_message_id text
  );

  create unique index if not exists registration_requests_pending_email_idx
    on registration_requests(email)
    where status = 'pending';

  create index if not exists registration_requests_status_requested_idx
    on registration_requests(status, requested_at desc);
`;

try {
  await pool.query(migrationSql);
  console.log("Registration approval migration completed.");
} finally {
  await pool.end();
}

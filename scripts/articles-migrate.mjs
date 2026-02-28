import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for article migrations.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const migrationSql = `
  create table if not exists articles (
    id text primary key,
    author_id text not null references "user"(id) on delete cascade,
    updated_by_id text references "user"(id) on delete set null,
    title text not null,
    slug text not null,
    topic text not null,
    summary text not null,
    content_html text not null,
    content_json jsonb not null,
    content_text text not null,
    cover_image_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table articles
    add column if not exists updated_by_id text references "user"(id) on delete set null;

  update articles
  set updated_by_id = author_id
  where updated_by_id is null;

  create unique index if not exists articles_author_slug_idx
    on articles(author_id, slug);

  create index if not exists articles_author_updated_idx
    on articles(author_id, updated_at desc);
`;

try {
  await pool.query(migrationSql);
  console.log("Articles migration completed.");
} finally {
  await pool.end();
}

import { randomUUID } from "crypto";
import { pool } from "@/lib/auth/server";
import { articleTopicNames, type ArticleTopic } from "@/lib/content/devops-library";

type ArticleRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  topic: string;
  summary: string;
  content_html: string;
  content_json: Record<string, unknown>;
  content_text: string;
  cover_image_path: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  topic: ArticleTopic;
  summary: string;
  updatedAt: string;
};

export type ArticleRecord = ArticleListItem & {
  contentHtml: string;
  contentJson: Record<string, unknown>;
  contentText: string;
  coverImagePath: string | null;
  createdAt: string;
};

export type SaveArticleInput = {
  authorId: string;
  title: string;
  topic: ArticleTopic;
  summary: string;
  contentHtml: string;
  contentJson: Record<string, unknown>;
  contentText: string;
};

function mapArticle(row: ArticleRow): ArticleRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    topic: row.topic as ArticleTopic,
    summary: row.summary,
    contentHtml: row.content_html,
    contentJson: row.content_json,
    contentText: row.content_text,
    coverImagePath: row.cover_image_path,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toListItem(article: ArticleRecord): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    topic: article.topic,
    summary: article.summary,
    updatedAt: article.updatedAt,
  };
}

function normalizeSummary(summary: string, contentText: string) {
  const cleanedSummary = summary.trim();

  if (cleanedSummary) {
    return cleanedSummary.slice(0, 240);
  }

  return contentText.trim().replace(/\s+/g, " ").slice(0, 240);
}

function slugify(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "article";
}

async function createUniqueSlug(authorId: string, title: string, excludeId?: string) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { rows } = await pool.query<{ id: string }>(
      `
        select id
        from articles
        where author_id = $1
          and slug = $2
          and ($3::text is null or id <> $3)
        limit 1
      `,
      [authorId, slug, excludeId ?? null]
    );

    if (rows.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export function isArticleTopic(value: string): value is ArticleTopic {
  return articleTopicNames.includes(value as ArticleTopic);
}

export async function listArticlesByAuthor(authorId: string) {
  const { rows } = await pool.query<ArticleRow>(
    `
      select *
      from articles
      where author_id = $1
      order by updated_at desc
    `,
    [authorId]
  );

  return rows.map((row) => toListItem(mapArticle(row)));
}

export async function getArticleById(authorId: string, articleId: string) {
  const { rows } = await pool.query<ArticleRow>(
    `
      select *
      from articles
      where id = $1 and author_id = $2
      limit 1
    `,
    [articleId, authorId]
  );

  return rows[0] ? mapArticle(rows[0]) : null;
}

export async function createArticle(input: SaveArticleInput) {
  const id = randomUUID();
  const slug = await createUniqueSlug(input.authorId, input.title);
  const summary = normalizeSummary(input.summary, input.contentText);

  const { rows } = await pool.query<ArticleRow>(
    `
      insert into articles (
        id,
        author_id,
        title,
        slug,
        topic,
        summary,
        content_html,
        content_json,
        content_text,
        cover_image_path
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, null)
      returning *
    `,
    [
      id,
      input.authorId,
      input.title.trim(),
      slug,
      input.topic,
      summary,
      input.contentHtml,
      JSON.stringify(input.contentJson),
      input.contentText,
    ]
  );

  return mapArticle(rows[0]);
}

export async function updateArticle(
  articleId: string,
  input: SaveArticleInput
) {
  const slug = await createUniqueSlug(input.authorId, input.title, articleId);
  const summary = normalizeSummary(input.summary, input.contentText);

  const { rows } = await pool.query<ArticleRow>(
    `
      update articles
      set
        title = $3,
        slug = $4,
        topic = $5,
        summary = $6,
        content_html = $7,
        content_json = $8::jsonb,
        content_text = $9,
        updated_at = now()
      where id = $1 and author_id = $2
      returning *
    `,
    [
      articleId,
      input.authorId,
      input.title.trim(),
      slug,
      input.topic,
      summary,
      input.contentHtml,
      JSON.stringify(input.contentJson),
      input.contentText,
    ]
  );

  return rows[0] ? mapArticle(rows[0]) : null;
}

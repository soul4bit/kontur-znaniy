package app

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

func articleDraftKeyForNew(sectionSlug string, subsection string) string {
	section := strings.ToLower(strings.TrimSpace(sectionSlug))
	sub := strings.ToLower(strings.TrimSpace(subsection))
	return "new:" + section + ":" + sub
}

func articleDraftKeyForArticle(articleID int64) string {
	return fmt.Sprintf("article:%d", articleID)
}

func scanArticleDraft(scanner interface {
	Scan(dest ...any) error
}) (*ArticleDraft, error) {
	var draft ArticleDraft
	var articleID sql.NullInt64
	if err := scanner.Scan(
		&draft.ID,
		&draft.UserID,
		&draft.DraftKey,
		&articleID,
		&draft.SectionSlug,
		&draft.Subsection,
		&draft.Title,
		&draft.Body,
		&draft.CreatedAt,
		&draft.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if articleID.Valid {
		draft.ArticleID = articleID.Int64
	}
	return &draft, nil
}

func (a *Application) getArticleDraftByKey(userID int64, draftKey string) (*ArticleDraft, error) {
	row := a.db.QueryRow(
		`select
			id,
			user_id,
			draft_key,
			article_id,
			section_slug,
			subsection,
			title,
			body,
			created_at,
			updated_at
		from article_drafts
		where user_id = $1 and draft_key = $2
		limit 1`,
		userID,
		draftKey,
	)
	return scanArticleDraft(row)
}

func (a *Application) upsertArticleDraft(userID int64, draftKey string, articleID int64, sectionSlug string, subsection string, title string, body string) (*ArticleDraft, error) {
	now := time.Now().UTC()
	nullableArticleID := sql.NullInt64{}
	if articleID > 0 {
		nullableArticleID = sql.NullInt64{Int64: articleID, Valid: true}
	}

	row := a.db.QueryRow(
		`insert into article_drafts (
			user_id,
			draft_key,
			article_id,
			section_slug,
			subsection,
			title,
			body,
			created_at,
			updated_at
		) values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		on conflict (user_id, draft_key) do update set
			article_id = excluded.article_id,
			section_slug = excluded.section_slug,
			subsection = excluded.subsection,
			title = excluded.title,
			body = excluded.body,
			updated_at = excluded.updated_at
		returning
			id,
			user_id,
			draft_key,
			article_id,
			section_slug,
			subsection,
			title,
			body,
			created_at,
			updated_at`,
		userID,
		draftKey,
		nullableArticleID,
		strings.TrimSpace(sectionSlug),
		strings.TrimSpace(subsection),
		title,
		body,
		now,
	)
	return scanArticleDraft(row)
}

func (a *Application) deleteArticleDraftByKey(userID int64, draftKey string) error {
	_, err := a.db.Exec(
		`delete from article_drafts where user_id = $1 and draft_key = $2`,
		userID,
		draftKey,
	)
	return err
}

func scanArticleComment(scanner interface {
	Scan(dest ...any) error
}) (*ArticleComment, error) {
	var comment ArticleComment
	if err := scanner.Scan(
		&comment.ID,
		&comment.ArticleID,
		&comment.AuthorID,
		&comment.Author,
		&comment.Body,
		&comment.CreatedAt,
	); err != nil {
		return nil, err
	}
	return &comment, nil
}

func (a *Application) listArticleComments(articleID int64, limit int) ([]ArticleComment, error) {
	if limit < 1 {
		limit = 1
	}

	rows, err := a.db.Query(
		`select
			c.id,
			c.article_id,
			coalesce(c.user_id, 0) as author_id,
			coalesce(u.name, 'deleted user') as author_name,
			c.body,
			c.created_at
		from article_comments c
		left join users u on u.id = c.user_id
		where c.article_id = $1
		order by c.created_at asc
		limit $2`,
		articleID,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]ArticleComment, 0, limit)
	for rows.Next() {
		comment, scanErr := scanArticleComment(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		result = append(result, *comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (a *Application) getArticleCommentByID(commentID int64) (*ArticleComment, error) {
	row := a.db.QueryRow(
		`select
			c.id,
			c.article_id,
			coalesce(c.user_id, 0) as author_id,
			coalesce(u.name, 'deleted user') as author_name,
			c.body,
			c.created_at
		from article_comments c
		left join users u on u.id = c.user_id
		where c.id = $1
		limit 1`,
		commentID,
	)
	return scanArticleComment(row)
}

func (a *Application) createArticleComment(articleID int64, authorID int64, body string) (*ArticleComment, error) {
	now := time.Now().UTC()
	row := a.db.QueryRow(
		`with inserted as (
			insert into article_comments (article_id, user_id, body, created_at, updated_at)
			values ($1, $2, $3, $4, $4)
			returning id, article_id, user_id, body, created_at
		)
		select
			i.id,
			i.article_id,
			coalesce(i.user_id, 0) as author_id,
			coalesce(u.name, 'deleted user') as author_name,
			i.body,
			i.created_at
		from inserted i
		left join users u on u.id = i.user_id`,
		articleID,
		authorID,
		body,
		now,
	)
	return scanArticleComment(row)
}

func (a *Application) deleteArticleCommentByID(commentID int64) error {
	result, err := a.db.Exec(`delete from article_comments where id = $1`, commentID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (a *Application) markCommentsDeletePermissions(comments []ArticleComment, user *User) []ArticleComment {
	if len(comments) == 0 {
		return comments
	}

	canDeleteAll := user != nil && user.IsAdmin()
	for i := range comments {
		if canDeleteAll {
			comments[i].CanDelete = true
			continue
		}
		if user != nil && comments[i].AuthorID > 0 && comments[i].AuthorID == user.ID {
			comments[i].CanDelete = true
		}
	}
	return comments
}

func (a *Application) canManageComment(user *User, comment *ArticleComment) bool {
	if user == nil || comment == nil {
		return false
	}
	if user.IsAdmin() {
		return true
	}
	return comment.AuthorID > 0 && comment.AuthorID == user.ID
}

func (a *Application) resolveDraftForNewArticle(userID int64, sectionSlug string, subsection string) (*ArticleDraft, error) {
	draftKey := articleDraftKeyForNew(sectionSlug, subsection)
	draft, err := a.getArticleDraftByKey(userID, draftKey)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return draft, nil
}

func (a *Application) resolveDraftForExistingArticle(userID int64, articleID int64) (*ArticleDraft, error) {
	draftKey := articleDraftKeyForArticle(articleID)
	draft, err := a.getArticleDraftByKey(userID, draftKey)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return draft, nil
}

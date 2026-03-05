package app

import (
	"database/sql"
	"errors"
	"time"
)

func (a *Application) appendArticleVersionTx(tx *sql.Tx, article *Article, editedBy int64, createdAt time.Time) error {
	if tx == nil || article == nil || article.ID < 1 {
		return errors.New("invalid article version payload")
	}

	_, err := tx.Exec(
		`insert into article_versions (
			article_id,
			version_no,
			edited_by,
			title,
			body,
			subsection,
			created_at
		)
		select
			$1,
			coalesce(max(version_no), 0) + 1,
			$2,
			$3,
			$4,
			$5,
			$6
		from article_versions
		where article_id = $1`,
		article.ID,
		editedBy,
		article.Title,
		article.Body,
		article.Subsection,
		createdAt,
	)
	return err
}

func (a *Application) listArticleVersions(articleID int64, limit int) ([]ArticleVersion, error) {
	if limit < 1 {
		limit = 1
	}

	rows, err := a.db.Query(
		`select
			v.id,
			v.article_id,
			v.version_no,
			v.title,
			v.body,
			v.subsection,
			coalesce(u.name, 'system') as editor_name,
			v.created_at
		from article_versions v
		left join users u on u.id = v.edited_by
		where v.article_id = $1
		order by v.version_no desc
		limit $2`,
		articleID,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]ArticleVersion, 0, limit)
	for rows.Next() {
		var version ArticleVersion
		if err := rows.Scan(
			&version.ID,
			&version.ArticleID,
			&version.VersionNo,
			&version.Title,
			&version.Body,
			&version.Subsection,
			&version.EditedByName,
			&version.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, version)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (a *Application) restoreArticleVersion(articleID int64, versionID int64, editedBy int64) (*Article, error) {
	now := time.Now().UTC()
	tx, err := a.db.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var version ArticleVersion
	err = tx.QueryRow(
		`select
			id,
			article_id,
			version_no,
			title,
			body,
			subsection,
			created_at
		from article_versions
		where id = $1
		limit 1`,
		versionID,
	).Scan(
		&version.ID,
		&version.ArticleID,
		&version.VersionNo,
		&version.Title,
		&version.Body,
		&version.Subsection,
		&version.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if version.ArticleID != articleID {
		return nil, sql.ErrNoRows
	}

	row := tx.QueryRow(
		`update articles
		set
			subsection = $2,
			title = $3,
			body = $4,
			updated_at = $5
		where id = $1
		returning
			id,
			author_id,
			'' as author_name,
			section_slug,
			subsection,
			title,
			body,
			created_at,
			updated_at`,
		articleID,
		version.Subsection,
		version.Title,
		version.Body,
		now,
	)

	updated, err := scanArticle(row)
	if err != nil {
		return nil, err
	}

	if err := a.appendArticleVersionTx(tx, updated, editedBy, now); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return updated, nil
}

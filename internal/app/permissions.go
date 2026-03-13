package app

func canManageArticle(user *User, article *Article) bool {
	if user == nil || article == nil {
		return false
	}
	if user.IsAdmin() {
		return true
	}
	return article.AuthorID == user.ID
}

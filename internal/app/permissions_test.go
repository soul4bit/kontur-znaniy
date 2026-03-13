package app

import "testing"

func TestCanManageArticle(t *testing.T) {
	article := &Article{
		ID:       42,
		AuthorID: 100,
	}

	tests := []struct {
		name    string
		user    *User
		allowed bool
	}{
		{
			name:    "nil user",
			user:    nil,
			allowed: false,
		},
		{
			name: "author editor",
			user: &User{
				ID:   100,
				Role: userRoleEditor,
			},
			allowed: true,
		},
		{
			name: "other editor",
			user: &User{
				ID:   200,
				Role: userRoleEditor,
			},
			allowed: false,
		},
		{
			name: "admin",
			user: &User{
				ID:   200,
				Role: userRoleAdmin,
			},
			allowed: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := canManageArticle(tt.user, article)
			if got != tt.allowed {
				t.Fatalf("canManageArticle() = %v, want %v", got, tt.allowed)
			}
		})
	}
}

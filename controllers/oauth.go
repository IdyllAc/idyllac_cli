// controllers/oauth.go
package controllers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/markbates/goth/gothic"
)

// Login handler - starts the OAuth flow
func HandleOAuthLogin(provider string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        r.URL.RawQuery = fmt.Sprintf("provider=%s", provider)
        gothic.BeginAuthHandler(w, r)
    }
}

// Callback handler - receives data after OAuth provider authenticates
func HandleOAuthCallback(provider string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        r.URL.RawQuery = fmt.Sprintf("provider=%s", provider)
        user, err := gothic.CompleteUserAuth(w, r)
        if err != nil {
            log.Println("❌ OAuth callback error:", err)
            http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
            return
        }

        // Log the user info or save to DB/session
        log.Printf("✅ User logged in: %#v\n", user)

        // Example: show basic user info
        fmt.Fprintf(w, `
            <h2>Welcome, %s!</h2>
            <p>Email: %s</p>
            <p>Provider: %s</p>
            <img src="%s" alt="User Avatar" width="100" />
        `, user.Name, user.Email, user.Provider, user.AvatarURL)

        // You can redirect them to /dashboard or save session/cookie here
    }
}

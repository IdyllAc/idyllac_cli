package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"os"

	"github.com/gorilla/sessions"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/facebook"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"golang.org/x/net/context"

	"my-news-app/models"
)

var db *sql.DB

func main() {
	// Load config
	env := os.Getenv("ENV")            // "development" or "production"
	port := os.Getenv("PORT")         // "8080" or "80"
	if port == "" {
		port = "8080" // Fallback for local or missing env var
	}
	
	models.InitDB() // will connect and set models.DB
	baseURL := os.Getenv("BASE_URL")  // "http://localhost:8080" or "https://anypay.cards"
	if baseURL == "" {
		log.Fatal("❌ BASE_URL is required")
	  }
	
	fmt.Println("Running in:", env)
	fmt.Println("Base URL:", baseURL)

	// Sessions and OAuth setup
	key := os.Getenv("SESSION_SECRET")
	if key == "" {
		log.Fatal("❌ SESSION_SECRET is missing in .env")
	}
	store := sessions.NewCookieStore([]byte(key))
	store.MaxAge(86400 * 30) // 30 days
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = true // Set to true for HTTPS on Render
	gothic.Store = store

	// OAuth providers
	goth.UseProviders(
		facebook.New(os.Getenv("FACEBOOK_KEY"), os.Getenv("FACEBOOK_SECRET"), "https://anypay.cards/auth/facebook/callback"),
		google.New(os.Getenv("GOOGLE_KEY"), os.Getenv("GOOGLE_SECRET"), "https://anypay.cards/auth/google/callback", "email", "profile"),
		github.New(os.Getenv("GITHUB_KEY"), os.Getenv("GITHUB_SECRET"), "https://anypay.cards/auth/github/callback"),
	)
	
	// Database connection via DATABASE_URL
	
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
	  log.Fatal("❌ DATABASE_URL is required for Postgres")
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
	  log.Fatal("❌ DB connection failed:", err)
	}
	models.DB = db // Store globally

	createTables() // Create subscribers & message tables

	// Static files & HTTPhandlers
	fs := http.FileServer(http.Dir("./static"))
	// Serve HTML pages
	http.Handle("/static/", http.StripPrefix("/static/", fs)) 
	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/subscribe", serveSubscribe)
	http.HandleFunc("/subscriber/email", handleEmailSubscription)
	http.HandleFunc("/verify", handleEmailVerification)
	http.HandleFunc("/subscribers", handleListSubscribers)
	http.HandleFunc("/view-emails", handleViewEmails)
	http.HandleFunc("/submit", handleFormSubmission)

	// OAuth routes
	http.HandleFunc("/auth/facebook", handleOAuthLogin("facebook"))
	http.HandleFunc("/auth/facebook/callback", handleOAuthCallback("facebook"))
	http.HandleFunc("/auth/google", handleOAuthLogin("google"))
	http.HandleFunc("/auth/google/callback", handleOAuthCallback("google"))
	http.HandleFunc("/auth/github", handleOAuthLogin("github"))
	http.HandleFunc("/auth/github/callback", handleOAuthCallback("github"))

	// Use custom router if needed (currently not necessary)
	// r := routes.SetupRoutes()
	// http.ListenAndServe(":8080", r)

	// Start server
	log.Println("🌐 Server started at", baseURL, "on port", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// ✅ This function is now outside of main
func createTables() {
	// Make sure db is initialized and open
	if db == nil {
		log.Fatal("❌ DB not initialized")
	}

	subscriberTable := `
	CREATE TABLE IF NOT EXISTS subscribers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		verified BOOLEAN DEFAULT 0
	);`

	messageTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		subscriber_id INTEGER,
		message TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
	);`
	

	_, err := db.Exec(subscriberTable)
	if err != nil {
		log.Fatalf("❌ Failed to create subscribers table: %v", err)
	}

	_, err = db.Exec(messageTable)
	if err != nil {
		log.Fatalf("❌ Failed to create messages table: %v", err)
	}
}



func serveIndex(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang") // ?lang=ar, ?lang=en, ?lang=fr

	switch lang {
	case "ar":
		http.ServeFile(w, r, "./static/indexAr.html")
	case "fr":
		http.ServeFile(w, r, "./static/indexFr.html")
	case "en":
		http.ServeFile(w, r, "./static/indexEn.html")
	default:
		http.ServeFile(w, r, "./index.html") // fallback
	}
}


func serveSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	lang := r.URL.Query().Get("lang")
	switch lang {
	case "ar":
	http.ServeFile(w, r, "./static/subscribeAr.html")
case "fr":
	http.ServeFile(w, r, "./static/subscribeFr.html")
case "en":
	http.ServeFile(w, r, "./static/subscribeEn.html")
	default:
		http.ServeFile(w, r, "./static/subscribe.html") // fallback
	}
}

func handleEmailSubscription(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	// Insert or ignore subscriber
	_, err := db.Exec("INSERT OR IGNORE INTO subscribers(email) VALUES(?)", email)
	if err != nil {
		http.Error(w, "❌ Could not save email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get subscriber ID (in case we need it later)
	var id int
	err = db.QueryRow("SELECT id FROM subscribers WHERE email = ?", email).Scan(&id)
	if err != nil {
		http.Error(w, "❌ Could not retrieve subscriber ID: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Append to file
	f, err := os.OpenFile("subscriber_emails.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		defer f.Close()
		_, _ = f.WriteString(email + "\n")
	} else {
		log.Println("⚠️ Failed to write email to file:", err)
	}

	// Generate verification link
	link := "https://sub.anypay.cards/verify?email=" + url.QueryEscape(email)
	sendConfirmationEmail(email, link)

	// Respond to browser
	fmt.Fprintf(w, "✅ Message received! Thank you.")

	// Console log for developer
	log.Println("📥 Subscription received for:", email)
	fmt.Println("🔗 Verification link:", link)
}

func sendConfirmationEmail(to string, link string) {
	from := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_PASSWORD")

	if from == "" || password == "" {
		log.Println("❌ EMAIL_ADDRESS or EMAIL_PASSWORD is not set in .env")
		return
	}

	subject := "Please verify your email"
	body := fmt.Sprintf("Hello,\n\nPlease click the link below to confirm your subscription:\n\n%s\n\nThanks!", link)

	// Full message with CRLF line endings (for better SMTP compliance)
	msg := []byte("From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body + "\r\n")

	// Send the email using Gmail's SMTP
	err := smtp.SendMail(
		"smtp.gmail.com:587",
		smtp.PlainAuth("", from, password, "smtp.gmail.com"),
		from,
		[]string{to},
		msg,
	)

	if err != nil {
		log.Println("❌ Email send failed:", err)
	} else {
		log.Println("✅ Confirmation email sent to:", to)
		log.Println("🔗 Verification link:", link) // Log the link for development/debug
	}
}

// ✅ New handler to verify email
func handleEmailVerification(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Missing email in verification link", http.StatusBadRequest)
		return
	}

	// ✅ Update the 'verified' field to true (1)
	_, err := db.Exec("UPDATE subscribers SET verified = 1 WHERE email = ?", email)
	if err != nil {
		http.Error(w, "❌ Failed to verify email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "✅ Thank you %s, your email is now verified!", email)
}

func handleListSubscribers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT email FROM subscribers WHERE Verified = 1")
	if err != nil {
		http.Error(w, "Failed to fetch subscribers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var email string
		rows.Scan(&email)
		fmt.Fprintln(w, email)
	}
}

func handleViewEmails(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("subscriber_emails.txt")
	if err != nil {
		http.Error(w, "❌ Cannot read file", http.StatusInternalServerError)
		return
	}
	w.Write(data)
}

func handleFormSubmission(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		r.ParseForm()
		email := r.FormValue("email")
		message := r.FormValue("message")

		if email == "" || message == "" {
			http.Error(w, "Email and message are required", http.StatusBadRequest)
			return
		}

		fmt.Printf("📩 New message from %s: %s\n", email, message)

		w.Write([]byte("✅ Message received!"))
	} else {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
	}
}

// OAuth handlers

func handleOAuthLogin(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(context.WithValue(r.Context(), gothic.ProviderParamKey, provider))
		gothic.BeginAuthHandler(w, r)
	}
}

func handleOAuthCallback(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(context.WithValue(r.Context(), gothic.ProviderParamKey, provider))
		user, err := gothic.CompleteUserAuth(w, r)
		if err != nil {
			http.Error(w, provider+" login failed: "+err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "✅ Logged in via %s\nName: %s\nEmail: %s", provider, user.Name, user.Email)

		log.Println("🌐 Server started at http://localhost:8080")
	}

}

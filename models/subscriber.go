// models/subscriber.go
package models

type Subscriber struct {
	ID       int
	Email    string
	Verified bool
}

func CreateSubscriber(email string) error {
	_, err := DB.Exec("INSERT IGNORE INTO subscribers(email) VALUES(?)", email)
	return err
}

func VerifySubscriber(email string) error {
	_, err := DB.Exec("UPDATE subscribers SET verified = 1 WHERE email = ?", email)
	return err
}

func GetVerifiedEmails() ([]string, error) {
	rows, err := DB.Query("SELECT email FROM subscribers WHERE verified = 1")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var emails []string
	for rows.Next() {
		var email string
		if err := rows.Scan(&email); err == nil {
			emails = append(emails, email)
		}
	}
	return emails, nil
}

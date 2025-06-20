// routes/routes.go
package routes

import (
	 // "net/http"

	"my-news-app/controllers"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/subscriber/email", controllers.HandleEmailSubscription).Methods("POST")
	r.HandleFunc("/verify", controllers.HandleEmailVerification).Methods("GET")

	return r
}

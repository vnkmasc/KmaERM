package middleware

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSConfig() gin.HandlerFunc {
	originsEnv := os.Getenv("ALLOW_ORIGIN")
	if originsEnv == "" {
		originsEnv = "http://localhost:3000"
	}

	// Tách theo dấu phẩy và trim space
	parts := strings.Split(originsEnv, ",")
	var allowOrigins []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			allowOrigins = append(allowOrigins, p)
		}
	}

	if len(allowOrigins) == 1 && allowOrigins[0] == "*" {
		allowOrigins = []string{"*"}
	}

	cfg := cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if len(cfg.AllowOrigins) == 1 && cfg.AllowOrigins[0] == "*" && cfg.AllowCredentials {
		cfg.AllowCredentials = false
	}

	return cors.New(cfg)
}

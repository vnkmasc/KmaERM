package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yêu cầu đăng nhập (Thiếu Token)"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token sai (Phải là Bearer <token>)"})
			c.Abort()
			return
		}

		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token không hợp lệ hoặc đã hết hạn"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("roleID", claims.RoleID)
		if claims.DoanhNghiepID != nil {
			c.Set("doanhNghiepID", *claims.DoanhNghiepID)
		}

		c.Next()
	}
}

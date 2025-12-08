package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware là hàm kiểm tra token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Lấy token từ Header "Authorization"
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yêu cầu đăng nhập (Thiếu Token)"})
			c.Abort()
			return
		}

		// 2. Định dạng chuẩn là: "Bearer <token_dai_ngoang...>"
		// Cần bỏ chữ "Bearer " đi để lấy token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token sai (Phải là Bearer <token>)"})
			c.Abort()
			return
		}

		// 3. Validate Token (Dùng hàm utils cũ của bạn)
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token không hợp lệ hoặc đã hết hạn"})
			c.Abort()
			return
		}

		// 4. Lưu thông tin User vào Context để các Handler phía sau dùng
		c.Set("userID", claims.UserID)
		c.Set("roleID", claims.RoleID)
		if claims.DoanhNghiepID != nil {
			c.Set("doanhNghiepID", *claims.DoanhNghiepID)
		}

		// 5. Cho phép đi tiếp vào Controller
		c.Next()
	}
}

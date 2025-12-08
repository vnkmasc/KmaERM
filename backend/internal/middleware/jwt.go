package middleware

import (
	"errors"
	"os"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
)

// 1. Định nghĩa cấu trúc dữ liệu trong Token (Claims)
type JwtCustomClaims struct {
	UserID        uuid.UUID  `json:"user_id"`
	RoleID        uuid.UUID  `json:"role_id"`
	DoanhNghiepID *uuid.UUID `json:"doanh_nghiep_id,omitempty"` // Có thể null nếu là Admin hệ thống
	jwt.RegisteredClaims
}

// 2. Hàm tạo Token
func GenerateToken(userID, roleID uuid.UUID, doanhNghiepID *uuid.UUID) (string, error) {
	// Lấy secret từ env
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret" // Fallback nếu quên set env (chỉ dùng dev)
	}

	// Tạo claims
	claims := &JwtCustomClaims{
		UserID:        userID,
		RoleID:        roleID,
		DoanhNghiepID: doanhNghiepID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Hết hạn sau 24h
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Ký token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// 3. Hàm kiểm tra (Validate) Token
func ValidateToken(tokenString string) (*JwtCustomClaims, error) {
	secret := os.Getenv("JWT_SECRET")

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &JwtCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	// Lấy dữ liệu từ token ra
	if claims, ok := token.Claims.(*JwtCustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

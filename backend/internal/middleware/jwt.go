package middleware

import (
	"errors"
	"os"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
)

type JwtCustomClaims struct {
	UserID        uuid.UUID  `json:"user_id"`
	RoleID        uuid.UUID  `json:"role_id"`
	DoanhNghiepID *uuid.UUID `json:"doanh_nghiep_id,omitempty"` // Có thể null nếu là Admin hệ thống
	jwt.RegisteredClaims
}

func GenerateToken(userID, roleID uuid.UUID, doanhNghiepID *uuid.UUID) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret"
	}

	claims := &JwtCustomClaims{
		UserID:        userID,
		RoleID:        roleID,
		DoanhNghiepID: doanhNghiepID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string) (*JwtCustomClaims, error) {
	secret := os.Getenv("JWT_SECRET")

	token, err := jwt.ParseWithClaims(tokenString, &JwtCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JwtCustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

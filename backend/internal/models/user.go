package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type Role struct {
	ID   uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name string    `gorm:"type:varchar(50);unique;not null" json:"name"`
}

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string    `gorm:"type:varchar(255);unique;not null" json:"email"`
	PasswordHash string    `gorm:"type:text;not null" json:"-"` // Ẩn password
	FullName     string    `gorm:"type:text" json:"full_name"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`

	RoleID        uuid.UUID  `gorm:"type:uuid;not null" json:"role_id"`
	Role          Role       `gorm:"foreignKey:RoleID" json:"role"`
	DoanhNghiepID *uuid.UUID `gorm:"type:uuid" json:"doanh_nghiep_id"`

	PrivateKeyPEM *string `gorm:"type:text;column:private_key_pem" json:"-"`
	PublicKeyPEM  *string `gorm:"type:text;column:public_key_pem" json:"public_key_pem,omitempty"`

	OtpCode   *string    `gorm:"type:varchar(10);column:otp_code" json:"-"`
	OtpExpiry *time.Time `gorm:"column:otp_expiry" json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

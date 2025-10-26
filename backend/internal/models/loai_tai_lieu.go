package models

import "github.com/gofrs/uuid"

type LoaiTaiLieu struct {
	ID   uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Ten  string    `gorm:"not null;unique" json:"ten"`
	MoTa string    `json:"mo_ta,omitempty"`
}

func (LoaiTaiLieu) TableName() string {
	return "loai_tai_lieu"
}

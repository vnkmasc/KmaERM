package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type TaiLieu struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	HoSoTaiLieuID uuid.UUID `gorm:"type:uuid;not null;index" json:"ho_so_tai_lieu_id"`
	TieuDe        string    `json:"tieu_de,omitempty"`
	DuongDan      string    `gorm:"not null" json:"duong_dan"`
	CreatedAt     time.Time `json:"created_at"`

	HoSoTaiLieu HoSoTaiLieu `gorm:"foreignKey:HoSoTaiLieuID" json:"-"`
}

func (TaiLieu) TableName() string {
	return "tai_lieu"
}

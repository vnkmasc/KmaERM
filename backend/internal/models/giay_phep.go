package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type GiayPhep struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	HoSoID            uuid.UUID `gorm:"type:uuid;not null;unique" json:"ho_so_id"`
	LoaiGiayPhep      string    `gorm:"not null" json:"loai_giay_phep"`
	SoGiayPhep        string    `gorm:"not null;unique" json:"so_giay_phep"`
	NgayHieuLuc       time.Time `gorm:"type:date;not null" json:"ngay_hieu_luc"`
	NgayHetHan        time.Time `gorm:"type:date;not null" json:"ngay_het_han"`
	TrangThaiGiayPhep string    `gorm:"not null" json:"trang_thai_giay_phep"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	HoSo HoSo `gorm:"foreignKey:HoSoID" json:"ho_so"`
}

func (GiayPhep) TableName() string {
	return "giay_phep"
}

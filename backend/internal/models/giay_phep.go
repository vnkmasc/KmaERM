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

	FileDuongDan *string `json:"file_duong_dan,omitempty"`

	H1Hash              *string `gorm:"column:h1_hash" json:"h1_hash,omitempty"`
	H2Hash              *string `gorm:"column:h2_hash" json:"h2_hash,omitempty"`
	TrangThaiBlockchain *string `gorm:"default:'ChuaDongBo';column:trang_thai_blockchain" json:"trang_thai_blockchain,omitempty"`

	ChuKySo          *string    `gorm:"type:text;column:chu_ky_so" json:"chu_ky_so,omitempty"`
	NguoiKyID        *uuid.UUID `gorm:"type:uuid;column:nguoi_ky_id" json:"nguoi_ky_id,omitempty"`
	NgayKy           *time.Time `gorm:"column:ngay_ky" json:"ngay_ky,omitempty"`
	PublicKeyNguoiKy *string    `gorm:"type:text;column:public_key_nguoi_ky" json:"public_key_nguoi_ky,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	HoSo HoSo `gorm:"foreignKey:HoSoID" json:"ho_so"`
}

func (GiayPhep) TableName() string {
	return "giay_phep"
}

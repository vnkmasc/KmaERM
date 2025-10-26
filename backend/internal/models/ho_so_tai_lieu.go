package models

import "github.com/gofrs/uuid"

type HoSoTaiLieu struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	HoSoID        uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_ho_so_loai_tai_lieu" json:"ho_so_id"`
	LoaiTaiLieuID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_ho_so_loai_tai_lieu" json:"loai_tai_lieu_id"`

	HoSo        HoSo        `gorm:"foreignKey:HoSoID" json:"-"`
	LoaiTaiLieu LoaiTaiLieu `gorm:"foreignKey:LoaiTaiLieuID" json:"loai_tai_lieu,omitempty"`
	TaiLieus    []TaiLieu   `gorm:"foreignKey:HoSoTaiLieuID" json:"tai_lieus,omitempty"`
}

func (HoSoTaiLieu) TableName() string {
	return "ho_so_tai_lieu"
}

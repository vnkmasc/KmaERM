package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type HoSo struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DoanhNghiepID      uuid.UUID `gorm:"type:uuid;not null;index" json:"doanh_nghiep_id"`
	MaHoSo             string    `gorm:"not null;unique" json:"ma_ho_so"`
	LoaiThuTuc         string    `gorm:"not null" json:"loai_thu_tuc"`
	NgayDangKy         time.Time `gorm:"not null" json:"ngay_dang_ky"`
	NgayTiepNhan       time.Time `gorm:"not null" json:"ngay_tiep_nhan"`
	NgayHenTra         time.Time `gorm:"not null" json:"ngay_hen_tra"`
	SoGiayPhepTheoHoSo string    `json:"so_giay_phep_theo_ho_so,omitempty"`
	TrangThaiHoSo      string    `gorm:"not null" json:"trang_thai_ho_so"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	DoanhNghiep  DoanhNghiep   `gorm:"foreignKey:DoanhNghiepID" json:"doanh_nghiep"`
	GiayPhep     *GiayPhep     `gorm:"foreignKey:HoSoID" json:"giay_phep,omitempty"`
	HoSoTaiLieus []HoSoTaiLieu `gorm:"foreignKey:HoSoID" json:"ho_so_tai_lieus,omitempty"`
}

func (HoSo) TableName() string {
	return "ho_so"
}

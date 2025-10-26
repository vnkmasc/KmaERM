package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type DoanhNghiep struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenDoanhNghiepVI  string     `gorm:"not null" json:"ten_doanh_nghiep_vi"`
	TenDoanhNghiepEN  string     `json:"ten_doanh_nghiep_en,omitempty"`
	TenVietTat        string     `json:"ten_viet_tat,omitempty"`
	DiaChi            string     `gorm:"not null" json:"dia_chi"`
	MaSoDoanhNghiep   string     `gorm:"not null;unique" json:"ma_so_doanh_nghiep"`
	NgayCapMSDNLanDau time.Time  `gorm:"type:date;not null" json:"ngay_cap_msdn_lan_dau"`
	NoiCapMSDN        string     `gorm:"not null" json:"noi_cap_msdn"`
	SoLanThayDoiMSDN  *int       `json:"so_lan_thay_doi_msdn,omitempty"`
	NgayThayDoiMSDN   *time.Time `gorm:"type:date" json:"ngay_thay_doi_msdn,omitempty"`
	SDT               string     `json:"sdt,omitempty"`
	Email             string     `json:"email,omitempty"`
	Website           string     `json:"website,omitempty"`
	VonDieuLe         string     `json:"von_dieu_le,omitempty"`
	NguoiDaiDien      string     `json:"nguoi_dai_dien,omitempty"`
	ChucVu            string     `json:"chuc_vu,omitempty"`
	LoaiDinhDanh      string     `json:"loai_dinh_danh,omitempty"`
	NgayCapDinhDanh   *time.Time `gorm:"type:date" json:"ngay_cap_dinh_danh,omitempty"`
	NoiCapDinhDanh    string     `json:"noi_cap_dinh_danh,omitempty"`
	Status            bool       `gorm:"default:false" json:"status"`

	FileGCNDKDN string    `json:"file_gcndkdn,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	HoSos []HoSo `json:"ho_sos,omitempty"`
}

func (DoanhNghiep) TableName() string {
	return "doanh_nghiep"
}

package dto

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
)

type CreateDoanhNghiepRequest struct {
	TenDoanhNghiepVI   string     `json:"ten_doanh_nghiep_vi" binding:"required"`
	TenDoanhNghiepEN   string     `json:"ten_doanh_nghiep_en"`
	TenVietTat         string     `json:"ten_viet_tat"`
	DiaChi             string     `json:"dia_chi" binding:"required"`
	MaSoDoanhNghiep    string     `json:"ma_so_doanh_nghiep" binding:"required,min=10,max=14"`
	NgayCapMSDNLanDau  time.Time  `json:"ngay_cap_msdn_lan_dau" binding:"required"`
	NoiCapMSDN         string     `json:"noi_cap_msdn" binding:"required"`
	SoGiayPhepTheoHoSo string     `json:"so_giay_phep_theo_ho_so"`
	SDT                string     `json:"sdt" binding:"omitempty"`
	Email              string     `json:"email" binding:"omitempty,email"`
	Website            string     `json:"website" binding:"omitempty,url"`
	VonDieuLe          string     `json:"von_dieu_le"`
	NguoiDaiDien       string     `json:"nguoi_dai_dien"`
	ChucVu             string     `json:"chuc_vu"`
	LoaiDinhDanh       string     `json:"loai_dinh_danh"`
	NgayCapDinhDanh    *time.Time `json:"ngay_cap_dinh_danh"`
	NoiCapDinhDanh     string     `json:"noi_cap_dinh_danh"`

	AccountEmail    string `json:"account_email" binding:"required,email"`
	AccountPassword string `json:"account_password" binding:"required,min=6"`
	AccountFullName string `json:"account_full_name" binding:"required"`
}

type UpdateDoanhNghiepRequest struct {
	TenDoanhNghiepVI *string    `json:"ten_doanh_nghiep_vi"`
	TenDoanhNghiepEN *string    `json:"ten_doanh_nghiep_en"`
	TenVietTat       *string    `json:"ten_viet_tat"`
	DiaChi           *string    `json:"dia_chi"`
	SDT              *string    `json:"sdt"`
	Email            *string    `json:"email" binding:"omitempty,email"`
	Website          *string    `json:"website" binding:"omitempty,url"`
	VonDieuLe        *string    `json:"von_dieu_le"`
	NguoiDaiDien     *string    `json:"nguoi_dai_dien"`
	ChucVu           *string    `json:"chuc_vu"`
	LoaiDinhDanh     *string    `json:"loai_dinh_danh"`
	NgayCapDinhDanh  *time.Time `json:"ngay_cap_dinh_danh"`
	NoiCapDinhDanh   *string    `json:"noi_cap_dinh_danh"`
}

type DoanhNghiepResponse struct {
	ID                uuid.UUID  `json:"id"`
	TenDoanhNghiepVI  string     `json:"ten_doanh_nghiep_vi"`
	TenDoanhNghiepEN  string     `json:"ten_doanh_nghiep_en,omitempty"`
	TenVietTat        string     `json:"ten_viet_tat,omitempty"`
	DiaChi            string     `json:"dia_chi"`
	MaSoDoanhNghiep   string     `json:"ma_so_doanh_nghiep"`
	NgayCapMSDNLanDau time.Time  `json:"ngay_cap_msdn_lan_dau"`
	NoiCapMSDN        string     `json:"noi_cap_msdn"`
	SoLanThayDoiMSDN  *int       `json:"so_lan_thay_doi_msdn,omitempty"`
	NgayThayDoiMSDN   *time.Time `json:"ngay_thay_doi_msdn,omitempty"`
	SDT               string     `json:"sdt,omitempty"`
	Email             string     `json:"email,omitempty"`
	Website           string     `json:"website,omitempty"`
	VonDieuLe         string     `json:"von_dieu_le,omitempty"`
	NguoiDaiDien      string     `json:"nguoi_dai_dien,omitempty"`
	ChucVu            string     `json:"chuc_vu,omitempty"`
	LoaiDinhDanh      string     `json:"loai_dinh_danh,omitempty"`
	NgayCapDinhDanh   *time.Time `json:"ngay_cap_dinh_danh,omitempty"`
	NoiCapDinhDanh    string     `json:"noi_cap_dinh_danh,omitempty"`
	Status            bool       `json:"status"`
	FileGCNDKDN       string     `json:"file_gcndkdn,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`

	HoSos []HoSoDetailsResponse `json:"ho_sos,omitempty"`
}

func ToDoanhNghiepResponse(dn *models.DoanhNghiep) DoanhNghiepResponse {
	var hoSoResponses []HoSoDetailsResponse
	for _, hs := range dn.HoSos {
		var ngayTiepNhanPtr *time.Time
		if !hs.NgayTiepNhan.IsZero() {
			ngayTiepNhanPtr = &hs.NgayTiepNhan
		}

		var ngayHenTraPtr *time.Time
		if !hs.NgayHenTra.IsZero() {
			ngayHenTraPtr = &hs.NgayHenTra
		}

		hoSoResponses = append(hoSoResponses, HoSoDetailsResponse{
			ID:                 hs.ID,
			DoanhNghiepID:      hs.DoanhNghiepID,
			MaHoSo:             hs.MaHoSo,
			LoaiThuTuc:         hs.LoaiThuTuc,
			NgayDangKy:         hs.NgayDangKy,
			NgayTiepNhan:       ngayTiepNhanPtr,
			NgayHenTra:         ngayHenTraPtr,
			SoGiayPhepTheoHoSo: hs.SoGiayPhepTheoHoSo,
			TrangThaiHoSo:      hs.TrangThaiHoSo,
			// CreatedAt:          hs.CreatedAt,
			// UpdatedAt:          hs.UpdatedAt,
		})
	}

	return DoanhNghiepResponse{
		ID:                dn.ID,
		TenDoanhNghiepVI:  dn.TenDoanhNghiepVI,
		TenDoanhNghiepEN:  dn.TenDoanhNghiepEN,
		TenVietTat:        dn.TenVietTat,
		DiaChi:            dn.DiaChi,
		MaSoDoanhNghiep:   dn.MaSoDoanhNghiep,
		NgayCapMSDNLanDau: dn.NgayCapMSDNLanDau,
		NoiCapMSDN:        dn.NoiCapMSDN,
		SoLanThayDoiMSDN:  dn.SoLanThayDoiMSDN,
		NgayThayDoiMSDN:   dn.NgayThayDoiMSDN,
		SDT:               dn.SDT,
		Email:             dn.Email,
		Website:           dn.Website,
		VonDieuLe:         dn.VonDieuLe,
		NguoiDaiDien:      dn.NguoiDaiDien,
		ChucVu:            dn.ChucVu,
		LoaiDinhDanh:      dn.LoaiDinhDanh,
		NgayCapDinhDanh:   dn.NgayCapDinhDanh,
		NoiCapDinhDanh:    dn.NoiCapDinhDanh,
		Status:            dn.Status,
		FileGCNDKDN:       dn.FileGCNDKDN,
		CreatedAt:         dn.CreatedAt,
		UpdatedAt:         dn.UpdatedAt,
		HoSos:             hoSoResponses,
	}
}

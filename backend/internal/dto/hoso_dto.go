package dto

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
)

type CreateHoSoRequest struct {
	DoanhNghiepID uuid.UUID `json:"doanh_nghiep_id" binding:"required"`
	LoaiThuTuc    string    `json:"loai_thu_tuc" binding:"required"`
	NgayDangKy    time.Time `json:"ngay_dang_ky" binding:"required"`
	NgayTiepNhan  time.Time `json:"ngay_tiep_nhan" binding:"required"`
	NgayHenTra    time.Time `json:"ngay_hen_tra" binding:"required"`
}

type HoSoSearchParams struct {
	MaHoSo        string `form:"ma_ho_so"`
	LoaiThuTuc    string `form:"loai_thu_tuc"`
	TrangThaiHoSo string `form:"trang_thai_ho_so"`

	NgayDangKyFrom time.Time `form:"ngay_dang_ky_from" time_format:"2006-01-02T15:04:05Z"`
	NgayDangKyTo   time.Time `form:"ngay_dang_ky_to" time_format:"2006-01-02T15:04:05Z"`

	NgayTiepNhanFrom time.Time `form:"ngay_tiep_nhan_from" time_format:"2006-01-02T15:04:05Z"`
	NgayTiepNhanTo   time.Time `form:"ngay_tiep_nhan_to" time_format:"2006-01-02T15:04:05Z"`

	NgayHenTraFrom time.Time `form:"ngay_hen_tra_from" time_format:"2006-01-02T15:04:05Z"`
	NgayHenTraTo   time.Time `form:"ngay_hen_tra_to" time_format:"2006-01-02T15:04:05Z"`
}

type HoSoListResponse struct {
	Data []models.HoSo `json:"data"`

	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
	Total    int64 `json:"total"`
}
type GroupedLoaiTaiLieuResponse struct {
	TenThuTuc string               `json:"ten_thu_tuc"`
	TaiLieus  []models.LoaiTaiLieu `json:"tai_lieus"`
}
type HoSoDetailsResponse struct {
	ID                 uuid.UUID `json:"id"`
	DoanhNghiepID      uuid.UUID `json:"doanh_nghiep_id"`
	TenDoanhnghiepVI   string    `json:"ten_doanh_nghiep_vi"`
	MaHoSo             string    `json:"ma_ho_so"`
	LoaiThuTuc         string    `json:"loai_thu_tuc"`
	NgayDangKy         time.Time `json:"ngay_dang_ky"`
	NgayTiepNhan       time.Time `json:"ngay_tiep_nhan"`
	NgayHenTra         time.Time `json:"ngay_hen_tra"`
	SoGiayPhepTheoHoSo string    `json:"so_giay_phep_theo_ho_so,omitempty"`
	TrangThaiHoSo      string    `json:"trang_thai_ho_so"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// DoanhNghiep  *models.DoanhNghiep   `json:"doanh_nghiep,omitempty"`
	HoSoTaiLieus []HoSoTaiLieuResponse `json:"ho_so_tai_lieus,omitempty"`
}

func ToHoSoTaiLieuResponse(hoSoTaiLieu models.HoSoTaiLieu) HoSoTaiLieuResponse {
	// Giả định rằng models.HoSoTaiLieu có trường LoaiTaiLieu và TaiLieus
	return HoSoTaiLieuResponse{
		ID:          hoSoTaiLieu.ID,
		LoaiTaiLieu: hoSoTaiLieu.LoaiTaiLieu, // Giả định models.LoaiTaiLieu có thể gán trực tiếp
		TaiLieus:    hoSoTaiLieu.TaiLieus,    // Giả định []models.TaiLieu có thể gán trực tiếp
	}
}

func ToHoSoDetailsResponse(hoSo *models.HoSo) HoSoDetailsResponse {
	response := HoSoDetailsResponse{
		ID:                 hoSo.ID,
		DoanhNghiepID:      hoSo.DoanhNghiepID,
		TenDoanhnghiepVI:   hoSo.DoanhNghiep.TenDoanhNghiepVI,
		MaHoSo:             hoSo.MaHoSo,
		LoaiThuTuc:         hoSo.LoaiThuTuc,
		NgayDangKy:         hoSo.NgayDangKy,
		NgayTiepNhan:       hoSo.NgayTiepNhan,
		NgayHenTra:         hoSo.NgayHenTra,
		SoGiayPhepTheoHoSo: hoSo.SoGiayPhepTheoHoSo,
		TrangThaiHoSo:      hoSo.TrangThaiHoSo,
		CreatedAt:          hoSo.CreatedAt,
		UpdatedAt:          hoSo.UpdatedAt,
		HoSoTaiLieus:       make([]HoSoTaiLieuResponse, len(hoSo.HoSoTaiLieus)),
	}

	for i, hstl := range hoSo.HoSoTaiLieus {
		response.HoSoTaiLieus[i] = ToHoSoTaiLieuResponse(hstl)
	}

	return response
}

type HoSoTaiLieuResponse struct {
	ID          uuid.UUID          `json:"id"`
	LoaiTaiLieu models.LoaiTaiLieu `json:"loai_tai_lieu"`
	TaiLieus    []models.TaiLieu   `json:"tai_lieus,omitempty"`
}

type UploadTaiLieuRequest struct {
	HoSoTaiLieuID uuid.UUID `form:"ho_so_tai_lieu_id" binding:"required"`
	TieuDe        string    `form:"tieu_de,omitempty"`
}

type UpdateHoSoRequest struct {
	NgayDangKy         time.Time `json:"ngay_dang_ky" binding:"required"`
	NgayTiepNhan       time.Time `json:"ngay_tiep_nhan" binding:"required"`
	NgayHenTra         time.Time `json:"ngay_hen_tra" binding:"required"`
	SoGiayPhepTheoHoSo string    `json:"so_giay_phep_theo_ho_so,omitempty"`
	TrangThaiHoSo      string    `json:"trang_thai_ho_so" binding:"required"`
}

package dto

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
)

type CreateGiayPhepRequest struct {
	HoSoID uuid.UUID `json:"ho_so_id" binding:"required"`

	LoaiGiayPhep string `json:"loai_giay_phep" binding:"required"`

	SoGiayPhep        string    `json:"so_giay_phep" binding:"required"`
	NgayHieuLuc       time.Time `json:"ngay_hieu_luc" binding:"required"`
	NgayHetHan        time.Time `json:"ngay_het_han" binding:"required"`
	TrangThaiGiayPhep string    `json:"trang_thai_giay_phep" binding:"required"`
}

type UpdateGiayPhepRequest struct {
	LoaiGiayPhep string `json:"loai_giay_phep" binding:"required"`

	SoGiayPhep        string    `json:"so_giay_phep" binding:"required"`
	NgayHieuLuc       time.Time `json:"ngay_hieu_luc" binding:"required"`
	NgayHetHan        time.Time `json:"ngay_het_han" binding:"required"`
	TrangThaiGiayPhep string    `json:"trang_thai_giay_phep" binding:"required"`
}

type GiayPhepSearchParams struct {
	MaHoSo            string `form:"ma_ho_so"`
	SoGiayPhep        string `form:"so_giay_phep"`
	LoaiGiayPhep      string `form:"loai_giay_phep"`
	TrangThaiGiayPhep string `form:"trang_thai_giay_phep"`

	NgayHieuLucFrom time.Time `form:"ngay_hieu_luc_from" time_format:"2006-01-02T15:04:05Z"`
	NgayHieuLucTo   time.Time `form:"ngay_hieu_luc_to" time_format:"2006-01-02T15:04:05Z"`

	NgayHetHanFrom time.Time `form:"ngay_het_han_from" time_format:"2006-01-02T15:04:05Z"`
	NgayHetHanTo   time.Time `form:"ngay_het_han_to" time_format:"2006-01-02T15:04:05Z"`
}

type GiayPhepListResponse struct {
	Data     []models.GiayPhep `json:"data"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
	Total    int64             `json:"total"`
}

type GiayPhepResponse struct {
	ID                uuid.UUID `json:"id"`
	HoSoID            uuid.UUID `json:"ho_so_id"`
	LoaiGiayPhep      string    `json:"loai_giay_phep"`
	SoGiayPhep        string    `json:"so_giay_phep"`
	NgayHieuLuc       time.Time `json:"ngay_hieu_luc"`
	NgayHetHan        time.Time `json:"ngay_het_han"`
	TrangThaiGiayPhep string    `json:"trang_thai_giay_phep"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	FileDuongDan *string `json:"file_duong_dan,omitempty"`
	H1Hash       *string `json:"h1_hash,omitempty"`
	H2Hash       *string `json:"h2_hash,omitempty"`

	HoSo *models.HoSo `json:"ho_so,omitempty"`
}

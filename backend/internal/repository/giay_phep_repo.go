package repository

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type GiayPhepRepository interface {
	CreateGiayPhep(ctx context.Context, db *gorm.DB, giayPhep *models.GiayPhep) error
	UpdateGiayPhep(ctx context.Context, db *gorm.DB, giayPhep *models.GiayPhep) error
	DeleteGiayPhep(ctx context.Context, db *gorm.DB, giayPhepID uuid.UUID) error
	GetGiayPhepByID(ctx context.Context, db *gorm.DB, giayPhepID uuid.UUID) (*models.GiayPhep, error)
	GetGiayPhepByHoSoID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.GiayPhep, error)
	CheckHoSoExists(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (bool, error)
	ListGiayPhep(
		ctx context.Context,
		db *gorm.DB,
		doanhNghiepID uuid.UUID,
		params *dto.GiayPhepSearchParams,
		page int,
		pageSize int,
	) ([]models.GiayPhep, int64, error)
}

type giayPhepRepo struct{}

func NewGiayPhepRepository() GiayPhepRepository {
	return &giayPhepRepo{}
}

func (r *giayPhepRepo) CreateGiayPhep(ctx context.Context, db *gorm.DB, giayPhep *models.GiayPhep) error {
	return db.WithContext(ctx).Create(giayPhep).Error
}

func (r *giayPhepRepo) UpdateGiayPhep(ctx context.Context, db *gorm.DB, giayPhep *models.GiayPhep) error {
	return db.WithContext(ctx).Save(giayPhep).Error
}

func (r *giayPhepRepo) DeleteGiayPhep(ctx context.Context, db *gorm.DB, giayPhepID uuid.UUID) error {
	return db.WithContext(ctx).Delete(&models.GiayPhep{}, giayPhepID).Error
}

func (r *giayPhepRepo) GetGiayPhepByID(ctx context.Context, db *gorm.DB, giayPhepID uuid.UUID) (*models.GiayPhep, error) {
	var giayPhep models.GiayPhep
	err := db.WithContext(ctx).
		Preload("HoSo.DoanhNghiep"). // Preload lồng: GiayPhep -> HoSo -> DoanhNghiep
		First(&giayPhep, "id = ?", giayPhepID).Error
	return &giayPhep, err
}

func (r *giayPhepRepo) GetGiayPhepByHoSoID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.GiayPhep, error) {
	var giayPhep models.GiayPhep
	err := db.WithContext(ctx).Where("ho_so_id = ?", hoSoID).First(&giayPhep).Error
	return &giayPhep, err
}

func (r *giayPhepRepo) ListGiayPhep(
	ctx context.Context,
	db *gorm.DB,
	doanhNghiepID uuid.UUID, // <-- Thêm tham số này
	params *dto.GiayPhepSearchParams,
	page int,
	pageSize int,
) ([]models.GiayPhep, int64, error) {

	var giayPheps []models.GiayPhep
	var total int64

	query := db.WithContext(ctx).Model(&models.GiayPhep{})

	// 1. Join với bảng 'ho_so'
	// (Rất quan trọng để lọc theo doanhNghiepID và ma_ho_so)
	query = query.Joins("JOIN ho_so ON ho_so.id = giay_phep.ho_so_id")

	// 2. Lọc BẮT BUỘC
	// === THAY ĐỔI: Lọc theo tham số doanhNghiepID ===
	if doanhNghiepID != uuid.Nil {
		query = query.Where("ho_so.doanh_nghiep_id = ?", doanhNghiepID)
	}

	// 3. Lọc TÙY CHỌN (Search)
	if params.MaHoSo != "" {
		query = query.Where("ho_so.ma_ho_so ILIKE ?", "%"+params.MaHoSo+"%")
	}
	if params.SoGiayPhep != "" {
		query = query.Where("giay_phep.so_giay_phep ILIKE ?", "%"+params.SoGiayPhep+"%")
	}
	// ... (Các bộ lọc khác không đổi) ...
	if params.LoaiGiayPhep != "" {
		query = query.Where("giay_phep.loai_giay_phep = ?", params.LoaiGiayPhep)
	}
	if params.TrangThaiGiayPhep != "" {
		query = query.Where("giay_phep.trang_thai_giay_phep = ?", params.TrangThaiGiayPhep)
	}
	if !params.NgayHieuLucFrom.IsZero() {
		query = query.Where("giay_phep.ngay_hieu_luc >= ?", params.NgayHieuLucFrom)
	}
	if !params.NgayHieuLucTo.IsZero() {
		query = query.Where("giay_phep.ngay_hieu_luc <= ?", params.NgayHieuLucTo)
	}
	if !params.NgayHetHanFrom.IsZero() {
		query = query.Where("giay_phep.ngay_het_han >= ?", params.NgayHetHanFrom)
	}
	if !params.NgayHetHanTo.IsZero() {
		query = query.Where("giay_phep.ngay_het_han <= ?", params.NgayHetHanTo)
	}

	// 4. Đếm tổng số (Không đổi)
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 5. Phân trang (Không đổi)
	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize)

	// 6. Preload (Không đổi)
	query = query.Preload("HoSo.DoanhNghiep")
	query = query.Order("giay_phep.created_at DESC")

	// 7. Thực thi
	// PHẢI DÙNG Select("giay_phep.*") để tránh GORM bị lỗi "column is ambiguous"
	err = query.Find(&giayPheps).Error
	if err != nil {
		return nil, 0, err
	}

	return giayPheps, total, nil
}

func (r *giayPhepRepo) CheckHoSoExists(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (bool, error) {
	var count int64
	// Chỉ kiểm tra bảng 'giay_phep', không cần 'ho_so'
	err := db.WithContext(ctx).Model(&models.GiayPhep{}).Where("ho_so_id = ?", hoSoID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

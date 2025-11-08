package repository

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type HoSoRepository interface {
	CreateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error
	GetHoSoDetails(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error)
	GetHoSoByID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error)
	UpdateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error
	ListHoSo(ctx context.Context, db *gorm.DB, doanhNghiepID uuid.UUID, params *dto.HoSoSearchParams, page int, pageSize int) ([]models.HoSo, int64, error)
	DeleteHoSo(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) error
}

type hoSoRepo struct {
	// Chúng ta không cần db *gorm.DB ở đây
	// vì db/tx sẽ được truyền vào từng hàm
}

func NewHoSoRepository() HoSoRepository {
	return &hoSoRepo{}
}

func (r *hoSoRepo) CreateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error {
	return db.WithContext(ctx).Create(hoSo).Error
}

func (r *hoSoRepo) GetHoSoDetails(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error) {
	var hoSo models.HoSo

	err := db.WithContext(ctx).
		Preload("DoanhNghiep").
		Preload("HoSoTaiLieus.LoaiTaiLieu").
		Preload("HoSoTaiLieus.TaiLieus").
		First(&hoSo, "id = ?", hoSoID).Error

	return &hoSo, err
}

func (r *hoSoRepo) ListHoSo(
	ctx context.Context,
	db *gorm.DB,
	doanhNghiepID uuid.UUID,
	params *dto.HoSoSearchParams,
	page int,
	pageSize int,
) ([]models.HoSo, int64, error) {

	var hoSos []models.HoSo
	var total int64

	// Bắt đầu truy vấn
	query := db.WithContext(ctx).Model(&models.HoSo{})

	// 1. Lọc BẮT BUỘC
	query = query.Where("doanh_nghiep_id = ?", doanhNghiepID)

	// 2. Lọc TÙY CHỌN (Search)
	if params.MaHoSo != "" {
		// Dùng ILIKE để search không phân biệt hoa thường
		query = query.Where("ma_ho_so ILIKE ?", "%"+params.MaHoSo+"%")
	}
	if params.LoaiThuTuc != "" {
		query = query.Where("loai_thu_tuc = ?", params.LoaiThuTuc)
	}
	if params.TrangThaiHoSo != "" {
		query = query.Where("trang_thai_ho_so = ?", params.TrangThaiHoSo)
	}

	// 3. Lọc TÙY CHỌN (Khoảng thời gian)
	// IsZero() là cách kiểm tra time.Time có được cung cấp hay không
	if !params.NgayDangKyFrom.IsZero() {
		query = query.Where("ngay_dang_ky >= ?", params.NgayDangKyFrom)
	}
	if !params.NgayDangKyTo.IsZero() {
		query = query.Where("ngay_dang_ky <= ?", params.NgayDangKyTo)
	}

	if !params.NgayTiepNhanFrom.IsZero() {
		query = query.Where("ngay_tiep_nhan >= ?", params.NgayTiepNhanFrom)
	}
	if !params.NgayTiepNhanTo.IsZero() {
		query = query.Where("ngay_tiep_nhan <= ?", params.NgayTiepNhanTo)
	}

	if !params.NgayHenTraFrom.IsZero() {
		query = query.Where("ngay_hen_tra >= ?", params.NgayHenTraFrom)
	}
	if !params.NgayHenTraTo.IsZero() {
		query = query.Where("ngay_hen_tra <= ?", params.NgayHenTraTo)
	}

	// 4. Đếm tổng số bản ghi (TRƯỚC KHI Phân trang)
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 5. Phân trang
	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize)

	// 6. Preload thông tin DoanhNghiep (giống GetHoSoDetails)
	// Chúng ta KHÔNG preload HoSoTaiLieus... vì đây là list view, sẽ rất chậm
	query = query.Preload("DoanhNghiep")

	// 7. Sắp xếp (ORDER BY) - Bạn có thể thêm param cho việc này
	// Tạm thời sắp xếp theo ngày tạo mới nhất
	query = query.Order("created_at DESC")

	// 8. Thực thi truy vấn
	err = query.Find(&hoSos).Error
	if err != nil {
		return nil, 0, err
	}

	return hoSos, total, nil
}

func (r *hoSoRepo) GetHoSoByID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error) {
	var hoSo models.HoSo
	err := db.WithContext(ctx).First(&hoSo, "id = ?", hoSoID).Error
	return &hoSo, err
}

func (r *hoSoRepo) UpdateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error {
	return db.WithContext(ctx).Save(hoSo).Error
}

func (r *hoSoRepo) DeleteHoSo(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) error {

	return db.WithContext(ctx).Delete(&models.HoSo{}, hoSoID).Error
}

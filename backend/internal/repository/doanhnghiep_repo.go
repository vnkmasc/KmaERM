package repository

import (
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type DoanhNghiepRepository interface {
	Create(tx *gorm.DB, dn *models.DoanhNghiep) error
	GetByID(id uuid.UUID) (*models.DoanhNghiep, error)
	GetByMaSo(maSo string) (*models.DoanhNghiep, error)
	Update(dn *models.DoanhNghiep) (*models.DoanhNghiep, error)
	List(page, limit int, tenVI, tenEN, vietTat, maSo string) ([]models.DoanhNghiep, int64, error)
	Delete(id uuid.UUID) error
	UploadGCN(id uuid.UUID, filePath string) error
}

type doanhNghiepRepo struct {
	db *gorm.DB
}

func NewDoanhNghiepRepository(db *gorm.DB) DoanhNghiepRepository {
	return &doanhNghiepRepo{
		db: db,
	}
}

func (r *doanhNghiepRepo) Create(tx *gorm.DB, dn *models.DoanhNghiep) error {
	// Nếu tx == nil thì dùng r.db mặc định, nhưng trong logic này ta luôn truyền tx
	if tx == nil {
		tx = r.db
	}
	return tx.Create(dn).Error
}

func (r *doanhNghiepRepo) GetByID(id uuid.UUID) (*models.DoanhNghiep, error) {
	var dn models.DoanhNghiep
	// Dùng Preload("HoSos") để tải cả các hồ sơ liên quan
	result := r.db.Preload("HoSos").First(&dn, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &dn, nil
}

func (r *doanhNghiepRepo) GetByMaSo(maSo string) (*models.DoanhNghiep, error) {
	var dn models.DoanhNghiep
	err := r.db.Where("ma_so_doanh_nghiep = ?", maSo).First(&dn).Error
	if err != nil {
		return nil, err
	}
	return &dn, nil
}
func (r *doanhNghiepRepo) List(page, limit int, tenVI, tenEN, vietTat, maSo string) ([]models.DoanhNghiep, int64, error) {
	var dns []models.DoanhNghiep
	var total int64

	// Phân trang mặc định
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	query := r.db.Model(&models.DoanhNghiep{})

	// Thêm điều kiện tìm kiếm nếu có param
	if tenVI != "" {
		query = query.Where("LOWER(ten_doanh_nghiep_vi) ILIKE LOWER(?)", "%"+tenVI+"%")
	}
	if tenEN != "" {
		query = query.Where("LOWER(ten_doanh_nghiep_en) ILIKE LOWER(?)", "%"+tenEN+"%")
	}
	if vietTat != "" {
		query = query.Where("LOWER(ten_viet_tat) ILIKE LOWER(?)", "%"+vietTat+"%")
	}
	if maSo != "" {
		query = query.Where("ma_so_doanh_nghiep ILIKE ?", "%"+maSo+"%")
	}

	// Đếm tổng số bản ghi phù hợp
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Lấy dữ liệu phân trang
	result := query.Preload("HoSos").Limit(limit).Offset(offset).Order("created_at desc").Find(&dns)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return dns, total, nil
}

func (r *doanhNghiepRepo) Update(dn *models.DoanhNghiep) (*models.DoanhNghiep, error) {
	result := r.db.Save(dn)
	if result.Error != nil {
		return nil, result.Error
	}
	return dn, nil
}

func (r *doanhNghiepRepo) Delete(id uuid.UUID) error {
	result := r.db.Delete(&models.DoanhNghiep{}, id)
	return result.Error
}

func (r *doanhNghiepRepo) UploadGCN(id uuid.UUID, filePath string) error {
	result := r.db.Model(&models.DoanhNghiep{}).Where("id = ?", id).
		Update("file_gcndkdn", filePath)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

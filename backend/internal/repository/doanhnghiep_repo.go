package repository

import (
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type DoanhNghiepRepository interface {
	Create(dn *models.DoanhNghiep) (*models.DoanhNghiep, error)
	GetByID(id uuid.UUID) (*models.DoanhNghiep, error)
	GetByMaSo(maSo string) (*models.DoanhNghiep, error)
	List(page, limit int) ([]models.DoanhNghiep, int64, error)
	Update(dn *models.DoanhNghiep) (*models.DoanhNghiep, error)
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

func (r *doanhNghiepRepo) Create(dn *models.DoanhNghiep) (*models.DoanhNghiep, error) {
	result := r.db.Create(dn)
	if result.Error != nil {
		return nil, result.Error
	}

	return dn, nil
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
	result := r.db.Where("ma_so_doanh_nghiep = ?", maSo).First(&dn)
	if result.Error != nil {
		return nil, result.Error
	}
	return &dn, nil
}

func (r *doanhNghiepRepo) List(page, limit int) ([]models.DoanhNghiep, int64, error) {
	var dns []models.DoanhNghiep
	var total int64

	// Đặt giá trị mặc định cho phân trang
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	// Giới hạn limit tối đa để bảo vệ CSDL
	if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit

	// Đếm tổng số bản ghi
	r.db.Model(&models.DoanhNghiep{}).Count(&total)

	// Lấy dữ liệu phân trang
	result := r.db.Preload("HoSos").Limit(limit).Offset(offset).Order("created_at desc").Find(&dns)
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

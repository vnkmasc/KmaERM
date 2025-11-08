package repository

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type TaiLieuRepository interface {
	GetLoaiTaiLieuByTen(ctx context.Context, db *gorm.DB, ten string) (*models.LoaiTaiLieu, error)
	CreateHoSoTaiLieu(ctx context.Context, db *gorm.DB, hstl *models.HoSoTaiLieu) error
	CreateTaiLieu(ctx context.Context, db *gorm.DB, taiLieu *models.TaiLieu) error
	ListLoaiTaiLieu(ctx context.Context, db *gorm.DB, tenTaiLieu []string) ([]models.LoaiTaiLieu, error)
	GetTaiLieuByID(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) (*models.TaiLieu, error)
	DeleteTaiLieu(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) error

	ListFilePathsByHoSoID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) ([]string, error)
}

type taiLieuRepo struct{}

func NewTaiLieuRepository() TaiLieuRepository {
	return &taiLieuRepo{}
}
func (r *taiLieuRepo) ListLoaiTaiLieu(ctx context.Context, db *gorm.DB, tenTaiLieu []string) ([]models.LoaiTaiLieu, error) {
	var loaiTaiLieus []models.LoaiTaiLieu
	query := db.WithContext(ctx).Model(&models.LoaiTaiLieu{})

	if len(tenTaiLieu) > 0 {
		query = query.Where("ten IN ?", tenTaiLieu)
	}

	err := query.Order("ten ASC").Find(&loaiTaiLieus).Error
	if err != nil {
		return nil, err
	}
	return loaiTaiLieus, nil
}
func (r *taiLieuRepo) GetLoaiTaiLieuByTen(ctx context.Context, db *gorm.DB, ten string) (*models.LoaiTaiLieu, error) {
	var loaiTaiLieu models.LoaiTaiLieu
	err := db.WithContext(ctx).Where("ten = ?", ten).First(&loaiTaiLieu).Error
	return &loaiTaiLieu, err
}

func (r *taiLieuRepo) CreateHoSoTaiLieu(ctx context.Context, db *gorm.DB, hstl *models.HoSoTaiLieu) error {
	return db.WithContext(ctx).Create(hstl).Error
}

func (r *taiLieuRepo) CreateTaiLieu(ctx context.Context, db *gorm.DB, taiLieu *models.TaiLieu) error {
	return db.WithContext(ctx).Create(taiLieu).Error
}

func (r *taiLieuRepo) GetTaiLieuByID(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) (*models.TaiLieu, error) {
	var taiLieu models.TaiLieu
	err := db.WithContext(ctx).First(&taiLieu, "id = ?", taiLieuID).Error
	return &taiLieu, err
}

func (r *taiLieuRepo) DeleteTaiLieu(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) error {
	return db.WithContext(ctx).Delete(&models.TaiLieu{}, taiLieuID).Error
}
func (r *taiLieuRepo) ListFilePathsByHoSoID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) ([]string, error) {
	var paths []string

	err := db.WithContext(ctx).Model(&models.TaiLieu{}).
		Joins("JOIN ho_so_tai_lieu ON ho_so_tai_lieu.id = tai_lieu.ho_so_tai_lieu_id").
		Where("ho_so_tai_lieu.ho_so_id = ?", hoSoID).
		Pluck("duong_dan", &paths).Error

	if err != nil {
		return nil, err
	}
	return paths, nil
}

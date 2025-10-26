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

	GetTaiLieuByID(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) (*models.TaiLieu, error)
	DeleteTaiLieu(ctx context.Context, db *gorm.DB, taiLieuID uuid.UUID) error
}

type taiLieuRepo struct{}

func NewTaiLieuRepository() TaiLieuRepository {
	return &taiLieuRepo{}
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

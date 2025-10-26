package repository

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type HoSoRepository interface {
	CreateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error
	GetHoSoDetails(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error)
	GetHoSoByID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error)
	UpdateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error
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

func (r *hoSoRepo) GetHoSoByID(ctx context.Context, db *gorm.DB, hoSoID uuid.UUID) (*models.HoSo, error) {
	var hoSo models.HoSo
	err := db.WithContext(ctx).First(&hoSo, "id = ?", hoSoID).Error
	return &hoSo, err
}

func (r *hoSoRepo) UpdateHoSo(ctx context.Context, db *gorm.DB, hoSo *models.HoSo) error {
	return db.WithContext(ctx).Save(hoSo).Error
}

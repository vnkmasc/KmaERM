package repository

import (
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(tx *gorm.DB, user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetRoleByName(name string) (*models.Role, error)
	UpdatePassword(id uuid.UUID, newHash string) error
	GetByID(id uuid.UUID) (*models.User, error)
}

type userRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(tx *gorm.DB, user *models.User) error {
	if tx == nil {
		tx = r.db
	}
	return tx.Create(user).Error
}

func (r *userRepo) GetByEmail(email string) (*models.User, error) {
	var u models.User
	err := r.db.Preload("Role").Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByID(id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.db.First(&u, id).Error
	return &u, err
}

func (r *userRepo) GetRoleByName(name string) (*models.Role, error) {
	var role models.Role
	err := r.db.Where("name = ?", name).First(&role).Error
	return &role, err
}

func (r *userRepo) UpdatePassword(id uuid.UUID, newHash string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("password_hash", newHash).Error
}

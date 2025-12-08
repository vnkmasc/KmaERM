package service

import (
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/gosimple/slug"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"

	"gorm.io/gorm"
)

var ErrMaSoDaTonTai = errors.New("mã số doanh nghiệp đã tồn tại")
var ErrUploadFile = errors.New("không thể lưu file vật lý")

type DoanhNghiepService interface {
	CreateWithAccount(req *dto.CreateDoanhNghiepRequest) (*models.DoanhNghiep, error)
	GetByID(id uuid.UUID) (*models.DoanhNghiep, error)
	GetByMaSo(maSo string) (*models.DoanhNghiep, error)
	ChangeMSDN(id uuid.UUID, input *ChangeMSDNInput) (*models.DoanhNghiep, error)
	Update(id uuid.UUID, dnData *models.DoanhNghiep) (*models.DoanhNghiep, error)
	Delete(id uuid.UUID) error
	UploadGCN(id uuid.UUID, fileData []byte, originalFilename string) (*models.DoanhNghiep, error)
	GetGCNFilePath(id uuid.UUID) (string, error)
	List(page, limit int, tenVI, tenEN, vietTat, maSo string) ([]models.DoanhNghiep, int64, error)
}

type doanhNghiepService struct {
	dnRepo   repository.DoanhNghiepRepository
	userRepo repository.UserRepository // <--- Thêm cái này
	db       *gorm.DB                  // <--- Cần DB object để bắt đầu Transaction
}

func NewDoanhNghiepService(dnRepo repository.DoanhNghiepRepository, userRepo repository.UserRepository, db *gorm.DB) DoanhNghiepService {
	return &doanhNghiepService{
		dnRepo:   dnRepo,
		userRepo: userRepo,
		db:       db,
	}
}
func (s *doanhNghiepService) CreateWithAccount(req *dto.CreateDoanhNghiepRequest) (*models.DoanhNghiep, error) {
	// 1. Validate cơ bản
	// Check DN tồn tại
	if existing, _ := s.dnRepo.GetByMaSo(req.MaSoDoanhNghiep); existing != nil {
		return nil, errors.New("mã số doanh nghiệp đã tồn tại")
	}
	// Check Email Account tồn tại
	if existingUser, _ := s.userRepo.GetByEmail(req.AccountEmail); existingUser != nil && existingUser.Email != "" {
		return nil, errors.New("email tài khoản đã được sử dụng")
	}

	// 2. Hash Password
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(req.AccountPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("lỗi mã hóa mật khẩu")
	}

	// 3. Bắt đầu Transaction
	var resultDN models.DoanhNghiep

	// Transaction: Nếu bất kỳ bước nào lỗi, toàn bộ sẽ bị hủy (Rollback)
	err = s.db.Transaction(func(tx *gorm.DB) error {

		// A. Tạo Doanh Nghiệp
		newDN := models.DoanhNghiep{
			TenDoanhNghiepVI:  req.TenDoanhNghiepVI,
			TenDoanhNghiepEN:  req.TenDoanhNghiepEN,
			TenVietTat:        req.TenVietTat,
			DiaChi:            req.DiaChi,
			MaSoDoanhNghiep:   req.MaSoDoanhNghiep,
			NgayCapMSDNLanDau: req.NgayCapMSDNLanDau,
			NoiCapMSDN:        req.NoiCapMSDN,
			SDT:               req.SDT,
			Email:             req.Email, // Email chung của cty
			Website:           req.Website,
			VonDieuLe:         req.VonDieuLe,
			NguoiDaiDien:      req.NguoiDaiDien,
			ChucVu:            req.ChucVu,
			LoaiDinhDanh:      req.LoaiDinhDanh,
			NgayCapDinhDanh:   req.NgayCapDinhDanh,
			NoiCapDinhDanh:    req.NoiCapDinhDanh,
			Status:            false, // Mặc định là chưa kích hoạt
		}

		// Truyền 'tx' vào repo
		if err := s.dnRepo.Create(tx, &newDN); err != nil {
			return err
		}
		resultDN = newDN // Lưu lại để trả về

		// B. Lấy Role DOANH_NGHIEP
		role, err := s.userRepo.GetRoleByName("DOANH_NGHIEP")
		if err != nil {
			return errors.New("role 'DOANH_NGHIEP' chưa được cấu hình trong DB")
		}

		// C. Tạo User Account
		newUser := models.User{
			Email:         req.AccountEmail,
			PasswordHash:  string(hashedPass),
			FullName:      req.AccountFullName,
			IsActive:      true,
			RoleID:        role.ID,
			DoanhNghiepID: &newDN.ID, // QUAN TRỌNG: Gắn ID doanh nghiệp vừa tạo
		}

		if err := s.userRepo.Create(tx, &newUser); err != nil {
			return err
		}

		return nil // Commit Transaction
	})

	if err != nil {
		return nil, err
	}

	return &resultDN, nil
}

func (s *doanhNghiepService) GetByID(id uuid.UUID) (*models.DoanhNghiep, error) {
	return s.dnRepo.GetByID(id)
}

func (s *doanhNghiepService) GetByMaSo(maSo string) (*models.DoanhNghiep, error) {
	return s.dnRepo.GetByMaSo(maSo)
}

func (s *doanhNghiepService) List(page, limit int, tenVI, tenEN, vietTat, maSo string) ([]models.DoanhNghiep, int64, error) {
	return s.dnRepo.List(page, limit, tenVI, tenEN, vietTat, maSo)
}

func (s *doanhNghiepService) Update(id uuid.UUID, dnData *models.DoanhNghiep) (*models.DoanhNghiep, error) {
	dn, err := s.dnRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	dn.TenDoanhNghiepVI = dnData.TenDoanhNghiepVI
	dn.TenDoanhNghiepEN = dnData.TenDoanhNghiepEN
	dn.TenVietTat = dnData.TenVietTat
	dn.DiaChi = dnData.DiaChi
	dn.SDT = dnData.SDT
	dn.Email = dnData.Email
	dn.Website = dnData.Website
	dn.VonDieuLe = dnData.VonDieuLe
	dn.NguoiDaiDien = dnData.NguoiDaiDien
	dn.ChucVu = dnData.ChucVu
	dn.LoaiDinhDanh = dnData.LoaiDinhDanh
	dn.NgayCapDinhDanh = dnData.NgayCapDinhDanh
	dn.NoiCapDinhDanh = dnData.NoiCapDinhDanh

	return s.dnRepo.Update(dn)
}

type ChangeMSDNInput struct {
	MaSoDoanhNghiepMoi string    `json:"ma_so_doanh_nghiep_moi" binding:"required,min=10,max=14"`
	NgayThayDoi        time.Time `json:"ngay_thay_doi" binding:"required"`
	NoiCapMoi          string    `json:"noi_cap_moi" binding:"required"`
}

func (s *doanhNghiepService) ChangeMSDN(id uuid.UUID, input *ChangeMSDNInput) (*models.DoanhNghiep, error) {
	dn, err := s.dnRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if input.MaSoDoanhNghiepMoi != dn.MaSoDoanhNghiep {
		existing, err := s.dnRepo.GetByMaSo(input.MaSoDoanhNghiepMoi)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if existing != nil {
			return nil, errors.New("mã số doanh nghiệp mới đã tồn tại")
		}
	}

	dn.MaSoDoanhNghiep = input.MaSoDoanhNghiepMoi
	dn.NgayThayDoiMSDN = &input.NgayThayDoi
	dn.NoiCapMSDN = input.NoiCapMoi

	var soLanMoi int
	if dn.SoLanThayDoiMSDN != nil {
		soLanMoi = *dn.SoLanThayDoiMSDN + 1
	} else {
		soLanMoi = 1
	}
	dn.SoLanThayDoiMSDN = &soLanMoi

	return s.dnRepo.Update(dn)
}

func (s *doanhNghiepService) Delete(id uuid.UUID) error {
	_, err := s.dnRepo.GetByID(id)
	if err != nil {
		return err
	}

	// --- Ví dụ Business Logic Mở rộng ---
	// (Tưởng tượng) 2. Kiểm tra xem DN này có hồ sơ nào không
	// (cần hoSoRepo)
	// count, _ := s.hoSoRepo.CountByDoanhNghiepID(id)
	// if count > 0 {
	// 	 return errors.New("không thể xóa doanh nghiệp vì vẫn còn hồ sơ liên quan")
	// }

	return s.dnRepo.Delete(id)
}

func (s *doanhNghiepService) UploadGCN(id uuid.UUID, fileData []byte, originalFilename string) (*models.DoanhNghiep, error) {
	dn, err := s.dnRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	tenDoanhNghiep := dn.TenDoanhNghiepVI

	slugName := slug.Make(tenDoanhNghiep)
	sanitizedName := strings.ReplaceAll(slugName, "-", "_")

	fileExtension := strings.ToLower(filepath.Ext(originalFilename))

	storageDir := filepath.Join("..", "uploads", "gcn", id.String())

	newFilename := fmt.Sprintf("%s_%s%s", id.String(), sanitizedName, fileExtension)

	fullPath := filepath.Join(storageDir, newFilename)

	dbPath := filepath.ToSlash(filepath.Join("uploads", "gcn", id.String(), newFilename))

	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Printf("Lỗi tạo thư mục %s: %v", storageDir, err)
		return nil, ErrUploadFile
	}

	if err := os.WriteFile(fullPath, fileData, 0666); err != nil {
		log.Printf("Lỗi ghi file %s: %v", fullPath, err)
		os.RemoveAll(storageDir)
		return nil, ErrUploadFile
	}

	if err := s.dnRepo.UploadGCN(id, dbPath); err != nil {
		os.Remove(fullPath)
		return nil, err
	}

	dn.FileGCNDKDN = dbPath
	return dn, nil
}

func (s *doanhNghiepService) GetGCNFilePath(id uuid.UUID) (string, error) {
	dn, err := s.dnRepo.GetByID(id)
	if err != nil {
		return "", err
	}
	if dn.FileGCNDKDN == "" {
		return "", errors.New("file giấy chứng nhận chưa được upload")
	}
	return dn.FileGCNDKDN, nil
}

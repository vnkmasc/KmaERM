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
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"

	"gorm.io/gorm"
)

var ErrMaSoDaTonTai = errors.New("mã số doanh nghiệp đã tồn tại")
var ErrUploadFile = errors.New("không thể lưu file vật lý")

type DoanhNghiepService interface {
	Create(dn *models.DoanhNghiep) (*models.DoanhNghiep, error)
	GetByID(id uuid.UUID) (*models.DoanhNghiep, error)
	GetByMaSo(maSo string) (*models.DoanhNghiep, error)
	List(page, limit int) ([]models.DoanhNghiep, int64, error)
	ChangeMSDN(id uuid.UUID, input *ChangeMSDNInput) (*models.DoanhNghiep, error)
	Update(id uuid.UUID, dnData *models.DoanhNghiep) (*models.DoanhNghiep, error)
	Delete(id uuid.UUID) error
	UploadGCN(id uuid.UUID, fileData []byte, originalFilename string) (*models.DoanhNghiep, error)
	GetGCNFilePath(id uuid.UUID) (string, error)
}

type doanhNghiepService struct {
	dnRepo repository.DoanhNghiepRepository
}

func NewDoanhNghiepService(dnRepo repository.DoanhNghiepRepository) DoanhNghiepService {
	return &doanhNghiepService{
		dnRepo: dnRepo,
	}
}

func (s *doanhNghiepService) Create(dn *models.DoanhNghiep) (*models.DoanhNghiep, error) {
	existing, err := s.dnRepo.GetByMaSo(dn.MaSoDoanhNghiep)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, ErrMaSoDaTonTai
	}

	return s.dnRepo.Create(dn)
}

func (s *doanhNghiepService) GetByID(id uuid.UUID) (*models.DoanhNghiep, error) {
	return s.dnRepo.GetByID(id)
}

func (s *doanhNghiepService) GetByMaSo(maSo string) (*models.DoanhNghiep, error) {
	return s.dnRepo.GetByMaSo(maSo)
}

func (s *doanhNghiepService) List(page, limit int) ([]models.DoanhNghiep, int64, error) {
	dns, total, err := s.dnRepo.List(page, limit)
	if err != nil {
		return nil, 0, err
	}
	return dns, total, nil
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

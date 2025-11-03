package service

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"gorm.io/gorm"
)

var (
	ErrLoaiThuTucKhongHopLe   = errors.New("loại thủ tục không xác định")
	ErrHoSoKhongTimThay       = errors.New("không tìm thấy hồ sơ")
	ErrKheTaiLieuKhongTonTai  = errors.New("khe cắm tài liệu không tồn tại")
	ErrDoanhNghiepKhongTonTai = errors.New("doanh nghiệp không tồn tại")
	ErrTaiLieuKhongTimThay    = errors.New("không tìm thấy tài liệu")
)

type HoSoService interface {
	CreateHoSo(ctx context.Context, req *dto.CreateHoSoRequest) (*models.HoSo, error)
	ListHoSo(ctx context.Context, doanhNghiepID uuid.UUID, params *dto.HoSoSearchParams, page int, pageSize int) (*dto.HoSoListResponse, error)
	GetHoSoDetails(ctx context.Context, hoSoID uuid.UUID) (*models.HoSo, error)
	UploadTaiLieu(ctx context.Context, req *dto.UploadTaiLieuRequest, tempFilePath string, fileName string) (*models.TaiLieu, error)
	DeleteTaiLieu(ctx context.Context, taiLieuID uuid.UUID) error
	GetTaiLieuByID(ctx context.Context, taiLieuID uuid.UUID) (*models.TaiLieu, error)
	UpdateHoSo(ctx context.Context, hoSoID uuid.UUID, req *dto.UpdateHoSoRequest) (*models.HoSo, error)
}

type hoSoService struct {
	db          *gorm.DB
	hosoRepo    repository.HoSoRepository
	tailieuRepo repository.TaiLieuRepository
}

func NewHoSoService(
	db *gorm.DB,
	hosoRepo repository.HoSoRepository,
	tailieuRepo repository.TaiLieuRepository,
) HoSoService {
	return &hoSoService{
		db:          db,
		hosoRepo:    hosoRepo,
		tailieuRepo: tailieuRepo,
	}
}

func (s *hoSoService) CreateHoSo(ctx context.Context, req *dto.CreateHoSoRequest) (*models.HoSo, error) {
	generatedMaHoSo := fmt.Sprintf("HS-%s", time.Now().Format("20060102-150405"))

	hoSo := models.HoSo{
		DoanhNghiepID: req.DoanhNghiepID,
		MaHoSo:        generatedMaHoSo,
		LoaiThuTuc:    req.LoaiThuTuc,
		NgayDangKy:    req.NgayDangKy,
		NgayTiepNhan:  req.NgayTiepNhan,
		NgayHenTra:    req.NgayHenTra,
		TrangThaiHoSo: "MoiTao",
	}

	requiredTaiLieuTen, err := s.getRequiredTaiLieu(req.LoaiThuTuc)
	if err != nil {
		return nil, err
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("không thể bắt đầu transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := s.hosoRepo.CreateHoSo(ctx, tx, &hoSo); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			if pgErr.ConstraintName == "ho_so_doanh_nghiep_id_fkey" {
				tx.Rollback()
				return nil, ErrDoanhNghiepKhongTonTai
			}
		}
		tx.Rollback()
		return nil, fmt.Errorf("lỗi tạo hồ sơ: %w", err)
	}

	for _, tenTaiLieu := range requiredTaiLieuTen {
		loaiTL, err := s.tailieuRepo.GetLoaiTaiLieuByTen(ctx, tx, tenTaiLieu)
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("lỗi cấu hình: không tìm thấy loại tài liệu '%s': %w", tenTaiLieu, err)
		}

		hstl := models.HoSoTaiLieu{
			HoSoID:        hoSo.ID,
			LoaiTaiLieuID: loaiTL.ID,
		}
		if err := s.tailieuRepo.CreateHoSoTaiLieu(ctx, tx, &hstl); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("lỗi tạo khe tài liệu '%s': %w", tenTaiLieu, err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("không thể commit transaction: %w", err)
	}

	return &hoSo, nil
}

func (s *hoSoService) getRequiredTaiLieu(loaiThuTuc string) ([]string, error) {
	switch loaiThuTuc {
	case "Cấp mới Giấy phép kinh doanh":
		return []string{
			"Đơn đề nghị cấp Giấy phép kinh doanh",
			"Giấy chứng nhận đăng ký doanh nghiệp",
			"Danh sách đội ngũ kĩ thuật và văn bằng",
			"Phương án kinh doanh",
			"Phương án bảo mật và an toàn thông tin mạng",
			"Phương án kỹ thuật và Phương án bảo hành bảo trì",
			"Tài liệu kĩ thuật",
			"Giấy chứng nhận hợp quy",
		}, nil

	case "Sửa đổi, bổ sung Giấy phép kinh doanh":
		return []string{
			"Đơn đề nghị cấp sửa đổi, bổ sung Giấy phép kinh doanh",
			"Giấy phép kinh doanh sản phẩm, dịch vụ mật mã dân sự",
			// Ghi chú: Cần bổ sung logic để yêu cầu thêm các tài liệu
			// liên quan đến nội dung sửa đổi (ví dụ: "Tài liệu kĩ thuật"
			// nếu thêm sản phẩm mới).
		}, nil

	case "Gia hạn Giấy phép kinh doanh":
		return []string{
			"Đơn đề nghị gia hạn Giấy phép kinh doanh",
			"Giấy phép kinh doanh sản phẩm, dịch vụ mật mã dân sự",
			"Báo cáo hoạt động của doanh nghiệp",
		}, nil

	case "Cấp lại Giấy phép kinh doanh":
		return []string{
			"Đơn đề nghị cấp lại Giấy phép kinh doanh",
		}, nil

	case "Cấp Giấy phép xuất khẩu, nhập khẩu":
		return []string{
			"Đơn đề nghị cấp Giấy phép xuất khẩu, nhập khẩu",
			"Giấy phép kinh doanh sản phẩm, dịch vụ mật mã dân sự",
			"Tài liệu kĩ thuật",
			"Giấy chứng nhận hợp quy",
		}, nil

	case "Báo cáo hoạt động định kỳ":
		return []string{
			"Báo cáo hoạt động của doanh nghiệp",
		}, nil

	default:
		return nil, ErrLoaiThuTucKhongHopLe
	}
}

func (s *hoSoService) GetHoSoDetails(ctx context.Context, hoSoID uuid.UUID) (*models.HoSo, error) {
	hoSo, err := s.hosoRepo.GetHoSoDetails(ctx, s.db, hoSoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrHoSoKhongTimThay
		}
		return nil, err
	}

	return hoSo, nil
}

func (s *hoSoService) ListHoSo(ctx context.Context, doanhNghiepID uuid.UUID, params *dto.HoSoSearchParams, page int, pageSize int) (*dto.HoSoListResponse, error) {

	// 1. Gọi Repository (Không đổi)
	hoSos, total, err := s.hosoRepo.ListHoSo(ctx, s.db, doanhNghiepID, params, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi lấy danh sách hồ sơ: %w", err)
	}

	// 2. Tạo DTO Response (đã làm phẳng)
	response := &dto.HoSoListResponse{
		Data:     hoSos,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}

	return response, nil
}

func (s *hoSoService) UploadTaiLieu(ctx context.Context, req *dto.UploadTaiLieuRequest, tempFilePath string, fileName string) (*models.TaiLieu, error) {

	var kheTaiLieu models.HoSoTaiLieu
	if err := s.db.WithContext(ctx).First(&kheTaiLieu, "id = ?", req.HoSoTaiLieuID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrKheTaiLieuKhongTonTai
		}
		return nil, fmt.Errorf("lỗi khi kiểm tra khe cắm tài liệu: %w", err)
	}

	hoSoID := kheTaiLieu.HoSoID.String()
	uniqueFileName := filepath.Base(tempFilePath)

	finalUploadDir := filepath.Join("..", "uploads", "ho_so", hoSoID)
	finalDst := filepath.Join(finalUploadDir, uniqueFileName)

	if err := os.MkdirAll(finalUploadDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("không thể tạo thư mục chính thức: %w", err)
	}

	if err := os.Rename(tempFilePath, finalDst); err != nil {
		return nil, fmt.Errorf("không thể di chuyển file: %w", err)
	}

	tieuDe := req.TieuDe
	if tieuDe == "" {
		tieuDe = fileName
	}

	relativePath := filepath.ToSlash(filepath.Join("uploads", "ho_so", hoSoID, uniqueFileName))

	taiLieu := models.TaiLieu{
		HoSoTaiLieuID: req.HoSoTaiLieuID,
		TieuDe:        tieuDe,
		DuongDan:      relativePath,
		CreatedAt:     time.Now(),
	}

	if err := s.tailieuRepo.CreateTaiLieu(ctx, s.db, &taiLieu); err != nil {
		os.Remove(finalDst)
		return nil, fmt.Errorf("lỗi lưu thông tin file vào CSDL: %w", err)
	}

	return &taiLieu, nil
}

func (s *hoSoService) DeleteTaiLieu(ctx context.Context, taiLieuID uuid.UUID) error {
	taiLieu, err := s.tailieuRepo.GetTaiLieuByID(ctx, s.db, taiLieuID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTaiLieuKhongTimThay
		}
		return fmt.Errorf("lỗi khi tìm tài liệu: %w", err)
	}

	if err := s.tailieuRepo.DeleteTaiLieu(ctx, s.db, taiLieuID); err != nil {
		return fmt.Errorf("lỗi khi xóa tài liệu khỏi CSDL: %w", err)
	}

	filePath := filepath.Join("..", taiLieu.DuongDan)
	filePath = filepath.Clean(filePath)

	if _, err := os.Stat(filePath); err != nil {
		if os.IsNotExist(err) {
			fmt.Printf("File vật lý %s không tồn tại — có thể đã bị xóa trước đó.\n", filePath)
			return nil
		}
		return fmt.Errorf("lỗi khi kiểm tra file %s: %w", filePath, err)
	}

	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("lỗi khi xóa file vật lý %s: %w", filePath, err)
	}

	fmt.Printf("Đã xóa file vật lý thành công: %s\n", filePath)
	return nil
}

func (s *hoSoService) GetTaiLieuByID(ctx context.Context, taiLieuID uuid.UUID) (*models.TaiLieu, error) {
	taiLieu, err := s.tailieuRepo.GetTaiLieuByID(ctx, s.db, taiLieuID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTaiLieuKhongTimThay
		}
		return nil, fmt.Errorf("lỗi khi tìm tài liệu: %w", err)
	}
	return taiLieu, nil
}

func (s *hoSoService) UpdateHoSo(ctx context.Context, hoSoID uuid.UUID, req *dto.UpdateHoSoRequest) (*models.HoSo, error) {
	hoSo, err := s.hosoRepo.GetHoSoByID(ctx, s.db, hoSoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrHoSoKhongTimThay
		}
		return nil, fmt.Errorf("lỗi khi tìm hồ sơ: %w", err)
	}
	hoSo.NgayDangKy = req.NgayDangKy
	hoSo.NgayTiepNhan = req.NgayTiepNhan
	hoSo.NgayHenTra = req.NgayHenTra
	hoSo.SoGiayPhepTheoHoSo = req.SoGiayPhepTheoHoSo
	hoSo.TrangThaiHoSo = req.TrangThaiHoSo

	if err := s.hosoRepo.UpdateHoSo(ctx, s.db, hoSo); err != nil {
		return nil, fmt.Errorf("lỗi khi cập nhật hồ sơ: %w", err)
	}

	return hoSo, nil
}

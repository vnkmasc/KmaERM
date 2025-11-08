package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"github.com/vnkmasc/KmaERM/backend/pkg/blockchain"
	"gorm.io/gorm"
)

var (
	ErrGiayPhepKhongTimThay = errors.New("không tìm thấy giấy phép")
	ErrHoSoDaCoGiayPhep     = errors.New("hồ sơ này đã được cấp giấy phép")
	ErrGiayPhepDaBiThuHoi   = errors.New("giấy phép này đã bị thu hồi hoặc hết hạn, không thể thao tác")
	ErrGiayPhepDangHieuLuc  = errors.New("giấy phép đang có hiệu lực, không thể xóa")

	ErrGiayPhepDaDongBo   = errors.New("giấy phép này đã được đồng bộ lên blockchain")
	ErrGiayPhepChuaDuHash = errors.New("giấy phép thiếu h1 (hash dữ liệu) hoặc h2 (hash file)")
	ErrBlockchainOffline  = errors.New("dịch vụ blockchain không khả dụng (chế độ offline)")
)

type GiayPhepService interface {
	CreateGiayPhep(ctx context.Context, req *dto.CreateGiayPhepRequest) (*dto.GiayPhepResponse, error)
	UpdateGiayPhep(ctx context.Context, giayPhepID uuid.UUID, req *dto.UpdateGiayPhepRequest) (*models.GiayPhep, error)
	DeleteGiayPhep(ctx context.Context, giayPhepID uuid.UUID) error
	GetGiayPhepByID(ctx context.Context, giayPhepID uuid.UUID) (*dto.GiayPhepResponse, error)
	ListGiayPhep(ctx context.Context, doanhNghiepID uuid.UUID, params *dto.GiayPhepSearchParams, page int, pageSize int) (*dto.GiayPhepListResponse, error)
	UploadGiayPhepFile(ctx context.Context, giayPhepID uuid.UUID, tempFilePath string, fileName string) (*dto.GiayPhepResponse, error)
	PushToBlockchain(ctx context.Context, giayPhepID uuid.UUID) error
}

type giayPhepService struct {
	db           *gorm.DB
	gpRepo       repository.GiayPhepRepository
	hosoRepo     repository.HoSoRepository
	fabricClient *blockchain.FabricClient
}

func NewGiayPhepService(
	db *gorm.DB,
	gpRepo repository.GiayPhepRepository,
	hosoRepo repository.HoSoRepository,
	fabricClient *blockchain.FabricClient,
) GiayPhepService {
	return &giayPhepService{
		db:           db,
		gpRepo:       gpRepo,
		hosoRepo:     hosoRepo,
		fabricClient: fabricClient,
	}
}

const (
	TrangThaiBCChuaDongBo = "ChuaDongBo"
	TrangThaiBCDaDongBo   = "DaDongBo"
	TrangThaiBCLoiDongBo  = "LoiDongBo"
)

func (s *giayPhepService) CreateGiayPhep(ctx context.Context, req *dto.CreateGiayPhepRequest) (*dto.GiayPhepResponse, error) {
	// 1. Kiểm tra logic (Sửa: Dùng CheckHoSoExists)
	exists, err := s.gpRepo.CheckHoSoExists(ctx, s.db, req.HoSoID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra hồ sơ: %w", err)
	}
	if exists {
		return nil, ErrHoSoDaCoGiayPhep
	}

	// 2. Tính h1 hash (Sửa: Xử lý 2 giá trị trả về)
	h1Hash, err := blockchain.CalculateDataHash(
		req.HoSoID.String(),
		req.LoaiGiayPhep,
		req.SoGiayPhep,
		req.NgayHieuLuc.Format(time.RFC3339),
		req.NgayHetHan.Format(time.RFC3339),
		req.TrangThaiGiayPhep,
	)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi tính toán h1 hash: %w", err)
	}
	h1HashStr := h1Hash

	trangThaiBC := TrangThaiBCChuaDongBo

	// 3. Map DTO -> Model
	giayPhep := models.GiayPhep{
		HoSoID:              req.HoSoID,
		LoaiGiayPhep:        req.LoaiGiayPhep,
		SoGiayPhep:          req.SoGiayPhep,
		NgayHieuLuc:         req.NgayHieuLuc,
		NgayHetHan:          req.NgayHetHan,
		TrangThaiGiayPhep:   req.TrangThaiGiayPhep,
		H1Hash:              &h1HashStr,
		TrangThaiBlockchain: &trangThaiBC,
	}

	// 4. Lưu CSDL
	if err := s.gpRepo.CreateGiayPhep(ctx, s.db, &giayPhep); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation
				if pgErr.ConstraintName == "giay_phep_ho_so_id_key" {
					return nil, ErrHoSoDaCoGiayPhep
				}
				if pgErr.ConstraintName == "giay_phep_so_giay_phep_key" {
					return nil, fmt.Errorf("số giấy phép '%s' đã tồn tại", req.SoGiayPhep)
				}
				return nil, fmt.Errorf("vi phạm ràng buộc duy nhất: %s", pgErr.Detail)
			}
			if pgErr.Code == "23503" { // foreign_key_violation
				if pgErr.ConstraintName == "giay_phep_ho_so_id_fkey" {
					return nil, ErrHoSoKhongTimThay // Trả về lỗi nghiệp vụ
				}
			}
		}
		return nil, fmt.Errorf("lỗi khi tạo giấy phép: %w", err)
	}

	// 5. Trả về DTO (Sửa: Trả về DTO, không phải model)
	return s.GetGiayPhepByID(ctx, giayPhep.ID)
}

func (s *giayPhepService) UpdateGiayPhep(ctx context.Context, giayPhepID uuid.UUID, req *dto.UpdateGiayPhepRequest) (*models.GiayPhep, error) {
	giayPhep, err := s.gpRepo.GetGiayPhepByID(ctx, s.db, giayPhepID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGiayPhepKhongTimThay
		}
		return nil, fmt.Errorf("lỗi khi tìm giấy phép: %w", err)
	}

	h1Hash, err := blockchain.CalculateDataHash(
		giayPhep.HoSoID.String(),
		req.SoGiayPhep,
		req.LoaiGiayPhep,
		req.NgayHieuLuc.Format(time.RFC3339),
		req.NgayHetHan.Format(time.RFC3339),
		req.TrangThaiGiayPhep,
	)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi tính toán h1 hash: %w", err)
	}

	giayPhep.LoaiGiayPhep = req.LoaiGiayPhep
	giayPhep.SoGiayPhep = req.SoGiayPhep
	giayPhep.NgayHieuLuc = req.NgayHieuLuc
	giayPhep.NgayHetHan = req.NgayHetHan
	giayPhep.TrangThaiGiayPhep = req.TrangThaiGiayPhep
	giayPhep.H1Hash = &h1Hash
	// H2Hash và FileDuongDan không bị ảnh hưởng

	if err := s.gpRepo.UpdateGiayPhep(ctx, s.db, giayPhep); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "giay_phep_so_giay_phep_key" {
				return nil, fmt.Errorf("số giấy phép '%s' đã tồn tại", req.SoGiayPhep)
			}
		}
		return nil, fmt.Errorf("lỗi khi cập nhật giấy phép: %w", err)
	}

	return giayPhep, nil
}

func (s *giayPhepService) DeleteGiayPhep(ctx context.Context, giayPhepID uuid.UUID) error {
	giayPhep, err := s.gpRepo.GetGiayPhepByID(ctx, s.db, giayPhepID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrGiayPhepKhongTimThay
		}
		return err
	}

	if giayPhep.TrangThaiGiayPhep == "HieuLuc" || giayPhep.TrangThaiGiayPhep == "SapHetHan" {
		return ErrGiayPhepDangHieuLuc
	}

	if err := s.gpRepo.DeleteGiayPhep(ctx, s.db, giayPhepID); err != nil {
		return fmt.Errorf("lỗi khi xóa CSDL: %w", err)
	}

	if giayPhep.FileDuongDan != nil && *giayPhep.FileDuongDan != "" {
		dbPath := *giayPhep.FileDuongDan
		osSpecificDbPath := filepath.FromSlash(dbPath)
		physicalPath := filepath.Join("..", osSpecificDbPath)

		if err := os.Remove(physicalPath); err != nil {
			if !os.IsNotExist(err) {
				fmt.Printf("Cảnh báo: Không thể xóa file vật lý %s: %v\n", physicalPath, err)
			}
		}

		giayPhepDir := filepath.Dir(physicalPath)
		if err := os.RemoveAll(giayPhepDir); err != nil {
			fmt.Printf("Cảnh báo: Không thể xóa thư mục %s: %v\n", giayPhepDir, err)
		}
	}
	return nil
}

func (s *giayPhepService) GetGiayPhepByID(ctx context.Context, giayPhepID uuid.UUID) (*dto.GiayPhepResponse, error) {
	giayPhep, err := s.gpRepo.GetGiayPhepByID(ctx, s.db, giayPhepID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGiayPhepKhongTimThay
		}
		return nil, err
	}
	// 2. Chuyển đổi model -> DTO response
	return s.mapGiayPhepToResponse(ctx, giayPhep)
}

func (s *giayPhepService) ListGiayPhep(
	ctx context.Context,
	doanhNghiepID uuid.UUID, // <-- Thêm tham số này
	params *dto.GiayPhepSearchParams,
	page int,
	pageSize int,
) (*dto.GiayPhepListResponse, error) {

	// 1. Gọi Repository (truyền doanhNghiepID vào)
	giayPheps, total, err := s.gpRepo.ListGiayPhep(ctx, s.db, doanhNghiepID, params, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi lấy danh sách giấy phép: %w", err)
	}

	// 2. Tạo DTO Response (Không đổi, vẫn dùng DTO đã làm phẳng)
	response := &dto.GiayPhepListResponse{
		Data:     giayPheps,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}

	return response, nil
}

func (s *giayPhepService) UploadGiayPhepFile(
	ctx context.Context,
	giayPhepID uuid.UUID,
	tempFilePath string,
	fileName string,
) (*dto.GiayPhepResponse, error) {

	// 1. Lấy bản ghi GiayPhep (Không đổi)
	giayPhep, err := s.gpRepo.GetGiayPhepByID(ctx, s.db, giayPhepID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGiayPhepKhongTimThay
		}
		return nil, err
	}
	if giayPhep.TrangThaiGiayPhep == "ThuHoi" || giayPhep.TrangThaiGiayPhep == "DaHetHan" {
		return nil, ErrGiayPhepDaBiThuHoi
	}
	h2Hash, err := blockchain.CalculateFileHash(tempFilePath)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi tính h2 hash: %w", err)
	}
	h2HashStr := h2Hash

	uniqueFileName := filepath.Base(tempFilePath)

	finalUploadDir := filepath.Join("..", "uploads", "giay_phep", giayPhepID.String())
	finalDst := filepath.Join(finalUploadDir, uniqueFileName)

	dbPath := path.Join("uploads", "giay_phep", giayPhepID.String(), uniqueFileName)

	if err := os.MkdirAll(finalUploadDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("lỗi tạo thư mục: %w", err)
	}

	if err := os.Rename(tempFilePath, finalDst); err != nil {
		return nil, fmt.Errorf("lỗi di chuyển file: %w", err)
	}

	if giayPhep.FileDuongDan != nil && *giayPhep.FileDuongDan != "" {
		oldDbPath := *giayPhep.FileDuongDan
		oldPhysicalPath := filepath.Join("..", "..", oldDbPath)
		if err := os.Remove(oldPhysicalPath); err != nil {
			fmt.Printf("Cảnh báo: Không thể xóa file cũ %s: %v\n", oldPhysicalPath, err)
		}
	}

	giayPhep.FileDuongDan = &dbPath
	giayPhep.H2Hash = &h2HashStr
	giayPhep.UpdatedAt = time.Now()

	if err := s.gpRepo.UpdateGiayPhep(ctx, s.db, giayPhep); err != nil {
		os.Remove(finalDst)
		return nil, fmt.Errorf("lỗi cập nhật CSDL: %w", err)
	}

	return s.GetGiayPhepByID(ctx, giayPhep.ID)
}

func (s *giayPhepService) mapGiayPhepToResponse(ctx context.Context, giayPhep *models.GiayPhep) (*dto.GiayPhepResponse, error) {
	resp := &dto.GiayPhepResponse{
		ID:                giayPhep.ID,
		HoSoID:            giayPhep.HoSoID,
		LoaiGiayPhep:      giayPhep.LoaiGiayPhep,
		SoGiayPhep:        giayPhep.SoGiayPhep,
		NgayHieuLuc:       giayPhep.NgayHieuLuc,
		NgayHetHan:        giayPhep.NgayHetHan,
		TrangThaiGiayPhep: giayPhep.TrangThaiGiayPhep,
		CreatedAt:         giayPhep.CreatedAt,
		UpdatedAt:         giayPhep.UpdatedAt,
	}

	if giayPhep.FileDuongDan != nil {
		resp.FileDuongDan = giayPhep.FileDuongDan
	}
	if giayPhep.H1Hash != nil {
		resp.H1Hash = giayPhep.H1Hash
	}
	if giayPhep.H2Hash != nil {
		resp.H2Hash = giayPhep.H2Hash
	}

	if giayPhep.HoSo.ID != uuid.Nil {
		resp.HoSo = &giayPhep.HoSo
	} else {
		hoSo, err := s.hosoRepo.GetHoSoDetails(ctx, s.db, giayPhep.HoSoID)
		if err != nil {
			fmt.Printf("Cảnh báo: Không thể preload HoSo %s: %v\n", giayPhep.HoSoID, err)
		} else {
			resp.HoSo = hoSo
		}
	}

	return resp, nil
}

func (s *giayPhepService) PushToBlockchain(ctx context.Context, giayPhepID uuid.UUID) error {
	// 1. Lấy thông tin giấy phép (model, KHÔNG PHẢI DTO)
	giayPhep, err := s.gpRepo.GetGiayPhepByID(ctx, s.db, giayPhepID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrGiayPhepKhongTimThay
		}
		return err
	}

	// 2. Kiểm tra nghiệp vụ
	if s.fabricClient == nil || s.fabricClient.Contract() == nil {
		return ErrBlockchainOffline
	}
	if giayPhep.H1Hash == nil || *giayPhep.H1Hash == "" ||
		giayPhep.H2Hash == nil || *giayPhep.H2Hash == "" {
		return ErrGiayPhepChuaDuHash
	}
	if giayPhep.TrangThaiBlockchain != nil && *giayPhep.TrangThaiBlockchain == TrangThaiBCDaDongBo {
		return ErrGiayPhepDaDongBo
	}
	// (Cho phép retry nếu trạng thái là "ChuaDongBo" hoặc "LoiDongBo")

	// 3. Chuẩn bị dữ liệu gọi Fabric
	chaincodeFunc := "SubmitLisence"
	giayPhepIDStr := giayPhep.ID.String()
	h1Str := *giayPhep.H1Hash
	h2Str := *giayPhep.H2Hash

	// 4. Gọi Fabric
	_, err = s.fabricClient.SubmitTransaction(chaincodeFunc, giayPhepIDStr, h1Str, h2Str)

	// 5. Cập nhật CSDL dựa trên kết quả
	if err != nil {
		// Fabric thất bại -> Cập nhật trạng thái là Lỗi
		statusError := TrangThaiBCLoiDongBo
		giayPhep.TrangThaiBlockchain = &statusError
		if updateErr := s.gpRepo.UpdateGiayPhep(ctx, s.db, giayPhep); updateErr != nil {
			return fmt.Errorf("lỗi Fabric: %w (và không thể cập nhật CSDL: %s)", err, updateErr.Error())
		}
		// Trả về lỗi Fabric gốc
		return fmt.Errorf("lỗi khi submit Fabric: %w", err)
	}

	// Fabric thành công -> Cập nhật trạng thái là Đã Đồng Bộ
	statusSuccess := "TrangThaiBCDaDongBo"
	giayPhep.TrangThaiBlockchain = &statusSuccess
	if err := s.gpRepo.UpdateGiayPhep(ctx, s.db, giayPhep); err != nil {
		return fmt.Errorf("fabric thành công, nhưng lỗi cập nhật CSDL: %w", err)
	}

	log.Printf("✅ Đẩy toàn bộ (h1, h2) lên Fabric thành công cho Giấy phép: %s", giayPhepIDStr)
	return nil
}

package service

import (
	"errors"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/middleware"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Login(req *dto.LoginRequest) (*dto.LoginResponse, error)
	CreateCanBo(req *dto.CreateCanBoRequest) error
	ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) Login(req *dto.LoginRequest) (*dto.LoginResponse, error) {
	// 1. Tìm user trong DB
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("thông tin đăng nhập không chính xác") // Không nên báo cụ thể lỗi email để bảo mật
	}

	// 2. Kiểm tra mật khẩu (So sánh Hash)
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("thông tin đăng nhập không chính xác") // Sai pass
	}

	// 3. Kiểm tra trạng thái active
	if !user.IsActive {
		return nil, errors.New("tài khoản đã bị khóa")
	}

	// 4. Tạo JWT Token
	token, err := middleware.GenerateToken(user.ID, user.RoleID, user.DoanhNghiepID)
	if err != nil {
		return nil, errors.New("lỗi tạo token")
	}

	// 5. Chuẩn bị response
	dnIDStr := ""
	if user.DoanhNghiepID != nil {
		dnIDStr = user.DoanhNghiepID.String()
	}

	// Lưu ý: Chuyển UUID sang string cẩn thận
	res := &dto.LoginResponse{
		AccessToken: token,
		User: dto.UserSummary{
			ID:            user.ID.String(),
			Email:         user.Email,
			FullName:      user.FullName,
			RoleID:        user.RoleID.String(),
			RoleName:      user.Role.Name,
			DoanhNghiepID: &dnIDStr,
		},
	}
	if user.DoanhNghiepID == nil {
		res.User.DoanhNghiepID = nil
	}

	return res, nil
}

func (s *userService) CreateCanBo(req *dto.CreateCanBoRequest) error {
	// A. Kiểm tra Email đã tồn tại chưa
	// (Lưu ý: Check cả user thường và user cán bộ để tránh trùng lặp hệ thống)
	if existing, _ := s.userRepo.GetByEmail(req.Email); existing != nil && existing.Email != "" {
		return errors.New("email này đã được sử dụng")
	}

	// B. Lấy Role ID (HARDCODE là "CAN_BO")
	// Logic này đảm bảo API này chỉ tạo ra Cán bộ, không thể tạo ra Admin hay DN
	role, err := s.userRepo.GetRoleByName("CAN_BO")
	if err != nil {
		return errors.New("hệ thống chưa cấu hình role 'CAN_BO'")
	}

	// C. Hash mật khẩu
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("lỗi mã hóa mật khẩu")
	}

	// D. Tạo User Model
	newCanBo := models.User{
		Email:         req.Email,
		PasswordHash:  string(hashedPass),
		FullName:      req.FullName,
		IsActive:      true, // Cán bộ tạo xong active luôn
		RoleID:        role.ID,
		DoanhNghiepID: nil, // Cán bộ không thuộc doanh nghiệp nào
	}

	// E. Lưu vào DB
	return s.userRepo.Create(nil, &newCanBo)
}

func (s *userService) ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error {
	// A. Lấy thông tin user từ DB
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return errors.New("không tìm thấy người dùng")
	}

	// B. Kiểm tra mật khẩu cũ có đúng không
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword))
	if err != nil {
		return errors.New("mật khẩu cũ không chính xác")
	}

	// C. Hash mật khẩu mới
	newHashedPass, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("lỗi hệ thống khi mã hóa mật khẩu")
	}

	// D. Lưu vào DB
	return s.userRepo.UpdatePassword(userID, string(newHashedPass))
}

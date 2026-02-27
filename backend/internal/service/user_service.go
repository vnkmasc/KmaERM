package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/middleware"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"github.com/vnkmasc/KmaERM/backend/utils"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Login(req *dto.LoginRequest) (*dto.LoginResponse, error)
	CreateCanBo(req *dto.CreateCanBoRequest) error
	ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error
	ResetPassword(req *dto.ResetPasswordRequest) error
	ForgotPassword(email string) error
	VerifyOTP(email, otpInput string) error
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
	// A. Kiểm tra Email (Giữ nguyên)
	if existing, _ := s.userRepo.GetByEmail(req.Email); existing != nil && existing.Email != "" {
		return errors.New("email này đã được sử dụng")
	}

	// B. Lấy Role ID (Giữ nguyên)
	role, err := s.userRepo.GetRoleByName("CAN_BO")
	if err != nil {
		return errors.New("hệ thống chưa cấu hình role 'CAN_BO'")
	}

	// C. Hash mật khẩu (Giữ nguyên)
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("lỗi mã hóa mật khẩu")
	}

	// --- [BỔ SUNG QUAN TRỌNG: SINH KHÓA KÝ SỐ] ---
	// Tự động sinh cặp khóa RSA cho cán bộ mới
	privKey, pubKey, err := utils.GenerateRSAKeyPair()
	if err != nil {
		return errors.New("lỗi khởi tạo chữ ký số cho cán bộ")
	}

	// D. Tạo User Model (Cập nhật thêm Key)
	newCanBo := models.User{
		Email:         req.Email,
		PasswordHash:  string(hashedPass),
		FullName:      req.FullName,
		IsActive:      true,
		RoleID:        role.ID,
		DoanhNghiepID: nil,

		// Lưu Key vào DB
		PrivateKeyPEM: &privKey,
		PublicKeyPEM:  &pubKey,
	}

	// E. Lưu vào DB (Giữ nguyên)
	return s.userRepo.Create(nil, &newCanBo)
}

func (s *userService) ChangePassword(userID uuid.UUID, req *dto.ChangePasswordRequest) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return errors.New("không tìm thấy người dùng")
	}

	// Chỉ kiểm tra mật khẩu cũ
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword))
	if err != nil {
		return errors.New("mật khẩu cũ không chính xác")
	}

	newHashedPass, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Cập nhật mật khẩu mới (Không quan tâm OTP)
	return s.userRepo.UpdatePassword(userID, string(newHashedPass))
}

func (s *userService) ForgotPassword(email string) error {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return errors.New("email không tồn tại trong hệ thống")
	}

	otp, err := utils.GenerateOTP()
	if err != nil {
		return err
	}

	expiry := time.Now().Add(5 * time.Minute)
	user.OtpCode = &otp
	user.OtpExpiry = &expiry

	if err := s.userRepo.Update(user); err != nil {
		return errors.New("lỗi hệ thống khi lưu OTP")
	}

	go func() {
		err := utils.SendEmailOTP(user.Email, otp)
		if err != nil {
			fmt.Printf("Lỗi gửi mail OTP: %v\n", err)
		} else {
			fmt.Printf("Đã gửi OTP tới %s\n", user.Email)
		}
	}()

	return nil
}

func (s *userService) VerifyOTP(email, otpInput string) error {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return errors.New("email không tồn tại")
	}

	if user.OtpCode == nil || *user.OtpCode != otpInput {
		return errors.New("mã OTP không chính xác")
	}
	if user.OtpExpiry == nil || time.Now().After(*user.OtpExpiry) {
		return errors.New("mã OTP đã hết hạn")
	}
	return nil
}

func (s *userService) ResetPassword(req *dto.ResetPasswordRequest) error {
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return errors.New("người dùng không tồn tại")
	}

	if user.OtpCode == nil || *user.OtpCode != req.Otp {
		return errors.New("mã OTP không chính xác")
	}
	if user.OtpExpiry == nil || time.Now().After(*user.OtpExpiry) {
		return errors.New("mã OTP đã hết hạn")
	}

	newHashedPass, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(newHashedPass)
	user.OtpCode = nil
	user.OtpExpiry = nil

	return s.userRepo.Update(user)
}

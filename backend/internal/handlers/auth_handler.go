package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
)

type AuthHandler struct {
	userService service.UserService
}

func NewAuthHandler(userService service.UserService) *AuthHandler {
	return &AuthHandler{userService: userService}
}

func (h *AuthHandler) RegisterRoutes(public *gin.RouterGroup, protected *gin.RouterGroup) {

	publicAuth := public.Group("/auth")
	{
		publicAuth.POST("/login", h.Login)
		publicAuth.POST("/forgot-password", h.ForgotPassword)
		publicAuth.POST("/verify-otp", h.VerifyOTP)
		publicAuth.POST("/reset-password", h.ResetPassword)
	}

	protectedAuth := protected.Group("/auth")
	{
		protectedAuth.POST("/change-password", h.ChangePassword)

	}
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email không hợp lệ"})
		return
	}

	if err := h.userService.ForgotPassword(req.Email); err != nil {
		// Bảo mật: Nên trả về 200 dù email có tồn tại hay không để tránh dò user
		// Nhưng demo thì cứ return lỗi cho dễ biết
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mã OTP đã được gửi tới email của bạn."})
}
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req dto.VerifyOtpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	// Gọi Service kiểm tra
	if err := h.userService.VerifyOTP(req.Email, req.Otp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mã OTP hợp lệ. Mời nhập mật khẩu mới."})
}

// 2. API Đặt lại mật khẩu (Public)
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không đủ (Cần Email, OTP, Pass mới)"})
		return
	}

	if err := h.userService.ResetPassword(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đặt lại mật khẩu thành công. Hãy đăng nhập ngay!"})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req dto.ChangePasswordRequest

	// 1. Validate Input
	// Lưu ý: Lúc này struct ChangePasswordRequest chỉ cần OldPassword và NewPassword
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ. Vui lòng nhập mật khẩu cũ và mới (tối thiểu 6 ký tự)."})
		return
	}

	// 2. Lấy UserID từ Token (Middleware đã gán vào context)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không xác định được người dùng (Chưa đăng nhập)"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	// 3. Gọi Service
	err := h.userService.ChangePassword(userID, &req)
	if err != nil {
		// Phân loại lỗi để trả về mã HTTP hợp lý
		if err.Error() == "mật khẩu cũ không chính xác" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // Lỗi do người dùng nhập sai
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi hệ thống: " + err.Error()}) // Lỗi DB/Server
		}
		return
	}

	// 4. Thành công
	c.JSON(http.StatusOK, gin.H{"message": "Đổi mật khẩu thành công!"})
}
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	res, err := h.userService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Đăng nhập thành công",
		"data":    res,
	})
}

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
	}

	protectedAuth := protected.Group("/auth")
	{
		protectedAuth.POST("/change-password", h.ChangePassword)
	}
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req dto.ChangePasswordRequest

	// 1. Validate Input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ (Mật khẩu mới tối thiểu 6 ký tự)"})
		return
	}

	// 2. Lấy UserID từ Token (Do Middleware gán vào Context)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không xác định được người dùng"})
		return
	}
	userID := userIDVal.(uuid.UUID) // Ép kiểu về UUID

	// 3. Gọi Service
	err := h.userService.ChangePassword(userID, &req)
	if err != nil {
		// Nếu lỗi là do mật khẩu cũ sai -> Trả về 400 hoặc 401
		if err.Error() == "mật khẩu cũ không chính xác" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đổi mật khẩu thành công"})
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

package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/helper"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
)

type CanBoHandler struct {
	service service.UserService
}

func NewCanBoHandler(s service.UserService) *CanBoHandler {
	return &CanBoHandler{service: s}
}

func (h *CanBoHandler) RegisterRoutes(rg *gin.RouterGroup) {

	adminGroup := rg.Group("/admin")
	{
		adminGroup.POST("/create-can-bo", h.Create)
	}
}

func (h *CanBoHandler) Create(c *gin.Context) {
	var input dto.CreateCanBoRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				out[fe.Field()] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"errors": out})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		}
		return
	}

	err := h.service.CreateCanBo(&input)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Tạo tài khoản Cán bộ thành công",
		"email":   input.Email,
		"role":    "CAN_BO",
	})
}

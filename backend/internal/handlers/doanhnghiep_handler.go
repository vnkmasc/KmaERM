package handlers

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/helper"
	"github.com/vnkmasc/KmaERM/backend/internal/models"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
	"gorm.io/gorm"
)

type DoanhNghiepHandler struct {
	service service.DoanhNghiepService
}

func NewDoanhNghiepHandler(s service.DoanhNghiepService) *DoanhNghiepHandler {
	return &DoanhNghiepHandler{
		service: s,
	}
}

func (h *DoanhNghiepHandler) RegisterRoutes(rg *gin.RouterGroup) {
	dnGroup := rg.Group("/doanh-nghiep")
	{
		dnGroup.POST("", h.Create)
		dnGroup.GET("", h.List)
		dnGroup.GET("/:id", h.GetByID)
		dnGroup.GET("/maso/:maso", h.GetByMaSo)
		dnGroup.PUT("/:id", h.Update)
		dnGroup.PUT("/:id/changemsdn", h.ChangeMSDN)
		dnGroup.DELETE("/:id", h.Delete)
		dnGroup.POST("/:id/uploadgcn", h.UploadGCN)
		dnGroup.GET("/:id/viewgcn", h.ViewGCN)
	}
}

func (h *DoanhNghiepHandler) Create(c *gin.Context) {
	var input dto.CreateDoanhNghiepRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				jsonField := fe.Field()
				out[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"errors": out})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu JSON không hợp lệ: " + err.Error()})
		}
		return
	}

	dn := models.DoanhNghiep{
		TenDoanhNghiepVI:  input.TenDoanhNghiepVI,
		TenDoanhNghiepEN:  input.TenDoanhNghiepEN,
		TenVietTat:        input.TenVietTat,
		DiaChi:            input.DiaChi,
		MaSoDoanhNghiep:   input.MaSoDoanhNghiep,
		NgayCapMSDNLanDau: input.NgayCapMSDNLanDau,
		NoiCapMSDN:        input.NoiCapMSDN,
		SDT:               input.SDT,
		Email:             input.Email,
		Website:           input.Website,
		VonDieuLe:         input.VonDieuLe,
		NguoiDaiDien:      input.NguoiDaiDien,
		ChucVu:            input.ChucVu,
		LoaiDinhDanh:      input.LoaiDinhDanh,
		NgayCapDinhDanh:   input.NgayCapDinhDanh,
		NoiCapDinhDanh:    input.NoiCapDinhDanh,
	}
	createdDN, err := h.service.Create(&dn)
	if err != nil {
		if errors.Is(err, service.ErrMaSoDaTonTai) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo doanh nghiệp: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": createdDN})
}

func (h *DoanhNghiepHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	dn, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToDoanhNghiepResponse(dn)

	c.JSON(http.StatusOK, gin.H{"data": response})
}

func (h *DoanhNghiepHandler) GetByMaSo(c *gin.Context) {
	maso := c.Param("maso")

	dn, err := h.service.GetByMaSo(maso)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dn)
}

func (h *DoanhNghiepHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	dns, total, err := h.service.List(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var responses []dto.DoanhNghiepResponse
	for _, dn := range dns {
		responses = append(responses, dto.ToDoanhNghiepResponse(&dn))
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  responses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *DoanhNghiepHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}
	var input dto.UpdateDoanhNghiepRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				jsonField := fe.Field()
				out[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"errors": out})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu JSON không hợp lệ: " + err.Error()})
		}
		return
	}

	dn, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if input.TenDoanhNghiepVI != nil {
		dn.TenDoanhNghiepVI = *input.TenDoanhNghiepVI
	}
	if input.TenDoanhNghiepEN != nil {
		dn.TenDoanhNghiepEN = *input.TenDoanhNghiepEN
	}
	if input.TenVietTat != nil {
		dn.TenVietTat = *input.TenVietTat
	}
	if input.DiaChi != nil {
		dn.DiaChi = *input.DiaChi
	}
	if input.SDT != nil {
		dn.SDT = *input.SDT
	}
	if input.Email != nil {
		dn.Email = *input.Email
	}
	if input.Website != nil {
		dn.Website = *input.Website
	}
	if input.VonDieuLe != nil {
		dn.VonDieuLe = *input.VonDieuLe
	}
	if input.NguoiDaiDien != nil {
		dn.NguoiDaiDien = *input.NguoiDaiDien
	}
	if input.ChucVu != nil {
		dn.ChucVu = *input.ChucVu
	}
	if input.LoaiDinhDanh != nil {
		dn.LoaiDinhDanh = *input.LoaiDinhDanh
	}
	if input.NgayCapDinhDanh != nil {
		dn.NgayCapDinhDanh = input.NgayCapDinhDanh
	}
	if input.NoiCapDinhDanh != nil {
		dn.NoiCapDinhDanh = *input.NoiCapDinhDanh
	}

	updatedDN, err := h.service.Update(id, dn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedDN)
}

func (h *DoanhNghiepHandler) ChangeMSDN(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var input service.ChangeMSDNInput

	if err := c.ShouldBindJSON(&input); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			out := make(map[string]string)
			for _, fe := range ve {
				jsonField := fe.Field()
				out[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"errors": out})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu JSON không hợp lệ: " + err.Error()})
		}
		return
	}

	updatedDN, err := h.service.ChangeMSDN(id, &input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp"})
			return
		}
		if errors.Is(err, service.ErrMaSoDaTonTai) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updatedDN})
}

// Delete
// @Summary Xóa doanh nghiệp
// @Tags DoanhNghiep
// @Produce json
// @Param id path int true "ID Doanh nghiệp"
// @Success 204 "No Content"
// @Failure 400 {object} gin.H{"error": string}
// @Failure 404 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Router /doanhnghiep/{id} [delete]
func (h *DoanhNghiepHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	err = h.service.Delete(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp"})
			return
		}
		// (Sau này bạn có thể check lỗi "còn hồ sơ liên quan" ở đây và trả 409 Conflict)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *DoanhNghiepHandler) UploadGCN(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy file upload: Vui lòng gửi field 'file'"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể mở file"})
		return
	}
	defer src.Close()

	const maxUploadSize = 20 * 1024 * 1024
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File quá lớn. Kích thước tối đa là %d MB", maxUploadSize/(1024*1024))})
		return
	}

	fileData, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể đọc nội dung file"})
		return
	}

	if strings.ToLower(filepath.Ext(file.Filename)) != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chỉ chấp nhận file định dạng PDF"})
		return
	}

	updatedDN, err := h.service.UploadGCN(id, fileData, file.Filename)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy doanh nghiệp để gắn file"})
			return
		}
		if errors.Is(err, service.ErrUploadFile) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lưu trữ file vật lý"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updatedDN})
}

func (h *DoanhNghiepHandler) ViewGCN(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	filePath, err := h.service.GetGCNFilePath(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) || strings.Contains(err.Error(), "chưa được upload") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy file hoặc doanh nghiệp"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	physicalPath := filepath.Join("..", filePath)

	if _, err := os.Stat(physicalPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File vật lý không tồn tại trên máy chủ (có thể đã bị xóa)"})
		return
	}

	c.File(physicalPath)
}

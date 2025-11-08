package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/gofrs/uuid"
	"github.com/vnkmasc/KmaERM/backend/internal/dto"
	"github.com/vnkmasc/KmaERM/backend/internal/helper"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
)

type GiayPhepHandler struct {
	gpService service.GiayPhepService
}

func NewGiayPhepHandler(gpService service.GiayPhepService) *GiayPhepHandler {
	return &GiayPhepHandler{
		gpService: gpService,
	}
}

func (h *GiayPhepHandler) RegisterRoutes(router *gin.RouterGroup) {
	gpGroup := router.Group("/giay-phep")
	{
		gpGroup.POST("", h.CreateGiayPhep)
		gpGroup.GET("", h.ListGiayPhep)
		gpGroup.GET("/:id", h.GetGiayPhepByID)
		gpGroup.PUT("/:id", h.UpdateGiayPhep)
		gpGroup.DELETE("/:id", h.DeleteGiayPhep)
		gpGroup.POST("/:id/upload", h.UploadGiayPhepFile)
		gpGroup.GET("/:id/view-file", h.DownloadGiayPhepFile)
		gpGroup.POST("/:id/push-blockchain", h.PushToBlockchain)
		gpGroup.GET("/:id/verify", h.VerifyGiayPhep)

	}

}

func (h *GiayPhepHandler) CreateGiayPhep(c *gin.Context) {
	var req dto.CreateGiayPhepRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			errorMessages := make(map[string]string)
			for _, fe := range validationErrs {
				jsonField := fe.Field()
				errorMessages[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Dữ liệu đầu vào không hợp lệ",
				"details": errorMessages,
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON body không hợp lệ", "details": err.Error()})
		return
	}

	giayPhep, err := h.gpService.CreateGiayPhep(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrHoSoDaCoGiayPhep) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "số giấy phép đã tồn tại" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi tạo giấy phép", "details": err.Error()})
		return
	}

	details, err := h.gpService.GetGiayPhepByID(c.Request.Context(), giayPhep.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lấy chi tiết giấy phép vừa tạo", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": details})
}

func (h *GiayPhepHandler) UpdateGiayPhep(c *gin.Context) {
	idStr := c.Param("id")
	giayPhepID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	var req dto.UpdateGiayPhepRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			errorMessages := make(map[string]string)
			for _, fe := range validationErrs {
				jsonField := fe.Field()
				errorMessages[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu đầu vào không hợp lệ", "details": errorMessages})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON body không hợp lệ", "details": err.Error()})
		return
	}

	_, err = h.gpService.UpdateGiayPhep(c.Request.Context(), giayPhepID, &req)
	if err != nil {
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "số giấy phép đã tồn tại" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi cập nhật giấy phép", "details": err.Error()})
		return
	}

	details, err := h.gpService.GetGiayPhepByID(c.Request.Context(), giayPhepID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lấy chi tiết giấy phép vừa cập nhật", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}

func (h *GiayPhepHandler) GetGiayPhepByID(c *gin.Context) {
	idStr := c.Param("id")
	giayPhepID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	details, err := h.gpService.GetGiayPhepByID(c.Request.Context(), giayPhepID)
	if err != nil {
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy chi tiết giấy phép", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}

func (h *GiayPhepHandler) ListGiayPhep(c *gin.Context) {
	// 1. Bind các query param TÙY CHỌN (search, date range)
	var params dto.GiayPhepSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		// (Copy logic validation từ CreateGiayPhep)
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			errorMessages := make(map[string]string)
			for _, fe := range validationErrs {
				jsonField := fe.Field()
				errorMessages[jsonField] = helper.FormatValidationMessage(fe)
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu đầu vào không hợp lệ", "details": errorMessages})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query params không hợp lệ", "details": err.Error()})
		return
	}

	// 2. Lấy query param BẮT BUỘC (doanh_nghiep_id)
	doanhNghiepIDStr := c.Query("doanh_nghiep_id")
	var doanhNghiepID uuid.UUID
	var err error

	// Cho phép tìm kiếm không cần doanhNghiepID (nếu chuỗi rỗng)
	// (Nếu bạn muốn BẮT BUỘC, hãy xóa if này và check lỗi)
	if doanhNghiepIDStr != "" {
		doanhNghiepID, err = uuid.FromString(doanhNghiepIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "doanh_nghiep_id không hợp lệ"})
			return
		}
	} else {
		doanhNghiepID = uuid.Nil // Gửi ID rỗng (Nil)
	}

	// 3. Lấy query param Phân trang
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	// 4. Gọi Service (truyền doanhNghiepID riêng)
	response, err := h.gpService.ListGiayPhep(c.Request.Context(), doanhNghiepID, &params, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy danh sách giấy phép", "details": err.Error()})
		return
	}

	// 5. Trả về
	c.JSON(http.StatusOK, response)
}

func (h *GiayPhepHandler) DeleteGiayPhep(c *gin.Context) {
	idStr := c.Param("id")
	giayPhepID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	err = h.gpService.DeleteGiayPhep(c.Request.Context(), giayPhepID)
	if err != nil {
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, service.ErrGiayPhepDangHieuLuc) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi xóa giấy phép", "details": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *GiayPhepHandler) UploadGiayPhepFile(c *gin.Context) {
	giayPhepID, err := uuid.FromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy 'file' trong request"})
		return
	}

	newUUID, err := uuid.NewV4()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo ID file duy nhất", "details": err.Error()})
		return
	}
	uniqueName := fmt.Sprintf("%s%s", newUUID.String(), filepath.Ext(file.Filename))

	uploadDir := filepath.Join("..", "uploads", "tmp")
	tempDst := filepath.Join(uploadDir, uniqueName)

	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload tạm", "details": err.Error()})
		return
	}

	if err := c.SaveUploadedFile(file, tempDst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file tạm", "details": err.Error()})
		return
	}

	resp, err := h.gpService.UploadGiayPhepFile(c.Request.Context(), giayPhepID, tempDst, file.Filename)
	if err != nil {
		os.Remove(tempDst)
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi xử lý file giấy phép", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *GiayPhepHandler) DownloadGiayPhepFile(c *gin.Context) {
	giayPhepID, err := uuid.FromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	resp, err := h.gpService.GetGiayPhepByID(c.Request.Context(), giayPhepID)
	if err != nil {
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy thông tin file", "details": err.Error()})
		return
	}

	if resp.FileDuongDan == nil || *resp.FileDuongDan == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Giấy phép này chưa được upload file"})
		return
	}

	dbPath := *resp.FileDuongDan
	physicalPath := filepath.Join("..", dbPath)

	if _, err := os.Stat(physicalPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File vật lý không tồn tại trên máy chủ (có thể đã bị xóa)"})
		return
	}

	c.File(physicalPath)
}

func (h *GiayPhepHandler) PushToBlockchain(c *gin.Context) {
	// 1. Lấy ID
	giayPhepID, err := uuid.FromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	// 2. Gọi Service
	err = h.gpService.PushToBlockchain(c.Request.Context(), giayPhepID)
	if err != nil {
		// 3. Xử lý lỗi nghiệp vụ (Chi tiết)

		// Lỗi 404: Không tìm thấy
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		// Lỗi 409 (Conflict): Lỗi logic nghiệp vụ (đã đẩy, thiếu hash)
		if errors.Is(err, service.ErrGiayPhepDaDongBo) ||
			errors.Is(err, service.ErrGiayPhepChuaDuHash) {

			c.JSON(http.StatusConflict, gin.H{"error": "Không thể đẩy lên blockchain", "details": err.Error()})
			return
		}

		// Lỗi 503 (Service Unavailable): Lỗi kết nối blockchain
		if errors.Is(err, service.ErrBlockchainOffline) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Dịch vụ blockchain không sẵn sàng", "details": err.Error()})
			return
		}

		// Các lỗi 500 khác (lỗi submit, lỗi CSDL...)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi đẩy lên blockchain", "details": err.Error()})
		return
	}

	// 4. Trả về thành công
	c.JSON(http.StatusOK, gin.H{"message": "Đã đẩy h1 và h2 lên blockchain thành công"})
}

func (h *GiayPhepHandler) VerifyGiayPhep(c *gin.Context) {
	giayPhepID, err := uuid.FromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID giấy phép không hợp lệ"})
		return
	}

	resp, err := h.gpService.VerifyGiayPhep(c.Request.Context(), giayPhepID)
	if err != nil {
		// 3. Xử lý lỗi nghiệp vụ
		if errors.Is(err, service.ErrGiayPhepKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, service.ErrAssetKhongTonTaiTrenBC) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Xác thực thất bại", "details": err.Error()})
			return
		}
		if errors.Is(err, service.ErrBlockchainOffline) { // 503
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Dịch vụ blockchain không sẵn sàng", "details": err.Error()})
			return
		}
		// (Các lỗi khác: Unmarshal, lỗi Fabric chung... là lỗi 500)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi xác thực", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

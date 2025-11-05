package handlers

import (
	"errors"
	"fmt"
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
	"github.com/vnkmasc/KmaERM/backend/internal/service"
)

type HoSoHandler struct {
	hosoService service.HoSoService
}

func NewHoSoHandler(hosoService service.HoSoService) *HoSoHandler {
	return &HoSoHandler{
		hosoService: hosoService,
	}
}
func (h *HoSoHandler) RegisterRoutes(router *gin.RouterGroup) {
	hoSoGroup := router.Group("/ho-so")
	{
		hoSoGroup.POST("", h.CreateHoSo)
		hoSoGroup.GET("/:id", h.GetHoSoDetails)
		hoSoGroup.PUT("/:id", h.UpdateHoSo)
		hoSoGroup.GET("", h.ListHoSo)

	}
	taiLieuGroup := router.Group("/tai-lieu")
	{
		taiLieuGroup.POST("/upload", h.UploadTaiLieu)
		taiLieuGroup.DELETE("/:id", h.DeleteTaiLieu)
		taiLieuGroup.GET("/download/:id", h.DownloadTaiLieu)
	}
	router.GET("/loai-tai-lieu", h.ListLoaiTaiLieu)
}

func (h *HoSoHandler) CreateHoSo(c *gin.Context) {
	var req dto.CreateHoSoRequest
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

	hoSo, err := h.hosoService.CreateHoSo(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrLoaiThuTucKhongHopLe) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, service.ErrDoanhNghiepKhongTonTai) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi tạo hồ sơ", "details": err.Error()})
		return
	}

	details, err := h.hosoService.GetHoSoDetails(c.Request.Context(), hoSo.ID)
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lấy chi tiết hồ sơ vừa tạo", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": details})
}
func (h *HoSoHandler) ListLoaiTaiLieu(c *gin.Context) {

	tenThuTuc := c.Query("ten_thu_tuc")

	loaiTaiLieus, err := h.hosoService.GetLoaiTaiLieu(c.Request.Context(), tenThuTuc)
	if err != nil {
		if errors.Is(err, service.ErrLoaiThuTucKhongHopLe) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy loại tài liệu", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": loaiTaiLieus})
}

func (h *HoSoHandler) GetHoSoDetails(c *gin.Context) {
	idStr := c.Param("id")
	hoSoID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID hồ sơ không hợp lệ"})
		return
	}

	hoSo, err := h.hosoService.GetHoSoDetails(c.Request.Context(), hoSoID)
	if err != nil {
		if errors.Is(err, service.ErrHoSoKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy chi tiết hồ sơ", "details": err.Error()})
		return
	}

	response := dto.ToHoSoDetailsResponse(hoSo)

	c.JSON(http.StatusOK, response)
}

func (h *HoSoHandler) ListHoSo(c *gin.Context) {
	// 1. Bind các query param TÙY CHỌN (search, date range)
	var params dto.HoSoSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query params không hợp lệ", "details": err.Error()})
		return
	}

	// 2. Lấy query param BẮT BUỘC (doanh_nghiep_id)
	doanhNghiepIDStr := c.Query("doanh_nghiep_id")
	if doanhNghiepIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "doanh_nghiep_id là bắt buộc"})
		return
	}
	doanhNghiepID, err := uuid.FromString(doanhNghiepIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "doanh_nghiep_id không hợp lệ"})
		return
	}

	// 3. Lấy query param Phân trang (với giá trị mặc định)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 { // Giới hạn max 100
		pageSize = 10
	}

	// 4. Gọi Service
	response, err := h.hosoService.ListHoSo(c.Request.Context(), doanhNghiepID, &params, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy danh sách hồ sơ", "details": err.Error()})
		return
	}

	// 5. Trả về
	c.JSON(http.StatusOK, response)
}
func (h *HoSoHandler) UploadTaiLieu(c *gin.Context) {
	hoSoTaiLieuIDStr := c.PostForm("ho_so_tai_lieu_id")
	tieuDe := c.PostForm("tieu_de")

	hoSoTaiLieuID, err := uuid.FromString(hoSoTaiLieuIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "ho_so_tai_lieu_id không hợp lệ",
			"details": err.Error(),
		})
		return
	}

	req := dto.UploadTaiLieuRequest{
		HoSoTaiLieuID: hoSoTaiLieuID,
		TieuDe:        tieuDe,
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

	tempUploadDir := filepath.Join("..", "uploads", "tmp")
	if err := os.MkdirAll(tempUploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload tạm", "details": err.Error()})
		return
	}

	tempDst := filepath.Join(tempUploadDir, uniqueName)
	if err := c.SaveUploadedFile(file, tempDst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file tạm", "details": err.Error()})
		return
	}

	tempDst = filepath.ToSlash(tempDst)

	taiLieu, err := h.hosoService.UploadTaiLieu(c.Request.Context(), &req, tempDst, file.Filename)
	if err != nil {
		_ = os.Remove(tempDst)
		if errors.Is(err, service.ErrKheTaiLieuKhongTonTai) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi xử lý file", "details": err.Error()})
		return
	}

	taiLieu.DuongDan = strings.TrimPrefix(taiLieu.DuongDan, "../")
	taiLieu.DuongDan = strings.TrimPrefix(taiLieu.DuongDan, `..\`)
	taiLieu.DuongDan = filepath.ToSlash(taiLieu.DuongDan)

	c.JSON(http.StatusCreated, gin.H{"data": taiLieu})
}

func (h *HoSoHandler) DeleteTaiLieu(c *gin.Context) {
	idStr := c.Param("id")

	taiLieuID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tài liệu không hợp lệ"})
		return
	}

	err = h.hosoService.DeleteTaiLieu(c.Request.Context(), taiLieuID)
	if err != nil {
		if errors.Is(err, service.ErrTaiLieuKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Lỗi máy chủ khi xóa tài liệu",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *HoSoHandler) DownloadTaiLieu(c *gin.Context) {
	idStr := c.Param("id")
	taiLieuID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tài liệu không hợp lệ"})
		return
	}

	taiLieu, err := h.hosoService.GetTaiLieuByID(c.Request.Context(), taiLieuID)
	if err != nil {
		if errors.Is(err, service.ErrTaiLieuKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi lấy thông tin file", "details": err.Error()})
		return
	}

	dbPath := taiLieu.DuongDan

	physicalPath := filepath.Join("..", dbPath)

	if _, err := os.Stat(physicalPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File vật lý không tồn tại trên máy chủ (có thể đã bị xóa)"})
		return
	}

	c.File(physicalPath)
}

func (h *HoSoHandler) UpdateHoSo(c *gin.Context) {
	idStr := c.Param("id")
	hoSoID, err := uuid.FromString(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID hồ sơ không hợp lệ"})
		return
	}

	var req dto.UpdateHoSoRequest
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

	_, err = h.hosoService.UpdateHoSo(c.Request.Context(), hoSoID, &req)
	if err != nil {
		if errors.Is(err, service.ErrHoSoKhongTimThay) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ khi cập nhật hồ sơ", "details": err.Error()})
		return
	}

	details, err := h.hosoService.GetHoSoDetails(c.Request.Context(), hoSoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lấy chi tiết hồ sơ vừa cập nhật", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}

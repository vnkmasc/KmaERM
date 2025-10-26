package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	handler "github.com/vnkmasc/KmaERM/backend/internal/handlers"
	"github.com/vnkmasc/KmaERM/backend/internal/middleware"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
	"github.com/vnkmasc/KmaERM/backend/pkg/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found)")
	}
	gormDB, err := database.ConnectPostgres()
	if err != nil {
		log.Fatal("LỖI: Không thể kết nối CSDL:", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		log.Fatal("LỖI: Không thể lấy *sql.DB gốc từ GORM:", err)
	}
	defer sqlDB.Close()

	log.Println("Kết nối CSDL và connection pool thành công.")

	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.CORSConfig())

	trusted := os.Getenv("TRUSTED_PROXIES")
	if trusted == "" {
		trusted = "127.0.0.1"
	}
	r.SetTrustedProxies([]string{trusted})

	//Repository
	dnRepo := repository.NewDoanhNghiepRepository(gormDB)
	hosoRepo := repository.NewHoSoRepository()
	tailieuRepo := repository.NewTaiLieuRepository()

	//Service
	dnService := service.NewDoanhNghiepService(dnRepo)
	hosoService := service.NewHoSoService(gormDB, hosoRepo, tailieuRepo)
	//Handler
	dnHandler := handler.NewDoanhNghiepHandler(dnService)
	hosoHandler := handler.NewHoSoHandler(hosoService)
	apiGroup := r.Group("/api/v1")
	{
		// Đăng ký các routes của DoanhNghiep
		dnHandler.RegisterRoutes(apiGroup)
		hosoHandler.RegisterRoutes(apiGroup)
		// (Sau này gọi giayPhepHandler.RegisterRoutes(apiGroup)... ở đây)
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "KmaERM API Server is running..."})
	})

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf(" Server running in %s mode on http://localhost:%s\n", mode, port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to started server: %v", err)
	}
}

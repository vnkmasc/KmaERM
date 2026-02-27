package main

import (
	"log"
	"os"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"

	benchmark "github.com/vnkmasc/KmaERM/backend/internal/benchmark"
	handler "github.com/vnkmasc/KmaERM/backend/internal/handlers"
	"github.com/vnkmasc/KmaERM/backend/internal/middleware"
	"github.com/vnkmasc/KmaERM/backend/internal/repository"
	"github.com/vnkmasc/KmaERM/backend/internal/service"
	"github.com/vnkmasc/KmaERM/backend/pkg/blockchain"
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

	fabricCfg := blockchain.NewFabricConfigFromEnv()
	fabricClient, err := blockchain.NewFabricClient(fabricCfg)
	if err != nil {
		log.Println("⚠️ Không thể kết nối Fabric, chạy chế độ không blockchain:", err)
		fabricClient = nil
	} else {
		log.Println("✅ Kết nối Fabric thành công!")
	}
	_ = fabricClient

	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.CORSConfig())

	// === CÀI ĐẶT VALIDATOR ĐỂ DÙNG JSON TAG ===
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterTagNameFunc(func(fld reflect.StructField) string {
			name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
			if name == "-" {
				return ""
			}
			return name
		})
	}

	trusted := os.Getenv("TRUSTED_PROXIES")
	if trusted == "" {
		trusted = "127.0.0.1"
	}
	r.SetTrustedProxies([]string{trusted})

	benchHandler := benchmark.NewBenchmarkHandler()

	// Tạo nhóm API riêng để test
	demoGroup := r.Group("/api/v1/demo")
	{
		demoGroup.GET("/sequential", benchHandler.SequentialProcess)
		demoGroup.GET("/parallel", benchHandler.ParallelProcess)
	}

	// Repository
	dnRepo := repository.NewDoanhNghiepRepository(gormDB)
	hosoRepo := repository.NewHoSoRepository()
	tailieuRepo := repository.NewTaiLieuRepository()
	gpRepo := repository.NewGiayPhepRepository()
	userRepo := repository.NewUserRepo(gormDB)

	// Service
	dnService := service.NewDoanhNghiepService(dnRepo, userRepo, gormDB)
	hosoService := service.NewHoSoService(gormDB, hosoRepo, tailieuRepo)

	// [THAY ĐỔI 1]: Thêm userRepo vào hàm khởi tạo GiayPhepService
	gpService := service.NewGiayPhepService(gormDB, gpRepo, hosoRepo, userRepo, fabricClient)

	userService := service.NewUserService(userRepo)

	// Handler
	dnHandler := handler.NewDoanhNghiepHandler(dnService)
	hosoHandler := handler.NewHoSoHandler(hosoService)
	gpHandler := handler.NewGiayPhepHandler(gpService)
	authHandler := handler.NewAuthHandler(userService)
	canBoHandler := handler.NewCanBoHandler(userService)

	apiGroup := r.Group("/api/v1")

	// Middleware Auth được khởi tạo ở đây để tái sử dụng
	authMiddleware := middleware.AuthMiddleware()

	protectedGroup := apiGroup.Group("/")
	protectedGroup.Use(authMiddleware)
	{
		authHandler.RegisterRoutes(apiGroup, protectedGroup)
		dnHandler.RegisterRoutes(apiGroup)
		hosoHandler.RegisterRoutes(apiGroup)

		// [THAY ĐỔI 2]: Truyền thêm authMiddleware vào đây để route Ký số sử dụng
		gpHandler.RegisterRoutes(apiGroup, authMiddleware)

		canBoHandler.RegisterRoutes(apiGroup)
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

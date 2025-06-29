package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"product-service/internal/application/services"
	"product-service/internal/domain/entities"
	"product-service/internal/infrastructure/database"
	"product-service/internal/interfaces/http/handlers"
	"product-service/internal/interfaces/http/middleware"
)

// @title Product Service API
// @version 1.0
// @description E-commerce Product Management Service
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3003
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	db, err := initDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Auto-migrate database schema
	if err := autoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Seed initial data
	if err := seedData(db); err != nil {
		log.Printf("Warning: Failed to seed data: %v", err)
	}

	// Initialize repositories
	productRepo := database.NewGormProductRepository(db)
	categoryRepo := database.NewGormCategoryRepository(db)
	brandRepo := database.NewGormBrandRepository(db)
	variantRepo := database.NewGormProductVariantRepository(db)
	imageRepo := database.NewGormProductImageRepository(db)
	videoRepo := database.NewGormProductVideoRepository(db)

	// Initialize services
	productService := services.NewProductService(
		productRepo,
		categoryRepo,
		brandRepo,
		variantRepo,
		imageRepo,
		videoRepo,
	)

	// Initialize handlers
	productHandler := handlers.NewProductHandler(productService)

	// Setup router
	router := setupRouter(productHandler)

	// Setup server
	server := &http.Server{
		Addr:    getPort(),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting Product Service on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func initDatabase() (*gorm.DB, error) {
	dsn := getDatabaseDSN()
	
	// Configure GORM logger
	gormLogger := logger.Default
	if gin.Mode() == gin.DebugMode {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&entities.Category{},
		&entities.Brand{},
		&entities.Product{},
		&entities.ProductVariant{},
		&entities.ProductImage{},
		&entities.ProductVideo{},
	)
}

func seedData(db *gorm.DB) error {
	// Check if data already exists
	var count int64
	if err := db.Model(&entities.Category{}).Count(&count).Error; err != nil {
		return err
	}
	
	if count > 0 {
		log.Println("Database already seeded, skipping...")
		return nil
	}

	log.Println("Seeding initial data...")

	// Create sample categories
	categories := []*entities.Category{
		{Name: "Electronics", Description: "Electronic devices and gadgets"},
		{Name: "Clothing", Description: "Fashion and apparel"},
		{Name: "Books", Description: "Books and literature"},
		{Name: "Home & Garden", Description: "Home improvement and gardening"},
		{Name: "Sports", Description: "Sports and outdoor equipment"},
	}

	for _, category := range categories {
		cat, err := entities.NewCategory(category.Name, category.Description, nil)
		if err != nil {
			return err
		}
		if err := db.Create(cat).Error; err != nil {
			return err
		}
	}

	// Create sample brands
	brands := []*entities.Brand{
		{Name: "Apple", Description: "Technology company"},
		{Name: "Samsung", Description: "Electronics manufacturer"},
		{Name: "Nike", Description: "Sports apparel and equipment"},
		{Name: "Adidas", Description: "Sports brand"},
		{Name: "Sony", Description: "Electronics and entertainment"},
	}

	for _, brand := range brands {
		b, err := entities.NewBrand(brand.Name, brand.Description)
		if err != nil {
			return err
		}
		if err := db.Create(b).Error; err != nil {
			return err
		}
	}

	log.Println("Initial data seeded successfully")
	return nil
}

func setupRouter(productHandler *handlers.ProductHandler) *gin.Engine {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger())

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(config))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "product-service",
			"timestamp": time.Now().UTC(),
		})
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	v1 := router.Group("/api/v1")
	{
		products := v1.Group("/products")
		{
			products.POST("", productHandler.CreateProduct)
			products.GET("/search", productHandler.SearchProducts)
			products.GET("/featured", productHandler.GetFeaturedProducts)
			products.GET("/category/:category_id", productHandler.GetProductsByCategory)
			products.GET("/brand/:brand_id", productHandler.GetProductsByBrand)
			products.GET("/sku/:sku", productHandler.GetProductBySKU)
			products.GET("/slug/:slug", productHandler.GetProductBySlug)
			products.GET("/:id", productHandler.GetProduct)
			products.PUT("/:id", productHandler.UpdateProduct)
			products.DELETE("/:id", productHandler.DeleteProduct)
			products.PUT("/:id/stock", productHandler.UpdateProductStock)
		}
	}

	return router
}

func getDatabaseDSN() string {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "password")
	dbname := getEnv("DB_NAME", "product_service")
	sslmode := getEnv("DB_SSLMODE", "disable")

	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)
}

func getPort() string {
	port := getEnv("PORT", "3003")
	return ":" + port
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

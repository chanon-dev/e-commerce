package main

import (
	"log"
	"os"

	"ecommerce-product-service/internal/config"
	"ecommerce-product-service/internal/database"
	"ecommerce-product-service/internal/handlers"
	"ecommerce-product-service/internal/middleware"
	"ecommerce-product-service/internal/repositories"
	"ecommerce-product-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title E-commerce Product Service API
// @version 1.0
// @description This is the Product Service for E-commerce platform
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
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg.Database)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Redis
	redisClient, err := database.InitializeRedis(cfg.Redis)
	if err != nil {
		log.Fatal("Failed to initialize Redis:", err)
	}

	// Initialize Elasticsearch
	esClient, err := database.InitializeElasticsearch(cfg.Elasticsearch)
	if err != nil {
		log.Fatal("Failed to initialize Elasticsearch:", err)
	}

	// Initialize repositories
	productRepo := repositories.NewProductRepository(db, redisClient, esClient)
	categoryRepo := repositories.NewCategoryRepository(db, redisClient)

	// Initialize services
	productService := services.NewProductService(productRepo, categoryRepo)
	categoryService := services.NewCategoryService(categoryRepo)

	// Initialize handlers
	productHandler := handlers.NewProductHandler(productService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	healthHandler := handlers.NewHealthHandler()

	// Setup Gin router
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.Metrics())

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Health endpoints
		health := v1.Group("/health")
		{
			health.GET("", healthHandler.GetHealth)
			health.GET("/ready", healthHandler.GetReadiness)
			health.GET("/live", healthHandler.GetLiveness)
		}

		// Metrics endpoint
		v1.GET("/metrics", middleware.PrometheusHandler())

		// Product endpoints
		products := v1.Group("/products")
		{
			products.GET("", productHandler.GetProducts)
			products.GET("/:id", productHandler.GetProduct)
			products.GET("/search", productHandler.SearchProducts)
			products.GET("/category/:categoryId", productHandler.GetProductsByCategory)
			
			// Protected endpoints (require authentication)
			protected := products.Group("")
			protected.Use(middleware.JWTAuth())
			{
				protected.POST("", productHandler.CreateProduct)
				protected.PUT("/:id", productHandler.UpdateProduct)
				protected.DELETE("/:id", productHandler.DeleteProduct)
				protected.POST("/:id/images", productHandler.UploadProductImages)
			}
		}

		// Category endpoints
		categories := v1.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:id", categoryHandler.GetCategory)
			
			// Protected endpoints
			protected := categories.Group("")
			protected.Use(middleware.JWTAuth())
			{
				protected.POST("", categoryHandler.CreateCategory)
				protected.PUT("/:id", categoryHandler.UpdateCategory)
				protected.DELETE("/:id", categoryHandler.DeleteCategory)
			}
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}

	log.Printf("🛍️ Product Service is running on port %s", port)
	log.Printf("📚 API Documentation: http://localhost:%s/swagger/index.html", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

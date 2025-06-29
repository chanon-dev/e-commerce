package main

import (
	"log"
	"os"

	"ecommerce-inventory-service/internal/config"
	"ecommerce-inventory-service/internal/database"
	"ecommerce-inventory-service/internal/handlers"
	"ecommerce-inventory-service/internal/middleware"
	"ecommerce-inventory-service/internal/repositories"
	"ecommerce-inventory-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title E-commerce Inventory Service API
// @version 1.0
// @description This is the Inventory Service for E-commerce platform
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3007
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

	// Initialize repositories
	inventoryRepo := repositories.NewInventoryRepository(db, redisClient)
	warehouseRepo := repositories.NewWarehouseRepository(db, redisClient)
	stockMovementRepo := repositories.NewStockMovementRepository(db)

	// Initialize services
	inventoryService := services.NewInventoryService(inventoryRepo, warehouseRepo, stockMovementRepo)
	warehouseService := services.NewWarehouseService(warehouseRepo)
	stockService := services.NewStockService(inventoryRepo, stockMovementRepo)

	// Initialize handlers
	inventoryHandler := handlers.NewInventoryHandler(inventoryService)
	warehouseHandler := handlers.NewWarehouseHandler(warehouseService)
	stockHandler := handlers.NewStockHandler(stockService)
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

		// Public inventory endpoints
		inventory := v1.Group("/inventory")
		{
			inventory.GET("/product/:productId", inventoryHandler.GetProductInventory)
			inventory.GET("/check-availability", inventoryHandler.CheckAvailability)
			inventory.POST("/reserve", inventoryHandler.ReserveStock)
			inventory.POST("/release", inventoryHandler.ReleaseStock)
		}

		// Protected endpoints (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.JWTAuth())
		{
			// Inventory management
			inventoryMgmt := protected.Group("/inventory")
			{
				inventoryMgmt.GET("", inventoryHandler.GetInventoryList)
				inventoryMgmt.POST("", inventoryHandler.CreateInventory)
				inventoryMgmt.PUT("/:id", inventoryHandler.UpdateInventory)
				inventoryMgmt.DELETE("/:id", inventoryHandler.DeleteInventory)
				inventoryMgmt.POST("/bulk-update", inventoryHandler.BulkUpdateInventory)
				inventoryMgmt.GET("/low-stock", inventoryHandler.GetLowStockItems)
				inventoryMgmt.GET("/out-of-stock", inventoryHandler.GetOutOfStockItems)
			}

			// Warehouse management
			warehouses := protected.Group("/warehouses")
			{
				warehouses.GET("", warehouseHandler.GetWarehouses)
				warehouses.POST("", warehouseHandler.CreateWarehouse)
				warehouses.GET("/:id", warehouseHandler.GetWarehouse)
				warehouses.PUT("/:id", warehouseHandler.UpdateWarehouse)
				warehouses.DELETE("/:id", warehouseHandler.DeleteWarehouse)
				warehouses.GET("/:id/inventory", warehouseHandler.GetWarehouseInventory)
			}

			// Stock movements
			stock := protected.Group("/stock")
			{
				stock.GET("/movements", stockHandler.GetStockMovements)
				stock.POST("/adjustment", stockHandler.CreateStockAdjustment)
				stock.POST("/transfer", stockHandler.TransferStock)
				stock.GET("/history/:productId", stockHandler.GetStockHistory)
				stock.GET("/reports/summary", stockHandler.GetStockSummaryReport)
				stock.GET("/reports/valuation", stockHandler.GetStockValuationReport)
			}
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3007"
	}

	log.Printf("📦 Inventory Service is running on port %s", port)
	log.Printf("📚 API Documentation: http://localhost:%s/swagger/index.html", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

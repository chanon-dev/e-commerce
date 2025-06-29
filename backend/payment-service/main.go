package main

import (
	"log"
	"os"

	"ecommerce-payment-service/internal/config"
	"ecommerce-payment-service/internal/database"
	"ecommerce-payment-service/internal/handlers"
	"ecommerce-payment-service/internal/middleware"
	"ecommerce-payment-service/internal/repositories"
	"ecommerce-payment-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title E-commerce Payment Service API
// @version 1.0
// @description This is the Payment Service for E-commerce platform
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3005
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
	paymentRepo := repositories.NewPaymentRepository(db, redisClient)
	paymentMethodRepo := repositories.NewPaymentMethodRepository(db, redisClient)

	// Initialize services
	stripeService := services.NewStripeService(cfg.Stripe.SecretKey)
	paypalService := services.NewPayPalService(cfg.PayPal.ClientID, cfg.PayPal.ClientSecret)
	paymentService := services.NewPaymentService(paymentRepo, paymentMethodRepo, stripeService, paypalService)

	// Initialize handlers
	paymentHandler := handlers.NewPaymentHandler(paymentService)
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

		// Payment endpoints
		payments := v1.Group("/payments")
		{
			payments.POST("/process", paymentHandler.ProcessPayment)
			payments.GET("/:id", paymentHandler.GetPayment)
			payments.POST("/:id/refund", paymentHandler.RefundPayment)
			payments.GET("/order/:orderId", paymentHandler.GetPaymentsByOrder)
			
			// Webhook endpoints
			payments.POST("/webhook/stripe", paymentHandler.StripeWebhook)
			payments.POST("/webhook/paypal", paymentHandler.PayPalWebhook)
		}

		// Payment methods endpoints
		methods := v1.Group("/payment-methods")
		methods.Use(middleware.JWTAuth())
		{
			methods.GET("", paymentHandler.GetPaymentMethods)
			methods.POST("", paymentHandler.CreatePaymentMethod)
			methods.PUT("/:id", paymentHandler.UpdatePaymentMethod)
			methods.DELETE("/:id", paymentHandler.DeletePaymentMethod)
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}

	log.Printf("💳 Payment Service is running on port %s", port)
	log.Printf("📚 API Documentation: http://localhost:%s/swagger/index.html", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

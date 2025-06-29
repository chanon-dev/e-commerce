package main

import (
	"log"
	"os"

	"ecommerce-notification-service/internal/config"
	"ecommerce-notification-service/internal/handlers"
	"ecommerce-notification-service/internal/middleware"
	"ecommerce-notification-service/internal/services"
	"ecommerce-notification-service/internal/workers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title E-commerce Notification Service API
// @version 1.0
// @description This is the Notification Service for E-commerce platform
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3011
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

	// Initialize services
	emailService := services.NewEmailService(cfg.Email)
	smsService := services.NewSMSService(cfg.SMS)
	pushService := services.NewPushNotificationService(cfg.Push)
	templateService := services.NewTemplateService()
	notificationService := services.NewNotificationService(emailService, smsService, pushService, templateService)

	// Initialize Kafka consumer
	kafkaConsumer := workers.NewKafkaConsumer(cfg.Kafka, notificationService)
	go kafkaConsumer.Start()

	// Initialize handlers
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	templateHandler := handlers.NewTemplateHandler(templateService)
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

		// Notification endpoints
		notifications := v1.Group("/notifications")
		{
			// Send notifications
			notifications.POST("/email", notificationHandler.SendEmail)
			notifications.POST("/sms", notificationHandler.SendSMS)
			notifications.POST("/push", notificationHandler.SendPushNotification)
			notifications.POST("/bulk", notificationHandler.SendBulkNotifications)

			// Get notification history
			notifications.GET("/history", notificationHandler.GetNotificationHistory)
			notifications.GET("/history/:id", notificationHandler.GetNotificationById)

			// Notification preferences
			notifications.GET("/preferences/:userId", notificationHandler.GetUserPreferences)
			notifications.PUT("/preferences/:userId", notificationHandler.UpdateUserPreferences)

			// Subscription management
			notifications.POST("/subscribe", notificationHandler.Subscribe)
			notifications.POST("/unsubscribe", notificationHandler.Unsubscribe)
		}

		// Template management
		templates := v1.Group("/templates")
		templates.Use(middleware.JWTAuth())
		{
			templates.GET("", templateHandler.GetTemplates)
			templates.POST("", templateHandler.CreateTemplate)
			templates.GET("/:id", templateHandler.GetTemplate)
			templates.PUT("/:id", templateHandler.UpdateTemplate)
			templates.DELETE("/:id", templateHandler.DeleteTemplate)
			templates.POST("/:id/preview", templateHandler.PreviewTemplate)
		}

		// Analytics and reports
		analytics := v1.Group("/analytics")
		analytics.Use(middleware.JWTAuth())
		{
			analytics.GET("/summary", notificationHandler.GetAnalyticsSummary)
			analytics.GET("/delivery-rates", notificationHandler.GetDeliveryRates)
			analytics.GET("/engagement", notificationHandler.GetEngagementMetrics)
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3011"
	}

	log.Printf("📧 Notification Service is running on port %s", port)
	log.Printf("📚 API Documentation: http://localhost:%s/swagger/index.html", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

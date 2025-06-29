package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/segmentio/kafka-go"
	"golang.org/x/net/context"
)

// Business Metrics
var (
	// Order Metrics
	ordersTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "orders_total",
			Help: "Total number of orders created",
		},
		[]string{"status", "payment_method", "source"},
	)

	ordersValue = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "orders_value_total",
			Help: "Total value of orders",
		},
		[]string{"currency", "status"},
	)

	orderProcessingTime = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "order_processing_duration_seconds",
			Help:    "Time taken to process orders",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"status"},
	)

	// Product Metrics
	productViews = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "product_views_total",
			Help: "Total number of product views",
		},
		[]string{"product_id", "product_name", "category"},
	)

	inventoryLevel = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "inventory_quantity",
			Help: "Current inventory quantity",
		},
		[]string{"product_id", "sku"},
	)

	inventoryLowThreshold = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "inventory_low_threshold",
			Help: "Low inventory threshold",
		},
		[]string{"product_id", "sku"},
	)

	// Cart Metrics
	cartCreated = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cart_created_total",
			Help: "Total number of carts created",
		},
		[]string{"user_type"},
	)

	cartAbandoned = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cart_abandoned_total",
			Help: "Total number of abandoned carts",
		},
		[]string{"abandonment_stage"},
	)

	cartValue = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "cart_value_distribution",
			Help:    "Distribution of cart values",
			Buckets: []float64{10, 25, 50, 100, 250, 500, 1000, 2500, 5000},
		},
		[]string{"currency"},
	)

	// Payment Metrics
	paymentAttempts = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "payment_attempts_total",
			Help: "Total number of payment attempts",
		},
		[]string{"provider", "method", "status"},
	)

	paymentProcessingTime = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "payment_processing_duration_seconds",
			Help:    "Time taken to process payments",
			Buckets: []float64{0.1, 0.5, 1, 2, 5, 10, 30},
		},
		[]string{"provider", "method"},
	)

	// User Metrics
	userRegistrations = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "user_registrations_total",
			Help: "Total number of user registrations",
		},
		[]string{"source", "method"},
	)

	userSessions = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "user_active_sessions",
			Help: "Number of active user sessions",
		},
		[]string{"user_type"},
	)

	// Revenue Metrics
	revenueTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "revenue_total",
			Help: "Total revenue generated",
		},
		[]string{"currency", "source", "category"},
	)

	revenuePerUser = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "revenue_per_user",
			Help:    "Revenue per user distribution",
			Buckets: []float64{10, 50, 100, 250, 500, 1000, 2500, 5000, 10000},
		},
		[]string{"currency", "user_segment"},
	)

	// Performance Metrics
	pageViews = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "page_views_total",
			Help: "Total number of page views",
		},
		[]string{"page", "source", "device_type"},
	)

	searchQueries = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "search_queries_total",
			Help: "Total number of search queries",
		},
		[]string{"query_type", "results_count_range"},
	)

	// Security Metrics
	failedLoginAttempts = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "failed_login_attempts_total",
			Help: "Total number of failed login attempts",
		},
		[]string{"source_ip", "user_agent_type"},
	)

	securityEvents = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "security_events_total",
			Help: "Total number of security events",
		},
		[]string{"event_type", "severity", "source_ip"},
	)
)

type BusinessMetricsExporter struct {
	db          *sql.DB
	redisClient *redis.Client
	kafkaReader *kafka.Reader
}

func NewBusinessMetricsExporter() *BusinessMetricsExporter {
	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:password@localhost:5432/ecommerce?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Redis connection
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}

	redisClient := redis.NewClient(opt)

	// Kafka connection
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{kafkaBrokers},
		Topic:   "business-events",
		GroupID: "business-metrics-exporter",
	})

	return &BusinessMetricsExporter{
		db:          db,
		redisClient: redisClient,
		kafkaReader: kafkaReader,
	}
}

func (bme *BusinessMetricsExporter) collectOrderMetrics() {
	// Collect order metrics from database
	query := `
		SELECT 
			status,
			payment_method,
			source,
			COUNT(*) as count,
			SUM(total_amount) as total_value,
			currency
		FROM orders 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY status, payment_method, source, currency
	`

	rows, err := bme.db.Query(query)
	if err != nil {
		log.Printf("Error querying order metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var status, paymentMethod, source, currency string
		var count int
		var totalValue float64

		err := rows.Scan(&status, &paymentMethod, &source, &count, &totalValue, &currency)
		if err != nil {
			log.Printf("Error scanning order metrics: %v", err)
			continue
		}

		ordersTotal.WithLabelValues(status, paymentMethod, source).Add(float64(count))
		ordersValue.WithLabelValues(currency, status).Add(totalValue)
	}
}

func (bme *BusinessMetricsExporter) collectProductMetrics() {
	// Collect product view metrics from Redis
	ctx := context.Background()
	
	// Get product views from Redis sorted set
	productViews := bme.redisClient.ZRangeWithScores(ctx, "product_views:hourly", 0, -1)
	for _, view := range productViews.Val() {
		productID := view.Member.(string)
		viewCount := view.Score

		// Get product details
		productData := bme.redisClient.HGetAll(ctx, fmt.Sprintf("product:%s", productID))
		productInfo := productData.Val()

		productName := productInfo["name"]
		category := productInfo["category"]

		bme.productViews.WithLabelValues(productID, productName, category).Add(viewCount)
	}

	// Collect inventory metrics
	inventoryQuery := `
		SELECT 
			product_id,
			sku,
			quantity,
			low_stock_threshold
		FROM inventory
		WHERE updated_at >= NOW() - INTERVAL '5 minutes'
	`

	rows, err := bme.db.Query(inventoryQuery)
	if err != nil {
		log.Printf("Error querying inventory metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var productID, sku string
		var quantity, threshold int

		err := rows.Scan(&productID, &sku, &quantity, &threshold)
		if err != nil {
			log.Printf("Error scanning inventory metrics: %v", err)
			continue
		}

		inventoryLevel.WithLabelValues(productID, sku).Set(float64(quantity))
		inventoryLowThreshold.WithLabelValues(productID, sku).Set(float64(threshold))
	}
}

func (bme *BusinessMetricsExporter) collectCartMetrics() {
	// Collect cart metrics from database
	cartQuery := `
		SELECT 
			CASE WHEN user_id IS NULL THEN 'guest' ELSE 'registered' END as user_type,
			COUNT(*) as created_count,
			COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_count,
			AVG(total_amount) as avg_value,
			currency
		FROM carts 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY user_type, currency
	`

	rows, err := bme.db.Query(cartQuery)
	if err != nil {
		log.Printf("Error querying cart metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userType, currency string
		var createdCount, abandonedCount int
		var avgValue float64

		err := rows.Scan(&userType, &createdCount, &abandonedCount, &avgValue, &currency)
		if err != nil {
			log.Printf("Error scanning cart metrics: %v", err)
			continue
		}

		cartCreated.WithLabelValues(userType).Add(float64(createdCount))
		cartAbandoned.WithLabelValues("checkout").Add(float64(abandonedCount))
		cartValue.WithLabelValues(currency).Observe(avgValue)
	}
}

func (bme *BusinessMetricsExporter) collectPaymentMetrics() {
	// Collect payment metrics from database
	paymentQuery := `
		SELECT 
			provider,
			method,
			status,
			COUNT(*) as attempts,
			AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time
		FROM payments 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY provider, method, status
	`

	rows, err := bme.db.Query(paymentQuery)
	if err != nil {
		log.Printf("Error querying payment metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var provider, method, status string
		var attempts int
		var avgProcessingTime float64

		err := rows.Scan(&provider, &method, &status, &attempts, &avgProcessingTime)
		if err != nil {
			log.Printf("Error scanning payment metrics: %v", err)
			continue
		}

		paymentAttempts.WithLabelValues(provider, method, status).Add(float64(attempts))
		if avgProcessingTime > 0 {
			paymentProcessingTime.WithLabelValues(provider, method).Observe(avgProcessingTime)
		}
	}
}

func (bme *BusinessMetricsExporter) collectUserMetrics() {
	// Collect user registration metrics
	userQuery := `
		SELECT 
			registration_source,
			registration_method,
			COUNT(*) as registrations
		FROM users 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY registration_source, registration_method
	`

	rows, err := bme.db.Query(userQuery)
	if err != nil {
		log.Printf("Error querying user metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var source, method string
		var registrations int

		err := rows.Scan(&source, &method, &registrations)
		if err != nil {
			log.Printf("Error scanning user metrics: %v", err)
			continue
		}

		userRegistrations.WithLabelValues(source, method).Add(float64(registrations))
	}

	// Collect active session metrics from Redis
	ctx := context.Background()
	
	// Count active sessions by user type
	guestSessions := bme.redisClient.SCard(ctx, "active_sessions:guest").Val()
	registeredSessions := bme.redisClient.SCard(ctx, "active_sessions:registered").Val()

	userSessions.WithLabelValues("guest").Set(float64(guestSessions))
	userSessions.WithLabelValues("registered").Set(float64(registeredSessions))
}

func (bme *BusinessMetricsExporter) collectRevenueMetrics() {
	// Collect revenue metrics from database
	revenueQuery := `
		SELECT 
			currency,
			source,
			category,
			SUM(amount) as total_revenue,
			COUNT(DISTINCT user_id) as unique_users,
			AVG(amount) as avg_revenue_per_user
		FROM revenue_events 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY currency, source, category
	`

	rows, err := bme.db.Query(revenueQuery)
	if err != nil {
		log.Printf("Error querying revenue metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var currency, source, category string
		var totalRevenue, avgRevenuePerUser float64
		var uniqueUsers int

		err := rows.Scan(&currency, &source, &category, &totalRevenue, &uniqueUsers, &avgRevenuePerUser)
		if err != nil {
			log.Printf("Error scanning revenue metrics: %v", err)
			continue
		}

		revenueTotal.WithLabelValues(currency, source, category).Add(totalRevenue)
		revenuePerUser.WithLabelValues(currency, "all").Observe(avgRevenuePerUser)
	}
}

func (bme *BusinessMetricsExporter) collectSecurityMetrics() {
	// Collect security metrics from database
	securityQuery := `
		SELECT 
			event_type,
			severity,
			source_ip,
			COUNT(*) as event_count
		FROM security_events 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY event_type, severity, source_ip
	`

	rows, err := bme.db.Query(securityQuery)
	if err != nil {
		log.Printf("Error querying security metrics: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var eventType, severity, sourceIP string
		var eventCount int

		err := rows.Scan(&eventType, &severity, &sourceIP, &eventCount)
		if err != nil {
			log.Printf("Error scanning security metrics: %v", err)
			continue
		}

		securityEvents.WithLabelValues(eventType, severity, sourceIP).Add(float64(eventCount))
	}

	// Collect failed login attempts
	loginQuery := `
		SELECT 
			source_ip,
			CASE 
				WHEN user_agent LIKE '%Mobile%' THEN 'mobile'
				WHEN user_agent LIKE '%Bot%' THEN 'bot'
				ELSE 'desktop'
			END as user_agent_type,
			COUNT(*) as failed_attempts
		FROM failed_login_attempts 
		WHERE created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY source_ip, user_agent_type
	`

	loginRows, err := bme.db.Query(loginQuery)
	if err != nil {
		log.Printf("Error querying login metrics: %v", err)
		return
	}
	defer loginRows.Close()

	for loginRows.Next() {
		var sourceIP, userAgentType string
		var failedAttempts int

		err := loginRows.Scan(&sourceIP, &userAgentType, &failedAttempts)
		if err != nil {
			log.Printf("Error scanning login metrics: %v", err)
			continue
		}

		failedLoginAttempts.WithLabelValues(sourceIP, userAgentType).Add(float64(failedAttempts))
	}
}

func (bme *BusinessMetricsExporter) startMetricsCollection() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go bme.collectOrderMetrics()
			go bme.collectProductMetrics()
			go bme.collectCartMetrics()
			go bme.collectPaymentMetrics()
			go bme.collectUserMetrics()
			go bme.collectRevenueMetrics()
			go bme.collectSecurityMetrics()
		}
	}
}

func (bme *BusinessMetricsExporter) healthCheck(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"services": map[string]bool{
			"database": bme.checkDatabaseHealth(),
			"redis":    bme.checkRedisHealth(),
			"kafka":    bme.checkKafkaHealth(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

func (bme *BusinessMetricsExporter) checkDatabaseHealth() bool {
	err := bme.db.Ping()
	return err == nil
}

func (bme *BusinessMetricsExporter) checkRedisHealth() bool {
	ctx := context.Background()
	_, err := bme.redisClient.Ping(ctx).Result()
	return err == nil
}

func (bme *BusinessMetricsExporter) checkKafkaHealth() bool {
	// Simple check - try to read kafka stats
	stats := bme.kafkaReader.Stats()
	return stats.Topic != ""
}

func init() {
	// Register all metrics
	prometheus.MustRegister(ordersTotal)
	prometheus.MustRegister(ordersValue)
	prometheus.MustRegister(orderProcessingTime)
	prometheus.MustRegister(productViews)
	prometheus.MustRegister(inventoryLevel)
	prometheus.MustRegister(inventoryLowThreshold)
	prometheus.MustRegister(cartCreated)
	prometheus.MustRegister(cartAbandoned)
	prometheus.MustRegister(cartValue)
	prometheus.MustRegister(paymentAttempts)
	prometheus.MustRegister(paymentProcessingTime)
	prometheus.MustRegister(userRegistrations)
	prometheus.MustRegister(userSessions)
	prometheus.MustRegister(revenueTotal)
	prometheus.MustRegister(revenuePerUser)
	prometheus.MustRegister(pageViews)
	prometheus.MustRegister(searchQueries)
	prometheus.MustRegister(failedLoginAttempts)
	prometheus.MustRegister(securityEvents)
}

func main() {
	exporter := NewBusinessMetricsExporter()
	defer exporter.db.Close()
	defer exporter.redisClient.Close()
	defer exporter.kafkaReader.Close()

	// Start metrics collection
	go exporter.startMetricsCollection()

	// Setup HTTP server
	router := mux.NewRouter()
	
	// Metrics endpoint
	router.Handle("/metrics", promhttp.Handler())
	
	// Health check endpoint
	router.HandleFunc("/health", exporter.healthCheck)
	
	// Info endpoint
	router.HandleFunc("/info", func(w http.ResponseWriter, r *http.Request) {
		info := map[string]interface{}{
			"service":     "business-metrics-exporter",
			"version":     "1.0.0",
			"description": "E-commerce business metrics exporter for Prometheus",
			"endpoints": []string{
				"/metrics",
				"/health",
				"/info",
			},
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(info)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Business Metrics Exporter starting on port %s", port)
	log.Printf("📊 Metrics available at http://localhost:%s/metrics", port)
	log.Printf("❤️ Health check at http://localhost:%s/health", port)

	log.Fatal(http.ListenAndServe(":"+port, router))
}

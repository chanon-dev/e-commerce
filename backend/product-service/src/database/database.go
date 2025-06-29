package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"product-service/src/entities"
)

var DB *gorm.DB

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	TimeZone string
}

// Initialize initializes the database connection
func Initialize() error {
	config := Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "ecommerce_products"),
		SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		TimeZone: getEnv("DB_TIMEZONE", "UTC"),
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode, config.TimeZone,
	)

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  getLogLevel(),
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Open database connection
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",
			SingularTable: false,
			NameReplacer:  nil,
			NoLowerCase:   false,
		},
		DisableForeignKeyConstraintWhenMigrating: false,
		SkipDefaultTransaction:                   false,
		PrepareStmt:                              true,
		CreateBatchSize:                          1000,
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = db

	// Run migrations
	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create indexes
	if err := createIndexes(); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	// Seed initial data
	if err := seedData(); err != nil {
		return fmt.Errorf("failed to seed data: %w", err)
	}

	log.Println("✅ Database initialized successfully")
	return nil
}

// runMigrations runs database migrations
func runMigrations() error {
	log.Println("🔄 Running database migrations...")

	// Auto-migrate all entities
	err := DB.AutoMigrate(
		&entities.Product{},
		&entities.ProductImage{},
		&entities.ProductVariant{},
		&entities.VariantOption{},
		&entities.ProductAttribute{},
		&entities.ProductTag{},
		&entities.Category{},
		&entities.ProductReview{},
	)

	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
	}

	// Create custom constraints and triggers
	if err := createCustomConstraints(); err != nil {
		return fmt.Errorf("failed to create custom constraints: %w", err)
	}

	log.Println("✅ Database migrations completed")
	return nil
}

// createCustomConstraints creates custom database constraints
func createCustomConstraints() error {
	// Enable UUID extension
	if err := DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return err
	}

	// Create custom constraints
	constraints := []string{
		// Product constraints
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_price_positive 
		 CHECK (price >= 0)`,
		
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_compare_price_positive 
		 CHECK (compare_price >= 0)`,
		
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_cost_price_positive 
		 CHECK (cost_price >= 0)`,
		
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_quantity_positive 
		 CHECK (quantity >= 0)`,
		
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_low_stock_positive 
		 CHECK (low_stock_level >= 0)`,
		
		`ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_product_weight_positive 
		 CHECK (weight >= 0)`,
		
		// Product variant constraints
		`ALTER TABLE product_variants ADD CONSTRAINT IF NOT EXISTS chk_variant_price_positive 
		 CHECK (price IS NULL OR price >= 0)`,
		
		`ALTER TABLE product_variants ADD CONSTRAINT IF NOT EXISTS chk_variant_quantity_positive 
		 CHECK (quantity >= 0)`,
		
		// Review constraints
		`ALTER TABLE product_reviews ADD CONSTRAINT IF NOT EXISTS chk_review_rating_range 
		 CHECK (rating >= 1 AND rating <= 5)`,
		
		`ALTER TABLE product_reviews ADD CONSTRAINT IF NOT EXISTS chk_review_helpful_positive 
		 CHECK (helpful_count >= 0 AND unhelpful_count >= 0)`,
	}

	for _, constraint := range constraints {
		if err := DB.Exec(constraint).Error; err != nil {
			log.Printf("Warning: Failed to create constraint: %v", err)
		}
	}

	return nil
}

// createIndexes creates additional database indexes
func createIndexes() error {
	log.Println("🔄 Creating database indexes...")

	indexes := []string{
		// Product indexes
		"CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('english', name))",
		"CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING gin(to_tsvector('english', description))",
		"CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products(brand, status)",
		"CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status)",
		"CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE status = 'active'",
		"CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true",
		"CREATE INDEX IF NOT EXISTS idx_products_published ON products(published_at) WHERE published_at IS NOT NULL",
		
		// Product variant indexes
		"CREATE INDEX IF NOT EXISTS idx_variants_product_status ON product_variants(product_id, status)",
		"CREATE INDEX IF NOT EXISTS idx_variants_sku_unique ON product_variants(sku) WHERE sku IS NOT NULL",
		
		// Category indexes
		"CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON categories(parent_id, is_active)",
		"CREATE INDEX IF NOT EXISTS idx_categories_slug_unique ON categories(slug)",
		
		// Review indexes
		"CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON product_reviews(product_id, status)",
		"CREATE INDEX IF NOT EXISTS idx_reviews_user_product ON product_reviews(user_id, product_id)",
		"CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating)",
		
		// Image indexes
		"CREATE INDEX IF NOT EXISTS idx_images_product_primary ON product_images(product_id, is_primary)",
		"CREATE INDEX IF NOT EXISTS idx_images_position ON product_images(product_id, position)",
		
		// Attribute indexes
		"CREATE INDEX IF NOT EXISTS idx_attributes_product_name ON product_attributes(product_id, name)",
		"CREATE INDEX IF NOT EXISTS idx_attributes_visible ON product_attributes(product_id) WHERE is_visible = true",
	}

	for _, index := range indexes {
		if err := DB.Exec(index).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
		}
	}

	log.Println("✅ Database indexes created")
	return nil
}

// seedData seeds initial data
func seedData() error {
	log.Println("🌱 Seeding initial data...")

	// Check if data already exists
	var count int64
	DB.Model(&entities.Category{}).Count(&count)
	if count > 0 {
		log.Println("📊 Data already exists, skipping seed")
		return nil
	}

	// Seed categories
	categories := []entities.Category{
		{
			Name:        "Electronics",
			Slug:        "electronics",
			Description: "Electronic devices and accessories",
			IsActive:    true,
			Position:    1,
		},
		{
			Name:        "Clothing",
			Slug:        "clothing",
			Description: "Apparel and fashion items",
			IsActive:    true,
			Position:    2,
		},
		{
			Name:        "Home & Garden",
			Slug:        "home-garden",
			Description: "Home improvement and garden supplies",
			IsActive:    true,
			Position:    3,
		},
		{
			Name:        "Sports & Outdoors",
			Slug:        "sports-outdoors",
			Description: "Sports equipment and outdoor gear",
			IsActive:    true,
			Position:    4,
		},
		{
			Name:        "Books",
			Slug:        "books",
			Description: "Books and educational materials",
			IsActive:    true,
			Position:    5,
		},
	}

	if err := DB.Create(&categories).Error; err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}

	// Seed product tags
	tags := []entities.ProductTag{
		{Name: "New Arrival", Slug: "new-arrival", Color: "#28a745"},
		{Name: "Best Seller", Slug: "best-seller", Color: "#ffc107"},
		{Name: "On Sale", Slug: "on-sale", Color: "#dc3545"},
		{Name: "Limited Edition", Slug: "limited-edition", Color: "#6f42c1"},
		{Name: "Eco Friendly", Slug: "eco-friendly", Color: "#20c997"},
	}

	if err := DB.Create(&tags).Error; err != nil {
		return fmt.Errorf("failed to seed tags: %w", err)
	}

	log.Println("✅ Initial data seeded successfully")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// Health checks database health
func Health() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Ping()
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getLogLevel() logger.LogLevel {
	switch getEnv("DB_LOG_LEVEL", "info") {
	case "silent":
		return logger.Silent
	case "error":
		return logger.Error
	case "warn":
		return logger.Warn
	case "info":
		return logger.Info
	default:
		return logger.Info
	}
}

// Transaction helper
func WithTransaction(fn func(*gorm.DB) error) error {
	return DB.Transaction(fn)
}

// Pagination helper
type PaginationResult struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

func Paginate(db *gorm.DB, page, perPage int, result interface{}) (*PaginationResult, error) {
	var total int64
	
	// Count total records
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// Calculate offset
	offset := (page - 1) * perPage

	// Get paginated results
	if err := db.Offset(offset).Limit(perPage).Find(result).Error; err != nil {
		return nil, err
	}

	// Calculate total pages
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))

	return &PaginationResult{
		Data:       result,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

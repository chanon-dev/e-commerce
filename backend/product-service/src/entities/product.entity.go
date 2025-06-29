package entities

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Product represents the main product entity
type Product struct {
	BaseEntity
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null;index" json:"name"`
	Slug        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	ShortDesc   string    `gorm:"type:varchar(500)" json:"short_description"`
	
	// SEO fields
	MetaTitle       string `gorm:"type:varchar(255)" json:"meta_title"`
	MetaDescription string `gorm:"type:varchar(500)" json:"meta_description"`
	MetaKeywords    string `gorm:"type:varchar(255)" json:"meta_keywords"`
	
	// Product details
	SKU           string          `gorm:"type:varchar(100);uniqueIndex" json:"sku"`
	Barcode       string          `gorm:"type:varchar(100);index" json:"barcode"`
	Brand         string          `gorm:"type:varchar(100);index" json:"brand"`
	Manufacturer  string          `gorm:"type:varchar(100)" json:"manufacturer"`
	Model         string          `gorm:"type:varchar(100)" json:"model"`
	
	// Pricing
	Price         float64 `gorm:"type:decimal(18,2);not null;check:price >= 0" json:"price"`
	ComparePrice  float64 `gorm:"type:decimal(18,2);check:compare_price >= 0" json:"compare_price"`
	CostPrice     float64 `gorm:"type:decimal(18,2);check:cost_price >= 0" json:"cost_price"`
	Currency      string  `gorm:"type:varchar(3);not null;default:'USD'" json:"currency"`
	
	// Inventory
	TrackQuantity    bool `gorm:"default:true" json:"track_quantity"`
	Quantity         int  `gorm:"default:0;check:quantity >= 0" json:"quantity"`
	LowStockLevel    int  `gorm:"default:10;check:low_stock_level >= 0" json:"low_stock_level"`
	AllowBackorder   bool `gorm:"default:false" json:"allow_backorder"`
	RequiresShipping bool `gorm:"default:true" json:"requires_shipping"`
	
	// Physical properties
	Weight       float64 `gorm:"type:decimal(10,3);check:weight >= 0" json:"weight"`
	WeightUnit   string  `gorm:"type:varchar(10);default:'kg'" json:"weight_unit"`
	Dimensions   JSONB   `gorm:"type:jsonb" json:"dimensions"`
	
	// Status and visibility
	Status      ProductStatus `gorm:"type:varchar(20);not null;default:'draft';index" json:"status"`
	Visibility  Visibility    `gorm:"type:varchar(20);not null;default:'visible';index" json:"visibility"`
	Featured    bool          `gorm:"default:false;index" json:"featured"`
	
	// Dates
	PublishedAt   *time.Time `json:"published_at"`
	AvailableFrom *time.Time `json:"available_from"`
	AvailableUntil *time.Time `json:"available_until"`
	
	// Relationships
	CategoryID uuid.UUID `gorm:"type:uuid;index" json:"category_id"`
	Category   *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	
	// Collections
	Images     []ProductImage    `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"images,omitempty"`
	Variants   []ProductVariant  `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"variants,omitempty"`
	Attributes []ProductAttribute `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"attributes,omitempty"`
	Tags       []ProductTag      `gorm:"many2many:product_tag_relations;constraint:OnDelete:CASCADE" json:"tags,omitempty"`
	Categories []Category        `gorm:"many2many:product_category_relations;constraint:OnDelete:CASCADE" json:"categories,omitempty"`
	Reviews    []ProductReview   `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"reviews,omitempty"`
	
	// Computed fields (not stored in DB)
	AverageRating float64 `gorm:"-" json:"average_rating"`
	ReviewCount   int     `gorm:"-" json:"review_count"`
	IsInStock     bool    `gorm:"-" json:"is_in_stock"`
	IsLowStock    bool    `gorm:"-" json:"is_low_stock"`
	IsOnSale      bool    `gorm:"-" json:"is_on_sale"`
	SalePrice     float64 `gorm:"-" json:"sale_price"`
	
	// Additional metadata
	Metadata JSONB `gorm:"type:jsonb" json:"metadata"`
}

// ProductStatus represents the status of a product
type ProductStatus string

const (
	ProductStatusDraft     ProductStatus = "draft"
	ProductStatusActive    ProductStatus = "active"
	ProductStatusInactive  ProductStatus = "inactive"
	ProductStatusArchived  ProductStatus = "archived"
	ProductStatusDeleted   ProductStatus = "deleted"
)

// Visibility represents product visibility
type Visibility string

const (
	VisibilityVisible Visibility = "visible"
	VisibilityHidden  Visibility = "hidden"
	VisibilityPrivate Visibility = "private"
)

// ProductImage represents product images
type ProductImage struct {
	BaseEntity
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	URL       string    `gorm:"type:varchar(500);not null" json:"url"`
	AltText   string    `gorm:"type:varchar(255)" json:"alt_text"`
	Title     string    `gorm:"type:varchar(255)" json:"title"`
	Position  int       `gorm:"default:0" json:"position"`
	IsPrimary bool      `gorm:"default:false" json:"is_primary"`
	Width     int       `json:"width"`
	Height    int       `json:"height"`
	Size      int64     `json:"size"`
	MimeType  string    `gorm:"type:varchar(100)" json:"mime_type"`
}

// ProductVariant represents product variants
type ProductVariant struct {
	BaseEntity
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	
	// Variant details
	Name     string `gorm:"type:varchar(255);not null" json:"name"`
	SKU      string `gorm:"type:varchar(100);uniqueIndex" json:"sku"`
	Barcode  string `gorm:"type:varchar(100)" json:"barcode"`
	
	// Pricing (can override product pricing)
	Price        *float64 `gorm:"type:decimal(18,2);check:price >= 0" json:"price"`
	ComparePrice *float64 `gorm:"type:decimal(18,2);check:compare_price >= 0" json:"compare_price"`
	CostPrice    *float64 `gorm:"type:decimal(18,2);check:cost_price >= 0" json:"cost_price"`
	
	// Inventory
	Quantity         int  `gorm:"default:0;check:quantity >= 0" json:"quantity"`
	LowStockLevel    int  `gorm:"default:10;check:low_stock_level >= 0" json:"low_stock_level"`
	AllowBackorder   bool `gorm:"default:false" json:"allow_backorder"`
	RequiresShipping bool `gorm:"default:true" json:"requires_shipping"`
	
	// Physical properties
	Weight     *float64 `gorm:"type:decimal(10,3);check:weight >= 0" json:"weight"`
	WeightUnit string   `gorm:"type:varchar(10)" json:"weight_unit"`
	Dimensions JSONB    `gorm:"type:jsonb" json:"dimensions"`
	
	// Status
	Status   ProductStatus `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	Position int           `gorm:"default:0" json:"position"`
	
	// Variant options (color, size, etc.)
	Options []VariantOption `gorm:"foreignKey:VariantID;constraint:OnDelete:CASCADE" json:"options,omitempty"`
	
	// Images specific to this variant
	Images []ProductImage `gorm:"foreignKey:VariantID;constraint:OnDelete:CASCADE" json:"images,omitempty"`
	
	// Computed fields
	IsInStock  bool    `gorm:"-" json:"is_in_stock"`
	IsLowStock bool    `gorm:"-" json:"is_low_stock"`
	FinalPrice float64 `gorm:"-" json:"final_price"`
}

// VariantOption represents variant options like color, size, etc.
type VariantOption struct {
	BaseEntity
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	VariantID uuid.UUID `gorm:"type:uuid;not null;index" json:"variant_id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Value     string    `gorm:"type:varchar(255);not null" json:"value"`
	Position  int       `gorm:"default:0" json:"position"`
}

// ProductAttribute represents custom product attributes
type ProductAttribute struct {
	BaseEntity
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	Type      string    `gorm:"type:varchar(50);default:'text'" json:"type"`
	Position  int       `gorm:"default:0" json:"position"`
	IsVisible bool      `gorm:"default:true" json:"is_visible"`
}

// ProductTag represents product tags
type ProductTag struct {
	BaseEntity
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Slug        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	Color       string    `gorm:"type:varchar(7)" json:"color"`
}

// Category represents product categories
type Category struct {
	BaseEntity
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null;index" json:"name"`
	Slug        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	
	// Hierarchy
	ParentID *uuid.UUID  `gorm:"type:uuid;index" json:"parent_id"`
	Parent   *Category   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Category  `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	
	// Display
	ImageURL string `gorm:"type:varchar(500)" json:"image_url"`
	Position int    `gorm:"default:0" json:"position"`
	IsActive bool   `gorm:"default:true;index" json:"is_active"`
	
	// SEO
	MetaTitle       string `gorm:"type:varchar(255)" json:"meta_title"`
	MetaDescription string `gorm:"type:varchar(500)" json:"meta_description"`
	
	// Computed fields
	ProductCount int `gorm:"-" json:"product_count"`
	Level        int `gorm:"-" json:"level"`
}

// ProductReview represents product reviews
type ProductReview struct {
	BaseEntity
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	
	// Review content
	Rating  int    `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Title   string `gorm:"type:varchar(255)" json:"title"`
	Content string `gorm:"type:text" json:"content"`
	
	// Status
	Status       ReviewStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	IsVerified   bool         `gorm:"default:false" json:"is_verified"`
	IsRecommended bool        `gorm:"default:false" json:"is_recommended"`
	
	// Interaction
	HelpfulCount   int `gorm:"default:0" json:"helpful_count"`
	UnhelpfulCount int `gorm:"default:0" json:"unhelpful_count"`
	
	// Metadata
	UserAgent string `gorm:"type:varchar(500)" json:"user_agent"`
	IPAddress string `gorm:"type:varchar(45)" json:"ip_address"`
}

// ReviewStatus represents review status
type ReviewStatus string

const (
	ReviewStatusPending  ReviewStatus = "pending"
	ReviewStatusApproved ReviewStatus = "approved"
	ReviewStatusRejected ReviewStatus = "rejected"
	ReviewStatusSpam     ReviewStatus = "spam"
)

// JSONB represents a JSONB field
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	
	return json.Unmarshal(bytes, j)
}

// BeforeCreate hook
func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	
	// Generate slug if not provided
	if p.Slug == "" {
		p.Slug = generateSlug(p.Name)
	}
	
	// Set published date for active products
	if p.Status == ProductStatusActive && p.PublishedAt == nil {
		now := time.Now()
		p.PublishedAt = &now
	}
	
	return nil
}

// BeforeUpdate hook
func (p *Product) BeforeUpdate(tx *gorm.DB) error {
	// Set published date when status changes to active
	if p.Status == ProductStatusActive && p.PublishedAt == nil {
		now := time.Now()
		p.PublishedAt = &now
	}
	
	return nil
}

// AfterFind hook to calculate computed fields
func (p *Product) AfterFind(tx *gorm.DB) error {
	p.calculateComputedFields()
	return nil
}

// Business logic methods
func (p *Product) IsAvailable() bool {
	now := time.Now()
	
	// Check status
	if p.Status != ProductStatusActive {
		return false
	}
	
	// Check availability dates
	if p.AvailableFrom != nil && now.Before(*p.AvailableFrom) {
		return false
	}
	
	if p.AvailableUntil != nil && now.After(*p.AvailableUntil) {
		return false
	}
	
	return true
}

func (p *Product) IsInStockCheck() bool {
	if !p.TrackQuantity {
		return true
	}
	
	if p.AllowBackorder {
		return true
	}
	
	return p.Quantity > 0
}

func (p *Product) IsLowStockCheck() bool {
	if !p.TrackQuantity {
		return false
	}
	
	return p.Quantity <= p.LowStockLevel && p.Quantity > 0
}

func (p *Product) GetFinalPrice() float64 {
	// Check for active promotions/sales
	if p.ComparePrice > 0 && p.ComparePrice > p.Price {
		return p.Price
	}
	
	return p.Price
}

func (p *Product) GetDiscountPercentage() float64 {
	if p.ComparePrice <= 0 || p.ComparePrice <= p.Price {
		return 0
	}
	
	return ((p.ComparePrice - p.Price) / p.ComparePrice) * 100
}

func (p *Product) CanPurchase(quantity int) bool {
	if !p.IsAvailable() {
		return false
	}
	
	if !p.TrackQuantity {
		return true
	}
	
	if p.AllowBackorder {
		return true
	}
	
	return p.Quantity >= quantity
}

func (p *Product) ReserveStock(quantity int) error {
	if !p.CanPurchase(quantity) {
		return errors.New("insufficient stock")
	}
	
	if p.TrackQuantity {
		p.Quantity -= quantity
	}
	
	return nil
}

func (p *Product) RestoreStock(quantity int) {
	if p.TrackQuantity {
		p.Quantity += quantity
	}
}

func (p *Product) calculateComputedFields() {
	p.IsInStock = p.IsInStockCheck()
	p.IsLowStock = p.IsLowStockCheck()
	p.IsOnSale = p.ComparePrice > 0 && p.ComparePrice > p.Price
	p.SalePrice = p.GetFinalPrice()
}

// Helper function to generate slug
func generateSlug(name string) string {
	// This is a simplified slug generation
	// In a real implementation, you'd want to use a proper slug library
	return strings.ToLower(strings.ReplaceAll(name, " ", "-"))
}

// Table names
func (Product) TableName() string {
	return "products"
}

func (ProductImage) TableName() string {
	return "product_images"
}

func (ProductVariant) TableName() string {
	return "product_variants"
}

func (VariantOption) TableName() string {
	return "variant_options"
}

func (ProductAttribute) TableName() string {
	return "product_attributes"
}

func (ProductTag) TableName() string {
	return "product_tags"
}

func (Category) TableName() string {
	return "categories"
}

func (ProductReview) TableName() string {
	return "product_reviews"
}

package entities

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Product represents a product in the e-commerce system
type Product struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	SKU         string    `json:"sku" gorm:"uniqueIndex;not null"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	ShortDesc   string    `json:"short_description"`
	
	// Pricing
	Price         float64 `json:"price" gorm:"not null"`
	ComparePrice  float64 `json:"compare_price"`
	CostPrice     float64 `json:"cost_price"`
	
	// Inventory
	StockQuantity int  `json:"stock_quantity" gorm:"default:0"`
	TrackStock    bool `json:"track_stock" gorm:"default:true"`
	AllowBackorder bool `json:"allow_backorder" gorm:"default:false"`
	
	// Physical properties
	Weight     float64 `json:"weight"`
	Length     float64 `json:"length"`
	Width      float64 `json:"width"`
	Height     float64 `json:"height"`
	
	// SEO and metadata
	Slug        string            `json:"slug" gorm:"uniqueIndex"`
	MetaTitle   string            `json:"meta_title"`
	MetaDesc    string            `json:"meta_description"`
	Tags        []string          `json:"tags" gorm:"type:text[]"`
	Attributes  map[string]string `json:"attributes" gorm:"type:jsonb"`
	
	// Status and visibility
	Status      ProductStatus `json:"status" gorm:"default:1"`
	Visibility  Visibility    `json:"visibility" gorm:"default:1"`
	Featured    bool          `json:"featured" gorm:"default:false"`
	
	// Relationships
	CategoryID  uuid.UUID `json:"category_id" gorm:"type:uuid"`
	Category    *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	BrandID     *uuid.UUID `json:"brand_id" gorm:"type:uuid"`
	Brand       *Brand     `json:"brand,omitempty" gorm:"foreignKey:BrandID"`
	
	// Media
	Images      []ProductImage `json:"images,omitempty" gorm:"foreignKey:ProductID"`
	Videos      []ProductVideo `json:"videos,omitempty" gorm:"foreignKey:ProductID"`
	
	// Variants
	HasVariants bool             `json:"has_variants" gorm:"default:false"`
	Variants    []ProductVariant `json:"variants,omitempty" gorm:"foreignKey:ProductID"`
	
	// Reviews and ratings
	ReviewCount   int     `json:"review_count" gorm:"default:0"`
	AverageRating float64 `json:"average_rating" gorm:"default:0"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
}

// ProductStatus represents the status of a product
type ProductStatus int

const (
	ProductStatusDraft ProductStatus = iota
	ProductStatusActive
	ProductStatusInactive
	ProductStatusArchived
)

// Visibility represents product visibility
type Visibility int

const (
	VisibilityHidden Visibility = iota
	VisibilityVisible
	VisibilityFeatured
)

// NewProduct creates a new product
func NewProduct(sku, name, description string, price float64, categoryID uuid.UUID) (*Product, error) {
	if strings.TrimSpace(sku) == "" {
		return nil, errors.New("SKU is required")
	}
	
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("product name is required")
	}
	
	if price < 0 {
		return nil, errors.New("price cannot be negative")
	}
	
	if categoryID == uuid.Nil {
		return nil, errors.New("category ID is required")
	}
	
	product := &Product{
		ID:          uuid.New(),
		SKU:         strings.TrimSpace(sku),
		Name:        strings.TrimSpace(name),
		Description: strings.TrimSpace(description),
		Price:       price,
		CategoryID:  categoryID,
		Status:      ProductStatusDraft,
		Visibility:  VisibilityHidden,
		TrackStock:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// Generate slug from name
	product.Slug = generateSlug(name)
	
	return product, nil
}

// UpdateBasicInfo updates basic product information
func (p *Product) UpdateBasicInfo(name, description, shortDesc string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("product name is required")
	}
	
	p.Name = strings.TrimSpace(name)
	p.Description = strings.TrimSpace(description)
	p.ShortDesc = strings.TrimSpace(shortDesc)
	p.UpdatedAt = time.Now()
	
	// Update slug if name changed
	newSlug := generateSlug(name)
	if newSlug != p.Slug {
		p.Slug = newSlug
	}
	
	return nil
}

// UpdatePricing updates product pricing
func (p *Product) UpdatePricing(price, comparePrice, costPrice float64) error {
	if price < 0 {
		return errors.New("price cannot be negative")
	}
	
	if comparePrice < 0 {
		return errors.New("compare price cannot be negative")
	}
	
	if costPrice < 0 {
		return errors.New("cost price cannot be negative")
	}
	
	p.Price = price
	p.ComparePrice = comparePrice
	p.CostPrice = costPrice
	p.UpdatedAt = time.Now()
	
	return nil
}

// UpdateInventory updates inventory settings
func (p *Product) UpdateInventory(stockQuantity int, trackStock, allowBackorder bool) error {
	if stockQuantity < 0 {
		return errors.New("stock quantity cannot be negative")
	}
	
	p.StockQuantity = stockQuantity
	p.TrackStock = trackStock
	p.AllowBackorder = allowBackorder
	p.UpdatedAt = time.Now()
	
	return nil
}

// UpdatePhysicalProperties updates physical properties
func (p *Product) UpdatePhysicalProperties(weight, length, width, height float64) error {
	if weight < 0 || length < 0 || width < 0 || height < 0 {
		return errors.New("physical properties cannot be negative")
	}
	
	p.Weight = weight
	p.Length = length
	p.Width = width
	p.Height = height
	p.UpdatedAt = time.Now()
	
	return nil
}

// UpdateSEO updates SEO information
func (p *Product) UpdateSEO(metaTitle, metaDesc string, tags []string) {
	p.MetaTitle = strings.TrimSpace(metaTitle)
	p.MetaDesc = strings.TrimSpace(metaDesc)
	p.Tags = tags
	p.UpdatedAt = time.Now()
}

// SetStatus updates product status
func (p *Product) SetStatus(status ProductStatus) {
	p.Status = status
	p.UpdatedAt = time.Now()
}

// SetVisibility updates product visibility
func (p *Product) SetVisibility(visibility Visibility) {
	p.Visibility = visibility
	p.UpdatedAt = time.Now()
}

// SetFeatured sets product as featured or not
func (p *Product) SetFeatured(featured bool) {
	p.Featured = featured
	p.UpdatedAt = time.Now()
}

// SetCategory updates product category
func (p *Product) SetCategory(categoryID uuid.UUID) error {
	if categoryID == uuid.Nil {
		return errors.New("category ID is required")
	}
	
	p.CategoryID = categoryID
	p.UpdatedAt = time.Now()
	
	return nil
}

// SetBrand updates product brand
func (p *Product) SetBrand(brandID *uuid.UUID) {
	p.BrandID = brandID
	p.UpdatedAt = time.Now()
}

// AddAttribute adds or updates a product attribute
func (p *Product) AddAttribute(key, value string) {
	if p.Attributes == nil {
		p.Attributes = make(map[string]string)
	}
	
	p.Attributes[key] = value
	p.UpdatedAt = time.Now()
}

// RemoveAttribute removes a product attribute
func (p *Product) RemoveAttribute(key string) {
	if p.Attributes != nil {
		delete(p.Attributes, key)
		p.UpdatedAt = time.Now()
	}
}

// IsAvailable checks if product is available for purchase
func (p *Product) IsAvailable() bool {
	if p.Status != ProductStatusActive {
		return false
	}
	
	if p.Visibility == VisibilityHidden {
		return false
	}
	
	if p.TrackStock && p.StockQuantity <= 0 && !p.AllowBackorder {
		return false
	}
	
	return true
}

// IsInStock checks if product is in stock
func (p *Product) IsInStock() bool {
	if !p.TrackStock {
		return true
	}
	
	return p.StockQuantity > 0
}

// CanPurchase checks if product can be purchased with given quantity
func (p *Product) CanPurchase(quantity int) bool {
	if !p.IsAvailable() {
		return false
	}
	
	if !p.TrackStock {
		return true
	}
	
	if p.StockQuantity >= quantity {
		return true
	}
	
	return p.AllowBackorder
}

// DeductStock deducts stock quantity
func (p *Product) DeductStock(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	if !p.TrackStock {
		return nil
	}
	
	if p.StockQuantity < quantity && !p.AllowBackorder {
		return errors.New("insufficient stock")
	}
	
	p.StockQuantity -= quantity
	p.UpdatedAt = time.Now()
	
	return nil
}

// AddStock adds stock quantity
func (p *Product) AddStock(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	p.StockQuantity += quantity
	p.UpdatedAt = time.Now()
	
	return nil
}

// UpdateRating updates product rating
func (p *Product) UpdateRating(averageRating float64, reviewCount int) error {
	if averageRating < 0 || averageRating > 5 {
		return errors.New("average rating must be between 0 and 5")
	}
	
	if reviewCount < 0 {
		return errors.New("review count cannot be negative")
	}
	
	p.AverageRating = averageRating
	p.ReviewCount = reviewCount
	p.UpdatedAt = time.Now()
	
	return nil
}

// GetDiscountPercentage calculates discount percentage
func (p *Product) GetDiscountPercentage() float64 {
	if p.ComparePrice <= 0 || p.Price >= p.ComparePrice {
		return 0
	}
	
	return ((p.ComparePrice - p.Price) / p.ComparePrice) * 100
}

// GetProfitMargin calculates profit margin
func (p *Product) GetProfitMargin() float64 {
	if p.CostPrice <= 0 {
		return 0
	}
	
	return ((p.Price - p.CostPrice) / p.Price) * 100
}

// generateSlug generates URL-friendly slug from name
func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	
	// Remove special characters (basic implementation)
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	
	return result.String()
}

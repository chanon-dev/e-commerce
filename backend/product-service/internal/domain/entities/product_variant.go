package entities

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ProductVariant represents a product variant (e.g., different sizes, colors)
type ProductVariant struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	ProductID uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	Product   *Product  `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	
	// Variant identification
	SKU     string `json:"sku" gorm:"uniqueIndex;not null"`
	Barcode string `json:"barcode" gorm:"uniqueIndex"`
	
	// Variant attributes (e.g., Size: "L", Color: "Red")
	Attributes map[string]string `json:"attributes" gorm:"type:jsonb"`
	
	// Pricing (can override product pricing)
	Price        *float64 `json:"price"`         // If nil, uses product price
	ComparePrice *float64 `json:"compare_price"` // If nil, uses product compare price
	CostPrice    *float64 `json:"cost_price"`    // If nil, uses product cost price
	
	// Inventory
	StockQuantity  int  `json:"stock_quantity" gorm:"default:0"`
	TrackStock     bool `json:"track_stock" gorm:"default:true"`
	AllowBackorder bool `json:"allow_backorder" gorm:"default:false"`
	
	// Physical properties (can override product properties)
	Weight *float64 `json:"weight"`
	Length *float64 `json:"length"`
	Width  *float64 `json:"width"`
	Height *float64 `json:"height"`
	
	// Media
	Images []ProductImage `json:"images,omitempty" gorm:"foreignKey:VariantID"`
	
	// Status
	IsActive bool `json:"is_active" gorm:"default:true"`
	IsDefault bool `json:"is_default" gorm:"default:false"`
	
	// Display
	SortOrder int `json:"sort_order" gorm:"default:0"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
}

// NewProductVariant creates a new product variant
func NewProductVariant(productID uuid.UUID, sku string, attributes map[string]string) (*ProductVariant, error) {
	if productID == uuid.Nil {
		return nil, errors.New("product ID is required")
	}
	
	if strings.TrimSpace(sku) == "" {
		return nil, errors.New("SKU is required")
	}
	
	if len(attributes) == 0 {
		return nil, errors.New("variant attributes are required")
	}
	
	variant := &ProductVariant{
		ID:         uuid.New(),
		ProductID:  productID,
		SKU:        strings.TrimSpace(sku),
		Attributes: attributes,
		TrackStock: true,
		IsActive:   true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	
	return variant, nil
}

// UpdateBasicInfo updates basic variant information
func (v *ProductVariant) UpdateBasicInfo(sku, barcode string, attributes map[string]string) error {
	if strings.TrimSpace(sku) == "" {
		return errors.New("SKU is required")
	}
	
	if len(attributes) == 0 {
		return errors.New("variant attributes are required")
	}
	
	v.SKU = strings.TrimSpace(sku)
	v.Barcode = strings.TrimSpace(barcode)
	v.Attributes = attributes
	v.UpdatedAt = time.Now()
	
	return nil
}

// UpdatePricing updates variant pricing
func (v *ProductVariant) UpdatePricing(price, comparePrice, costPrice *float64) error {
	if price != nil && *price < 0 {
		return errors.New("price cannot be negative")
	}
	
	if comparePrice != nil && *comparePrice < 0 {
		return errors.New("compare price cannot be negative")
	}
	
	if costPrice != nil && *costPrice < 0 {
		return errors.New("cost price cannot be negative")
	}
	
	v.Price = price
	v.ComparePrice = comparePrice
	v.CostPrice = costPrice
	v.UpdatedAt = time.Now()
	
	return nil
}

// UpdateInventory updates inventory settings
func (v *ProductVariant) UpdateInventory(stockQuantity int, trackStock, allowBackorder bool) error {
	if stockQuantity < 0 {
		return errors.New("stock quantity cannot be negative")
	}
	
	v.StockQuantity = stockQuantity
	v.TrackStock = trackStock
	v.AllowBackorder = allowBackorder
	v.UpdatedAt = time.Now()
	
	return nil
}

// UpdatePhysicalProperties updates physical properties
func (v *ProductVariant) UpdatePhysicalProperties(weight, length, width, height *float64) error {
	if weight != nil && *weight < 0 {
		return errors.New("weight cannot be negative")
	}
	if length != nil && *length < 0 {
		return errors.New("length cannot be negative")
	}
	if width != nil && *width < 0 {
		return errors.New("width cannot be negative")
	}
	if height != nil && *height < 0 {
		return errors.New("height cannot be negative")
	}
	
	v.Weight = weight
	v.Length = length
	v.Width = width
	v.Height = height
	v.UpdatedAt = time.Now()
	
	return nil
}

// SetActive sets variant active status
func (v *ProductVariant) SetActive(active bool) {
	v.IsActive = active
	v.UpdatedAt = time.Now()
}

// SetDefault sets variant as default
func (v *ProductVariant) SetDefault(isDefault bool) {
	v.IsDefault = isDefault
	v.UpdatedAt = time.Now()
}

// SetSortOrder sets variant sort order
func (v *ProductVariant) SetSortOrder(sortOrder int) {
	v.SortOrder = sortOrder
	v.UpdatedAt = time.Now()
}

// GetEffectivePrice returns the effective price (variant price or product price)
func (v *ProductVariant) GetEffectivePrice(productPrice float64) float64 {
	if v.Price != nil {
		return *v.Price
	}
	return productPrice
}

// GetEffectiveComparePrice returns the effective compare price
func (v *ProductVariant) GetEffectiveComparePrice(productComparePrice float64) float64 {
	if v.ComparePrice != nil {
		return *v.ComparePrice
	}
	return productComparePrice
}

// GetEffectiveCostPrice returns the effective cost price
func (v *ProductVariant) GetEffectiveCostPrice(productCostPrice float64) float64 {
	if v.CostPrice != nil {
		return *v.CostPrice
	}
	return productCostPrice
}

// GetEffectiveWeight returns the effective weight
func (v *ProductVariant) GetEffectiveWeight(productWeight float64) float64 {
	if v.Weight != nil {
		return *v.Weight
	}
	return productWeight
}

// IsInStock checks if variant is in stock
func (v *ProductVariant) IsInStock() bool {
	if !v.TrackStock {
		return true
	}
	return v.StockQuantity > 0
}

// CanPurchase checks if variant can be purchased with given quantity
func (v *ProductVariant) CanPurchase(quantity int) bool {
	if !v.IsActive {
		return false
	}
	
	if !v.TrackStock {
		return true
	}
	
	if v.StockQuantity >= quantity {
		return true
	}
	
	return v.AllowBackorder
}

// DeductStock deducts stock quantity
func (v *ProductVariant) DeductStock(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	if !v.TrackStock {
		return nil
	}
	
	if v.StockQuantity < quantity && !v.AllowBackorder {
		return errors.New("insufficient stock")
	}
	
	v.StockQuantity -= quantity
	v.UpdatedAt = time.Now()
	
	return nil
}

// AddStock adds stock quantity
func (v *ProductVariant) AddStock(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	v.StockQuantity += quantity
	v.UpdatedAt = time.Now()
	
	return nil
}

// GetAttributeValue gets attribute value by key
func (v *ProductVariant) GetAttributeValue(key string) (string, bool) {
	if v.Attributes == nil {
		return "", false
	}
	
	value, exists := v.Attributes[key]
	return value, exists
}

// SetAttributeValue sets attribute value
func (v *ProductVariant) SetAttributeValue(key, value string) {
	if v.Attributes == nil {
		v.Attributes = make(map[string]string)
	}
	
	v.Attributes[key] = value
	v.UpdatedAt = time.Now()
}

// RemoveAttribute removes an attribute
func (v *ProductVariant) RemoveAttribute(key string) {
	if v.Attributes != nil {
		delete(v.Attributes, key)
		v.UpdatedAt = time.Now()
	}
}

// GetDisplayName generates a display name for the variant
func (v *ProductVariant) GetDisplayName() string {
	if len(v.Attributes) == 0 {
		return "Default"
	}
	
	var parts []string
	for key, value := range v.Attributes {
		parts = append(parts, key+": "+value)
	}
	
	return strings.Join(parts, ", ")
}

// ProductImage represents a product or variant image
type ProductImage struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	ProductID *uuid.UUID `json:"product_id" gorm:"type:uuid"`
	VariantID *uuid.UUID `json:"variant_id" gorm:"type:uuid"`
	
	// Image details
	URL         string `json:"url" gorm:"not null"`
	AltText     string `json:"alt_text"`
	Title       string `json:"title"`
	Description string `json:"description"`
	
	// Image properties
	Width    int    `json:"width"`
	Height   int    `json:"height"`
	FileSize int64  `json:"file_size"`
	MimeType string `json:"mime_type"`
	
	// Display
	SortOrder int  `json:"sort_order" gorm:"default:0"`
	IsPrimary bool `json:"is_primary" gorm:"default:false"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
}

// NewProductImage creates a new product image
func NewProductImage(url, altText string, productID *uuid.UUID, variantID *uuid.UUID) (*ProductImage, error) {
	if strings.TrimSpace(url) == "" {
		return nil, errors.New("image URL is required")
	}
	
	if productID == nil && variantID == nil {
		return nil, errors.New("either product ID or variant ID is required")
	}
	
	image := &ProductImage{
		ID:        uuid.New(),
		ProductID: productID,
		VariantID: variantID,
		URL:       strings.TrimSpace(url),
		AltText:   strings.TrimSpace(altText),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	return image, nil
}

// UpdateInfo updates image information
func (i *ProductImage) UpdateInfo(url, altText, title, description string) error {
	if strings.TrimSpace(url) == "" {
		return errors.New("image URL is required")
	}
	
	i.URL = strings.TrimSpace(url)
	i.AltText = strings.TrimSpace(altText)
	i.Title = strings.TrimSpace(title)
	i.Description = strings.TrimSpace(description)
	i.UpdatedAt = time.Now()
	
	return nil
}

// UpdateProperties updates image properties
func (i *ProductImage) UpdateProperties(width, height int, fileSize int64, mimeType string) {
	i.Width = width
	i.Height = height
	i.FileSize = fileSize
	i.MimeType = strings.TrimSpace(mimeType)
	i.UpdatedAt = time.Now()
}

// SetPrimary sets image as primary
func (i *ProductImage) SetPrimary(isPrimary bool) {
	i.IsPrimary = isPrimary
	i.UpdatedAt = time.Now()
}

// SetSortOrder sets image sort order
func (i *ProductImage) SetSortOrder(sortOrder int) {
	i.SortOrder = sortOrder
	i.UpdatedAt = time.Now()
}

// ProductVideo represents a product video
type ProductVideo struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	ProductID uuid.UUID  `json:"product_id" gorm:"type:uuid;not null"`
	Product   *Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	
	// Video details
	URL         string `json:"url" gorm:"not null"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ThumbnailURL string `json:"thumbnail_url"`
	
	// Video properties
	Duration int    `json:"duration"` // in seconds
	FileSize int64  `json:"file_size"`
	MimeType string `json:"mime_type"`
	
	// Video type
	Type VideoType `json:"type" gorm:"default:1"` // YouTube, Vimeo, Direct, etc.
	
	// Display
	SortOrder int `json:"sort_order" gorm:"default:0"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
}

// VideoType represents video type
type VideoType int

const (
	VideoTypeDirect VideoType = iota + 1
	VideoTypeYouTube
	VideoTypeVimeo
	VideoTypeOther
)

// NewProductVideo creates a new product video
func NewProductVideo(productID uuid.UUID, url, title string, videoType VideoType) (*ProductVideo, error) {
	if productID == uuid.Nil {
		return nil, errors.New("product ID is required")
	}
	
	if strings.TrimSpace(url) == "" {
		return nil, errors.New("video URL is required")
	}
	
	video := &ProductVideo{
		ID:        uuid.New(),
		ProductID: productID,
		URL:       strings.TrimSpace(url),
		Title:     strings.TrimSpace(title),
		Type:      videoType,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	return video, nil
}

// UpdateInfo updates video information
func (v *ProductVideo) UpdateInfo(url, title, description, thumbnailURL string) error {
	if strings.TrimSpace(url) == "" {
		return errors.New("video URL is required")
	}
	
	v.URL = strings.TrimSpace(url)
	v.Title = strings.TrimSpace(title)
	v.Description = strings.TrimSpace(description)
	v.ThumbnailURL = strings.TrimSpace(thumbnailURL)
	v.UpdatedAt = time.Now()
	
	return nil
}

// UpdateProperties updates video properties
func (v *ProductVideo) UpdateProperties(duration int, fileSize int64, mimeType string) {
	v.Duration = duration
	v.FileSize = fileSize
	v.MimeType = strings.TrimSpace(mimeType)
	v.UpdatedAt = time.Now()
}

// SetSortOrder sets video sort order
func (v *ProductVideo) SetSortOrder(sortOrder int) {
	v.SortOrder = sortOrder
	v.UpdatedAt = time.Now()
}

package entities

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Category represents a product category
type Category struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Slug        string    `json:"slug" gorm:"uniqueIndex;not null"`
	
	// Hierarchy
	ParentID *uuid.UUID  `json:"parent_id" gorm:"type:uuid"`
	Parent   *Category   `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Category  `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Level    int         `json:"level" gorm:"default:0"`
	Path     string      `json:"path"` // e.g., "electronics/computers/laptops"
	
	// Display
	ImageURL    string `json:"image_url"`
	IconURL     string `json:"icon_url"`
	Color       string `json:"color"`
	SortOrder   int    `json:"sort_order" gorm:"default:0"`
	
	// SEO
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	
	// Status
	IsActive  bool `json:"is_active" gorm:"default:true"`
	IsVisible bool `json:"is_visible" gorm:"default:true"`
	
	// Statistics
	ProductCount int `json:"product_count" gorm:"default:0"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
	
	// Relationships
	Products []Product `json:"products,omitempty" gorm:"foreignKey:CategoryID"`
}

// NewCategory creates a new category
func NewCategory(name, description string, parentID *uuid.UUID) (*Category, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("category name is required")
	}
	
	category := &Category{
		ID:          uuid.New(),
		Name:        strings.TrimSpace(name),
		Description: strings.TrimSpace(description),
		ParentID:    parentID,
		IsActive:    true,
		IsVisible:   true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// Generate slug
	category.Slug = generateSlug(name)
	
	// Set level based on parent
	if parentID != nil {
		category.Level = 1 // Will be updated when parent is loaded
	} else {
		category.Level = 0
	}
	
	return category, nil
}

// UpdateBasicInfo updates basic category information
func (c *Category) UpdateBasicInfo(name, description string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("category name is required")
	}
	
	c.Name = strings.TrimSpace(name)
	c.Description = strings.TrimSpace(description)
	c.UpdatedAt = time.Now()
	
	// Update slug if name changed
	newSlug := generateSlug(name)
	if newSlug != c.Slug {
		c.Slug = newSlug
	}
	
	return nil
}

// UpdateDisplay updates display properties
func (c *Category) UpdateDisplay(imageURL, iconURL, color string, sortOrder int) {
	c.ImageURL = strings.TrimSpace(imageURL)
	c.IconURL = strings.TrimSpace(iconURL)
	c.Color = strings.TrimSpace(color)
	c.SortOrder = sortOrder
	c.UpdatedAt = time.Now()
}

// UpdateSEO updates SEO information
func (c *Category) UpdateSEO(metaTitle, metaDescription string) {
	c.MetaTitle = strings.TrimSpace(metaTitle)
	c.MetaDescription = strings.TrimSpace(metaDescription)
	c.UpdatedAt = time.Now()
}

// SetParent sets the parent category
func (c *Category) SetParent(parentID *uuid.UUID, parentLevel int) error {
	// Prevent circular reference
	if parentID != nil && *parentID == c.ID {
		return errors.New("category cannot be its own parent")
	}
	
	c.ParentID = parentID
	
	if parentID != nil {
		c.Level = parentLevel + 1
	} else {
		c.Level = 0
	}
	
	c.UpdatedAt = time.Now()
	
	return nil
}

// UpdatePath updates the category path
func (c *Category) UpdatePath(parentPath string) {
	if parentPath == "" {
		c.Path = c.Slug
	} else {
		c.Path = parentPath + "/" + c.Slug
	}
	c.UpdatedAt = time.Now()
}

// SetActive sets category active status
func (c *Category) SetActive(active bool) {
	c.IsActive = active
	c.UpdatedAt = time.Now()
}

// SetVisible sets category visibility
func (c *Category) SetVisible(visible bool) {
	c.IsVisible = visible
	c.UpdatedAt = time.Now()
}

// UpdateProductCount updates the product count
func (c *Category) UpdateProductCount(count int) {
	if count < 0 {
		count = 0
	}
	c.ProductCount = count
	c.UpdatedAt = time.Now()
}

// IncrementProductCount increments product count
func (c *Category) IncrementProductCount() {
	c.ProductCount++
	c.UpdatedAt = time.Now()
}

// DecrementProductCount decrements product count
func (c *Category) DecrementProductCount() {
	if c.ProductCount > 0 {
		c.ProductCount--
	}
	c.UpdatedAt = time.Now()
}

// IsRoot checks if category is a root category
func (c *Category) IsRoot() bool {
	return c.ParentID == nil
}

// IsLeaf checks if category is a leaf category (has no children)
func (c *Category) IsLeaf() bool {
	return len(c.Children) == 0
}

// HasProducts checks if category has products
func (c *Category) HasProducts() bool {
	return c.ProductCount > 0
}

// CanDelete checks if category can be deleted
func (c *Category) CanDelete() bool {
	return c.ProductCount == 0 && len(c.Children) == 0
}

// GetBreadcrumb returns breadcrumb path
func (c *Category) GetBreadcrumb() []string {
	if c.Path == "" {
		return []string{c.Name}
	}
	
	parts := strings.Split(c.Path, "/")
	breadcrumb := make([]string, len(parts))
	
	// This would need to be populated with actual category names
	// For now, just return the path parts
	copy(breadcrumb, parts)
	
	return breadcrumb
}

// GetFullPath returns full category path with names
func (c *Category) GetFullPath() string {
	return c.Path
}

// Brand represents a product brand
type Brand struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Name        string    `json:"name" gorm:"not null;uniqueIndex"`
	Description string    `json:"description"`
	Slug        string    `json:"slug" gorm:"uniqueIndex;not null"`
	
	// Display
	LogoURL   string `json:"logo_url"`
	Website   string `json:"website"`
	SortOrder int    `json:"sort_order" gorm:"default:0"`
	
	// SEO
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	
	// Status
	IsActive  bool `json:"is_active" gorm:"default:true"`
	IsVisible bool `json:"is_visible" gorm:"default:true"`
	
	// Statistics
	ProductCount int `json:"product_count" gorm:"default:0"`
	
	// Timestamps
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedBy string     `json:"created_by"`
	UpdatedBy string     `json:"updated_by"`
	
	// Relationships
	Products []Product `json:"products,omitempty" gorm:"foreignKey:BrandID"`
}

// NewBrand creates a new brand
func NewBrand(name, description string) (*Brand, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("brand name is required")
	}
	
	brand := &Brand{
		ID:          uuid.New(),
		Name:        strings.TrimSpace(name),
		Description: strings.TrimSpace(description),
		IsActive:    true,
		IsVisible:   true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// Generate slug
	brand.Slug = generateSlug(name)
	
	return brand, nil
}

// UpdateBasicInfo updates basic brand information
func (b *Brand) UpdateBasicInfo(name, description string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("brand name is required")
	}
	
	b.Name = strings.TrimSpace(name)
	b.Description = strings.TrimSpace(description)
	b.UpdatedAt = time.Now()
	
	// Update slug if name changed
	newSlug := generateSlug(name)
	if newSlug != b.Slug {
		b.Slug = newSlug
	}
	
	return nil
}

// UpdateDisplay updates display properties
func (b *Brand) UpdateDisplay(logoURL, website string, sortOrder int) {
	b.LogoURL = strings.TrimSpace(logoURL)
	b.Website = strings.TrimSpace(website)
	b.SortOrder = sortOrder
	b.UpdatedAt = time.Now()
}

// UpdateSEO updates SEO information
func (b *Brand) UpdateSEO(metaTitle, metaDescription string) {
	b.MetaTitle = strings.TrimSpace(metaTitle)
	b.MetaDescription = strings.TrimSpace(metaDescription)
	b.UpdatedAt = time.Now()
}

// SetActive sets brand active status
func (b *Brand) SetActive(active bool) {
	b.IsActive = active
	b.UpdatedAt = time.Now()
}

// SetVisible sets brand visibility
func (b *Brand) SetVisible(visible bool) {
	b.IsVisible = visible
	b.UpdatedAt = time.Now()
}

// UpdateProductCount updates the product count
func (b *Brand) UpdateProductCount(count int) {
	if count < 0 {
		count = 0
	}
	b.ProductCount = count
	b.UpdatedAt = time.Now()
}

// IncrementProductCount increments product count
func (b *Brand) IncrementProductCount() {
	b.ProductCount++
	b.UpdatedAt = time.Now()
}

// DecrementProductCount decrements product count
func (b *Brand) DecrementProductCount() {
	if b.ProductCount > 0 {
		b.ProductCount--
	}
	b.UpdatedAt = time.Now()
}

// HasProducts checks if brand has products
func (b *Brand) HasProducts() bool {
	return b.ProductCount > 0
}

// CanDelete checks if brand can be deleted
func (b *Brand) CanDelete() bool {
	return b.ProductCount == 0
}

package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string         `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description string         `json:"description" gorm:"type:text"`
	SKU         string         `json:"sku" gorm:"unique;not null;size:100" validate:"required"`
	Price       float64        `json:"price" gorm:"not null" validate:"required,gt=0"`
	ComparePrice *float64      `json:"compare_price,omitempty" gorm:"default:null"`
	CostPrice   *float64       `json:"cost_price,omitempty" gorm:"default:null"`
	CategoryID  uuid.UUID      `json:"category_id" gorm:"type:uuid;not null" validate:"required"`
	Category    Category       `json:"category" gorm:"foreignKey:CategoryID"`
	Brand       string         `json:"brand" gorm:"size:100"`
	Weight      *float64       `json:"weight,omitempty"`
	Dimensions  *Dimensions    `json:"dimensions,omitempty" gorm:"embedded"`
	Images      []ProductImage `json:"images" gorm:"foreignKey:ProductID"`
	Tags        []ProductTag   `json:"tags" gorm:"many2many:product_tags;"`
	Status      ProductStatus  `json:"status" gorm:"default:'draft'"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	IsFeatured  bool           `json:"is_featured" gorm:"default:false"`
	SEO         *SEO           `json:"seo,omitempty" gorm:"embedded"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type Dimensions struct {
	Length float64 `json:"length"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	Unit   string  `json:"unit" gorm:"default:'cm'"`
}

type SEO struct {
	Title       string `json:"title" gorm:"size:255"`
	Description string `json:"description" gorm:"size:500"`
	Keywords    string `json:"keywords" gorm:"size:500"`
}

type ProductStatus string

const (
	ProductStatusDraft     ProductStatus = "draft"
	ProductStatusActive    ProductStatus = "active"
	ProductStatusInactive  ProductStatus = "inactive"
	ProductStatusArchived  ProductStatus = "archived"
)

type ProductImage struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	URL       string    `json:"url" gorm:"not null"`
	AltText   string    `json:"alt_text"`
	Position  int       `json:"position" gorm:"default:0"`
	IsMain    bool      `json:"is_main" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProductTag struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"unique;not null;size:100"`
	Slug      string    `json:"slug" gorm:"unique;not null;size:100"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Category struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string         `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Slug        string         `json:"slug" gorm:"unique;not null;size:255"`
	Description string         `json:"description" gorm:"type:text"`
	Image       string         `json:"image"`
	ParentID    *uuid.UUID     `json:"parent_id,omitempty" gorm:"type:uuid"`
	Parent      *Category      `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []Category     `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Position    int            `json:"position" gorm:"default:0"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	SEO         *SEO           `json:"seo,omitempty" gorm:"embedded"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// ProductSearchDocument represents the Elasticsearch document structure
type ProductSearchDocument struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	SKU         string    `json:"sku"`
	Price       float64   `json:"price"`
	CategoryID  string    `json:"category_id"`
	Category    string    `json:"category"`
	Brand       string    `json:"brand"`
	Tags        []string  `json:"tags"`
	Status      string    `json:"status"`
	IsActive    bool      `json:"is_active"`
	IsFeatured  bool      `json:"is_featured"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BeforeCreate hook
func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// BeforeCreate hook for Category
func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

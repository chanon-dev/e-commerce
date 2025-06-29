package repositories

import (
	"context"

	"github.com/google/uuid"
	"product-service/internal/domain/entities"
)

// ProductRepository defines the interface for product data access
type ProductRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, product *entities.Product) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.Product, error)
	GetBySKU(ctx context.Context, sku string) (*entities.Product, error)
	GetBySlug(ctx context.Context, slug string) (*entities.Product, error)
	Update(ctx context.Context, product *entities.Product) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Bulk operations
	GetByIDs(ctx context.Context, ids []uuid.UUID) ([]*entities.Product, error)
	GetBySKUs(ctx context.Context, skus []string) ([]*entities.Product, error)
	
	// Listing and pagination
	GetAll(ctx context.Context, limit, offset int) ([]*entities.Product, error)
	GetByCategory(ctx context.Context, categoryID uuid.UUID, limit, offset int) ([]*entities.Product, error)
	GetByBrand(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*entities.Product, error)
	GetByStatus(ctx context.Context, status entities.ProductStatus, limit, offset int) ([]*entities.Product, error)
	GetFeatured(ctx context.Context, limit, offset int) ([]*entities.Product, error)
	
	// Search and filtering
	Search(ctx context.Context, query string, filters *ProductFilters, limit, offset int) ([]*entities.Product, error)
	GetByPriceRange(ctx context.Context, minPrice, maxPrice float64, limit, offset int) ([]*entities.Product, error)
	GetByTags(ctx context.Context, tags []string, limit, offset int) ([]*entities.Product, error)
	
	// Stock management
	GetLowStock(ctx context.Context, threshold int, limit, offset int) ([]*entities.Product, error)
	GetOutOfStock(ctx context.Context, limit, offset int) ([]*entities.Product, error)
	UpdateStock(ctx context.Context, id uuid.UUID, quantity int) error
	BulkUpdateStock(ctx context.Context, updates []StockUpdate) error
	
	// Analytics and reporting
	GetTopSelling(ctx context.Context, limit int, days int) ([]*entities.Product, error)
	GetRecentlyAdded(ctx context.Context, limit int, days int) ([]*entities.Product, error)
	GetMostViewed(ctx context.Context, limit int, days int) ([]*entities.Product, error)
	
	// Counting
	Count(ctx context.Context) (int64, error)
	CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error)
	CountByBrand(ctx context.Context, brandID uuid.UUID) (int64, error)
	CountByStatus(ctx context.Context, status entities.ProductStatus) (int64, error)
	CountSearch(ctx context.Context, query string, filters *ProductFilters) (int64, error)
	
	// Existence checks
	ExistsBySKU(ctx context.Context, sku string) (bool, error)
	ExistsBySlug(ctx context.Context, slug string) (bool, error)
	
	// Related data loading
	LoadWithImages(ctx context.Context, id uuid.UUID) (*entities.Product, error)
	LoadWithVariants(ctx context.Context, id uuid.UUID) (*entities.Product, error)
	LoadWithCategory(ctx context.Context, id uuid.UUID) (*entities.Product, error)
	LoadWithBrand(ctx context.Context, id uuid.UUID) (*entities.Product, error)
	LoadComplete(ctx context.Context, id uuid.UUID) (*entities.Product, error)
}

// CategoryRepository defines the interface for category data access
type CategoryRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, category *entities.Category) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.Category, error)
	GetBySlug(ctx context.Context, slug string) (*entities.Category, error)
	Update(ctx context.Context, category *entities.Category) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Hierarchy operations
	GetRootCategories(ctx context.Context) ([]*entities.Category, error)
	GetChildren(ctx context.Context, parentID uuid.UUID) ([]*entities.Category, error)
	GetByParent(ctx context.Context, parentID *uuid.UUID) ([]*entities.Category, error)
	GetByLevel(ctx context.Context, level int) ([]*entities.Category, error)
	GetPath(ctx context.Context, id uuid.UUID) ([]*entities.Category, error)
	
	// Listing
	GetAll(ctx context.Context) ([]*entities.Category, error)
	GetActive(ctx context.Context) ([]*entities.Category, error)
	GetVisible(ctx context.Context) ([]*entities.Category, error)
	
	// Tree operations
	GetTree(ctx context.Context) ([]*entities.Category, error)
	GetSubTree(ctx context.Context, rootID uuid.UUID) ([]*entities.Category, error)
	
	// Counting
	Count(ctx context.Context) (int64, error)
	CountByParent(ctx context.Context, parentID *uuid.UUID) (int64, error)
	
	// Existence checks
	ExistsBySlug(ctx context.Context, slug string) (bool, error)
	HasChildren(ctx context.Context, id uuid.UUID) (bool, error)
	HasProducts(ctx context.Context, id uuid.UUID) (bool, error)
	
	// Product count management
	UpdateProductCount(ctx context.Context, id uuid.UUID, count int) error
	IncrementProductCount(ctx context.Context, id uuid.UUID) error
	DecrementProductCount(ctx context.Context, id uuid.UUID) error
}

// BrandRepository defines the interface for brand data access
type BrandRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, brand *entities.Brand) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.Brand, error)
	GetBySlug(ctx context.Context, slug string) (*entities.Brand, error)
	GetByName(ctx context.Context, name string) (*entities.Brand, error)
	Update(ctx context.Context, brand *entities.Brand) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Listing
	GetAll(ctx context.Context) ([]*entities.Brand, error)
	GetActive(ctx context.Context) ([]*entities.Brand, error)
	GetVisible(ctx context.Context) ([]*entities.Brand, error)
	GetPaginated(ctx context.Context, limit, offset int) ([]*entities.Brand, error)
	
	// Counting
	Count(ctx context.Context) (int64, error)
	
	// Existence checks
	ExistsByName(ctx context.Context, name string) (bool, error)
	ExistsBySlug(ctx context.Context, slug string) (bool, error)
	HasProducts(ctx context.Context, id uuid.UUID) (bool, error)
	
	// Product count management
	UpdateProductCount(ctx context.Context, id uuid.UUID, count int) error
	IncrementProductCount(ctx context.Context, id uuid.UUID) error
	DecrementProductCount(ctx context.Context, id uuid.UUID) error
}

// ProductVariantRepository defines the interface for product variant data access
type ProductVariantRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, variant *entities.ProductVariant) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.ProductVariant, error)
	GetBySKU(ctx context.Context, sku string) (*entities.ProductVariant, error)
	Update(ctx context.Context, variant *entities.ProductVariant) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Product-related operations
	GetByProductID(ctx context.Context, productID uuid.UUID) ([]*entities.ProductVariant, error)
	GetActiveByProductID(ctx context.Context, productID uuid.UUID) ([]*entities.ProductVariant, error)
	GetDefaultByProductID(ctx context.Context, productID uuid.UUID) (*entities.ProductVariant, error)
	
	// Bulk operations
	GetByIDs(ctx context.Context, ids []uuid.UUID) ([]*entities.ProductVariant, error)
	GetBySKUs(ctx context.Context, skus []string) ([]*entities.ProductVariant, error)
	CreateBulk(ctx context.Context, variants []*entities.ProductVariant) error
	UpdateBulk(ctx context.Context, variants []*entities.ProductVariant) error
	
	// Stock management
	UpdateStock(ctx context.Context, id uuid.UUID, quantity int) error
	BulkUpdateStock(ctx context.Context, updates []StockUpdate) error
	GetLowStock(ctx context.Context, threshold int) ([]*entities.ProductVariant, error)
	GetOutOfStock(ctx context.Context) ([]*entities.ProductVariant, error)
	
	// Filtering
	GetByAttributes(ctx context.Context, productID uuid.UUID, attributes map[string]string) ([]*entities.ProductVariant, error)
	
	// Counting
	CountByProductID(ctx context.Context, productID uuid.UUID) (int64, error)
	
	// Existence checks
	ExistsBySKU(ctx context.Context, sku string) (bool, error)
	
	// Related data loading
	LoadWithImages(ctx context.Context, id uuid.UUID) (*entities.ProductVariant, error)
	LoadWithProduct(ctx context.Context, id uuid.UUID) (*entities.ProductVariant, error)
}

// ProductImageRepository defines the interface for product image data access
type ProductImageRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, image *entities.ProductImage) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.ProductImage, error)
	Update(ctx context.Context, image *entities.ProductImage) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Product-related operations
	GetByProductID(ctx context.Context, productID uuid.UUID) ([]*entities.ProductImage, error)
	GetByVariantID(ctx context.Context, variantID uuid.UUID) ([]*entities.ProductImage, error)
	GetPrimaryByProductID(ctx context.Context, productID uuid.UUID) (*entities.ProductImage, error)
	GetPrimaryByVariantID(ctx context.Context, variantID uuid.UUID) (*entities.ProductImage, error)
	
	// Bulk operations
	CreateBulk(ctx context.Context, images []*entities.ProductImage) error
	UpdateBulk(ctx context.Context, images []*entities.ProductImage) error
	DeleteByProductID(ctx context.Context, productID uuid.UUID) error
	DeleteByVariantID(ctx context.Context, variantID uuid.UUID) error
	
	// Ordering
	UpdateSortOrder(ctx context.Context, id uuid.UUID, sortOrder int) error
	ReorderImages(ctx context.Context, productID *uuid.UUID, variantID *uuid.UUID, imageIDs []uuid.UUID) error
	
	// Counting
	CountByProductID(ctx context.Context, productID uuid.UUID) (int64, error)
	CountByVariantID(ctx context.Context, variantID uuid.UUID) (int64, error)
}

// ProductVideoRepository defines the interface for product video data access
type ProductVideoRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, video *entities.ProductVideo) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.ProductVideo, error)
	Update(ctx context.Context, video *entities.ProductVideo) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// Product-related operations
	GetByProductID(ctx context.Context, productID uuid.UUID) ([]*entities.ProductVideo, error)
	
	// Bulk operations
	CreateBulk(ctx context.Context, videos []*entities.ProductVideo) error
	UpdateBulk(ctx context.Context, videos []*entities.ProductVideo) error
	DeleteByProductID(ctx context.Context, productID uuid.UUID) error
	
	// Ordering
	UpdateSortOrder(ctx context.Context, id uuid.UUID, sortOrder int) error
	ReorderVideos(ctx context.Context, productID uuid.UUID, videoIDs []uuid.UUID) error
	
	// Counting
	CountByProductID(ctx context.Context, productID uuid.UUID) (int64, error)
}

// Supporting types and structures

// ProductFilters represents search and filter criteria
type ProductFilters struct {
	CategoryIDs []uuid.UUID `json:"category_ids"`
	BrandIDs    []uuid.UUID `json:"brand_ids"`
	MinPrice    *float64    `json:"min_price"`
	MaxPrice    *float64    `json:"max_price"`
	InStock     *bool       `json:"in_stock"`
	Featured    *bool       `json:"featured"`
	Status      *entities.ProductStatus `json:"status"`
	Visibility  *entities.Visibility    `json:"visibility"`
	Tags        []string    `json:"tags"`
	Attributes  map[string]string `json:"attributes"`
	HasVariants *bool       `json:"has_variants"`
	CreatedFrom *string     `json:"created_from"` // ISO date string
	CreatedTo   *string     `json:"created_to"`   // ISO date string
}

// StockUpdate represents a stock update operation
type StockUpdate struct {
	ID       uuid.UUID `json:"id"`
	Quantity int       `json:"quantity"`
	IsVariant bool     `json:"is_variant"` // true for variant, false for product
}

// SortOption represents sorting options
type SortOption struct {
	Field string `json:"field"` // name, price, created_at, updated_at, stock_quantity, etc.
	Order string `json:"order"` // asc, desc
}

// ProductSearchResult represents search results with metadata
type ProductSearchResult struct {
	Products   []*entities.Product `json:"products"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
	HasNext    bool                `json:"has_next"`
	HasPrev    bool                `json:"has_prev"`
}

// CategoryTree represents a category tree structure
type CategoryTree struct {
	Category *entities.Category `json:"category"`
	Children []*CategoryTree    `json:"children"`
	Level    int                `json:"level"`
	Path     []string           `json:"path"`
}

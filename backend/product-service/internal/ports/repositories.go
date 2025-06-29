package ports

import (
	"context"
	"ecommerce-product-service/internal/domain"
)

// Repository interfaces (Ports) - Hexagonal Architecture
// These define the contracts that adapters must implement

// ProductRepository defines the contract for product data access
type ProductRepository interface {
	// Basic CRUD operations
	Save(ctx context.Context, product *domain.Product) error
	FindByID(ctx context.Context, id domain.ProductID) (*domain.Product, error)
	FindBySKU(ctx context.Context, sku string) (*domain.Product, error)
	Update(ctx context.Context, product *domain.Product) error
	Delete(ctx context.Context, id domain.ProductID) error
	
	// Query operations
	FindAll(ctx context.Context, filter ProductFilter) ([]*domain.Product, error)
	FindByCategory(ctx context.Context, categoryID domain.CategoryID, filter ProductFilter) ([]*domain.Product, error)
	FindFeatured(ctx context.Context, limit int) ([]*domain.Product, error)
	Search(ctx context.Context, query string, filter ProductFilter) ([]*domain.Product, error)
	
	// Business queries
	FindLowStock(ctx context.Context, threshold int) ([]*domain.Product, error)
	FindByPriceRange(ctx context.Context, minPrice, maxPrice domain.Money) ([]*domain.Product, error)
	FindByBrand(ctx context.Context, brand string, filter ProductFilter) ([]*domain.Product, error)
	
	// Aggregation queries
	CountByCategory(ctx context.Context, categoryID domain.CategoryID) (int64, error)
	CountByStatus(ctx context.Context, status domain.ProductStatus) (int64, error)
	GetTotalValue(ctx context.Context) (domain.Money, error)
}

// CategoryRepository defines the contract for category data access
type CategoryRepository interface {
	Save(ctx context.Context, category *domain.Category) error
	FindByID(ctx context.Context, id domain.CategoryID) (*domain.Category, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Category, error)
	FindAll(ctx context.Context) ([]*domain.Category, error)
	FindChildren(ctx context.Context, parentID domain.CategoryID) ([]*domain.Category, error)
	FindRoots(ctx context.Context) ([]*domain.Category, error)
	Update(ctx context.Context, category *domain.Category) error
	Delete(ctx context.Context, id domain.CategoryID) error
	
	// Tree operations
	GetCategoryTree(ctx context.Context) ([]*domain.Category, error)
	GetCategoryPath(ctx context.Context, id domain.CategoryID) ([]*domain.Category, error)
}

// SearchRepository defines the contract for search operations (Elasticsearch)
type SearchRepository interface {
	IndexProduct(ctx context.Context, product *domain.Product) error
	UpdateProduct(ctx context.Context, product *domain.Product) error
	DeleteProduct(ctx context.Context, id domain.ProductID) error
	
	Search(ctx context.Context, query SearchQuery) (*SearchResult, error)
	Suggest(ctx context.Context, query string, limit int) ([]string, error)
	
	// Bulk operations
	BulkIndex(ctx context.Context, products []*domain.Product) error
	BulkDelete(ctx context.Context, ids []domain.ProductID) error
	
	// Analytics
	GetSearchAnalytics(ctx context.Context, period string) (*SearchAnalytics, error)
	GetPopularSearchTerms(ctx context.Context, limit int) ([]string, error)
}

// CacheRepository defines the contract for caching operations (Redis)
type CacheRepository interface {
	Set(ctx context.Context, key string, value interface{}, ttl int) error
	Get(ctx context.Context, key string, dest interface{}) error
	Delete(ctx context.Context, key string) error
	DeletePattern(ctx context.Context, pattern string) error
	
	// Product-specific cache operations
	CacheProduct(ctx context.Context, product *domain.Product, ttl int) error
	GetCachedProduct(ctx context.Context, id domain.ProductID) (*domain.Product, error)
	InvalidateProductCache(ctx context.Context, id domain.ProductID) error
	
	// Category cache operations
	CacheCategory(ctx context.Context, category *domain.Category, ttl int) error
	GetCachedCategory(ctx context.Context, id domain.CategoryID) (*domain.Category, error)
	InvalidateCategoryCache(ctx context.Context, id domain.CategoryID) error
	
	// Search cache operations
	CacheSearchResult(ctx context.Context, query string, result *SearchResult, ttl int) error
	GetCachedSearchResult(ctx context.Context, query string) (*SearchResult, error)
}

// EventPublisher defines the contract for publishing domain events
type EventPublisher interface {
	PublishProductEvent(ctx context.Context, event domain.ProductEvent) error
	PublishCategoryEvent(ctx context.Context, event domain.CategoryEvent) error
}

// Filter and query types
type ProductFilter struct {
	Page       int
	Limit      int
	SortBy     string
	SortOrder  string
	Status     *domain.ProductStatus
	CategoryID *domain.CategoryID
	Brand      *string
	MinPrice   *domain.Money
	MaxPrice   *domain.Money
	InStock    *bool
	Featured   *bool
	Tags       []string
}

type SearchQuery struct {
	Query      string
	Filters    ProductFilter
	Facets     []string
	Highlight  bool
	Fuzzy      bool
	Boost      map[string]float64
}

type SearchResult struct {
	Products    []*domain.Product
	Total       int64
	Facets      map[string][]Facet
	Suggestions []string
	Took        int64 // milliseconds
}

type Facet struct {
	Value string
	Count int64
}

type SearchAnalytics struct {
	TotalSearches    int64
	UniqueSearches   int64
	AverageResults   float64
	TopSearchTerms   []SearchTerm
	NoResultsQueries []string
}

type SearchTerm struct {
	Term  string
	Count int64
}

// Unit of Work pattern for transaction management
type UnitOfWork interface {
	Begin(ctx context.Context) error
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
	
	// Repository access within transaction
	ProductRepository() ProductRepository
	CategoryRepository() CategoryRepository
}

// Specification pattern for complex queries
type ProductSpecification interface {
	IsSatisfiedBy(product *domain.Product) bool
	ToSQL() (string, []interface{})
}

// Common specifications
type ActiveProductSpecification struct{}
type FeaturedProductSpecification struct{}
type InStockProductSpecification struct{}
type PriceRangeSpecification struct {
	MinPrice domain.Money
	MaxPrice domain.Money
}

// Composite specification
type CompositeSpecification struct {
	specifications []ProductSpecification
	operator       string // "AND" or "OR"
}

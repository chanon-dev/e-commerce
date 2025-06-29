package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"product-service/internal/domain/entities"
	"product-service/internal/domain/repositories"
)

// ProductService handles product business logic
type ProductService struct {
	productRepo  repositories.ProductRepository
	categoryRepo repositories.CategoryRepository
	brandRepo    repositories.BrandRepository
	variantRepo  repositories.ProductVariantRepository
	imageRepo    repositories.ProductImageRepository
	videoRepo    repositories.ProductVideoRepository
}

// NewProductService creates a new product service
func NewProductService(
	productRepo repositories.ProductRepository,
	categoryRepo repositories.CategoryRepository,
	brandRepo repositories.BrandRepository,
	variantRepo repositories.ProductVariantRepository,
	imageRepo repositories.ProductImageRepository,
	videoRepo repositories.ProductVideoRepository,
) *ProductService {
	return &ProductService{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		brandRepo:    brandRepo,
		variantRepo:  variantRepo,
		imageRepo:    imageRepo,
		videoRepo:    videoRepo,
	}
}

// CreateProduct creates a new product
func (s *ProductService) CreateProduct(ctx context.Context, req *CreateProductRequest) (*entities.Product, error) {
	// Validate category exists
	category, err := s.categoryRepo.GetByID(ctx, req.CategoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	if category == nil {
		return nil, errors.New("category not found")
	}
	
	// Validate brand exists if provided
	if req.BrandID != nil {
		brand, err := s.brandRepo.GetByID(ctx, *req.BrandID)
		if err != nil {
			return nil, fmt.Errorf("failed to get brand: %w", err)
		}
		if brand == nil {
			return nil, errors.New("brand not found")
		}
	}
	
	// Check if SKU already exists
	exists, err := s.productRepo.ExistsBySKU(ctx, req.SKU)
	if err != nil {
		return nil, fmt.Errorf("failed to check SKU existence: %w", err)
	}
	if exists {
		return nil, errors.New("product with this SKU already exists")
	}
	
	// Create product
	product, err := entities.NewProduct(req.SKU, req.Name, req.Description, req.Price, req.CategoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}
	
	// Set optional fields
	if req.ShortDescription != "" {
		product.ShortDesc = req.ShortDescription
	}
	
	if req.ComparePrice > 0 {
		product.ComparePrice = req.ComparePrice
	}
	
	if req.CostPrice > 0 {
		product.CostPrice = req.CostPrice
	}
	
	if req.BrandID != nil {
		product.SetBrand(req.BrandID)
	}
	
	if req.Weight > 0 || req.Length > 0 || req.Width > 0 || req.Height > 0 {
		err = product.UpdatePhysicalProperties(req.Weight, req.Length, req.Width, req.Height)
		if err != nil {
			return nil, fmt.Errorf("failed to update physical properties: %w", err)
		}
	}
	
	if len(req.Tags) > 0 {
		product.Tags = req.Tags
	}
	
	if len(req.Attributes) > 0 {
		product.Attributes = req.Attributes
	}
	
	// Set inventory settings
	if req.StockQuantity >= 0 {
		err = product.UpdateInventory(req.StockQuantity, req.TrackStock, req.AllowBackorder)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory: %w", err)
		}
	}
	
	// Save product
	err = s.productRepo.Create(ctx, product)
	if err != nil {
		return nil, fmt.Errorf("failed to save product: %w", err)
	}
	
	// Increment category product count
	err = s.categoryRepo.IncrementProductCount(ctx, req.CategoryID)
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to increment category product count: %v\n", err)
	}
	
	// Increment brand product count if applicable
	if req.BrandID != nil {
		err = s.brandRepo.IncrementProductCount(ctx, *req.BrandID)
		if err != nil {
			// Log error but don't fail the operation
			fmt.Printf("Warning: failed to increment brand product count: %v\n", err)
		}
	}
	
	return product, nil
}

// GetProduct retrieves a product by ID
func (s *ProductService) GetProduct(ctx context.Context, id uuid.UUID, includeRelated bool) (*entities.Product, error) {
	if includeRelated {
		return s.productRepo.LoadComplete(ctx, id)
	}
	return s.productRepo.GetByID(ctx, id)
}

// GetProductBySKU retrieves a product by SKU
func (s *ProductService) GetProductBySKU(ctx context.Context, sku string, includeRelated bool) (*entities.Product, error) {
	product, err := s.productRepo.GetBySKU(ctx, sku)
	if err != nil {
		return nil, err
	}
	
	if product != nil && includeRelated {
		return s.productRepo.LoadComplete(ctx, product.ID)
	}
	
	return product, nil
}

// GetProductBySlug retrieves a product by slug
func (s *ProductService) GetProductBySlug(ctx context.Context, slug string, includeRelated bool) (*entities.Product, error) {
	product, err := s.productRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	
	if product != nil && includeRelated {
		return s.productRepo.LoadComplete(ctx, product.ID)
	}
	
	return product, nil
}

// UpdateProduct updates an existing product
func (s *ProductService) UpdateProduct(ctx context.Context, id uuid.UUID, req *UpdateProductRequest) (*entities.Product, error) {
	// Get existing product
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}
	if product == nil {
		return nil, errors.New("product not found")
	}
	
	// Store old category and brand for count updates
	oldCategoryID := product.CategoryID
	oldBrandID := product.BrandID
	
	// Update basic info
	if req.Name != "" || req.Description != "" || req.ShortDescription != "" {
		err = product.UpdateBasicInfo(req.Name, req.Description, req.ShortDescription)
		if err != nil {
			return nil, fmt.Errorf("failed to update basic info: %w", err)
		}
	}
	
	// Update pricing
	if req.Price >= 0 || req.ComparePrice >= 0 || req.CostPrice >= 0 {
		err = product.UpdatePricing(req.Price, req.ComparePrice, req.CostPrice)
		if err != nil {
			return nil, fmt.Errorf("failed to update pricing: %w", err)
		}
	}
	
	// Update inventory
	if req.StockQuantity >= 0 {
		err = product.UpdateInventory(req.StockQuantity, req.TrackStock, req.AllowBackorder)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory: %w", err)
		}
	}
	
	// Update physical properties
	if req.Weight >= 0 || req.Length >= 0 || req.Width >= 0 || req.Height >= 0 {
		err = product.UpdatePhysicalProperties(req.Weight, req.Length, req.Width, req.Height)
		if err != nil {
			return nil, fmt.Errorf("failed to update physical properties: %w", err)
		}
	}
	
	// Update category if changed
	if req.CategoryID != uuid.Nil && req.CategoryID != product.CategoryID {
		// Validate new category exists
		category, err := s.categoryRepo.GetByID(ctx, req.CategoryID)
		if err != nil {
			return nil, fmt.Errorf("failed to get category: %w", err)
		}
		if category == nil {
			return nil, errors.New("category not found")
		}
		
		err = product.SetCategory(req.CategoryID)
		if err != nil {
			return nil, fmt.Errorf("failed to set category: %w", err)
		}
	}
	
	// Update brand if changed
	if req.BrandID != nil && (product.BrandID == nil || *req.BrandID != *product.BrandID) {
		// Validate new brand exists
		brand, err := s.brandRepo.GetByID(ctx, *req.BrandID)
		if err != nil {
			return nil, fmt.Errorf("failed to get brand: %w", err)
		}
		if brand == nil {
			return nil, errors.New("brand not found")
		}
		
		product.SetBrand(req.BrandID)
	}
	
	// Update SEO
	if len(req.Tags) > 0 || req.MetaTitle != "" || req.MetaDescription != "" {
		product.UpdateSEO(req.MetaTitle, req.MetaDescription, req.Tags)
	}
	
	// Update attributes
	if len(req.Attributes) > 0 {
		for key, value := range req.Attributes {
			product.AddAttribute(key, value)
		}
	}
	
	// Update status and visibility
	if req.Status != nil {
		product.SetStatus(*req.Status)
	}
	
	if req.Visibility != nil {
		product.SetVisibility(*req.Visibility)
	}
	
	if req.Featured != nil {
		product.SetFeatured(*req.Featured)
	}
	
	// Save product
	err = s.productRepo.Update(ctx, product)
	if err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}
	
	// Update category counts if category changed
	if req.CategoryID != uuid.Nil && req.CategoryID != oldCategoryID {
		// Decrement old category count
		err = s.categoryRepo.DecrementProductCount(ctx, oldCategoryID)
		if err != nil {
			fmt.Printf("Warning: failed to decrement old category product count: %v\n", err)
		}
		
		// Increment new category count
		err = s.categoryRepo.IncrementProductCount(ctx, req.CategoryID)
		if err != nil {
			fmt.Printf("Warning: failed to increment new category product count: %v\n", err)
		}
	}
	
	// Update brand counts if brand changed
	if req.BrandID != nil {
		if oldBrandID != nil && *req.BrandID != *oldBrandID {
			// Decrement old brand count
			err = s.brandRepo.DecrementProductCount(ctx, *oldBrandID)
			if err != nil {
				fmt.Printf("Warning: failed to decrement old brand product count: %v\n", err)
			}
		}
		
		if oldBrandID == nil || *req.BrandID != *oldBrandID {
			// Increment new brand count
			err = s.brandRepo.IncrementProductCount(ctx, *req.BrandID)
			if err != nil {
				fmt.Printf("Warning: failed to increment new brand product count: %v\n", err)
			}
		}
	}
	
	return product, nil
}

// DeleteProduct deletes a product
func (s *ProductService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	// Get product to access category and brand info
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}
	if product == nil {
		return errors.New("product not found")
	}
	
	// Delete product
	err = s.productRepo.Delete(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	
	// Decrement category product count
	err = s.categoryRepo.DecrementProductCount(ctx, product.CategoryID)
	if err != nil {
		fmt.Printf("Warning: failed to decrement category product count: %v\n", err)
	}
	
	// Decrement brand product count if applicable
	if product.BrandID != nil {
		err = s.brandRepo.DecrementProductCount(ctx, *product.BrandID)
		if err != nil {
			fmt.Printf("Warning: failed to decrement brand product count: %v\n", err)
		}
	}
	
	return nil
}

// SearchProducts searches for products with filters
func (s *ProductService) SearchProducts(ctx context.Context, req *SearchProductsRequest) (*repositories.ProductSearchResult, error) {
	// Build filters
	filters := &repositories.ProductFilters{
		CategoryIDs: req.CategoryIDs,
		BrandIDs:    req.BrandIDs,
		MinPrice:    req.MinPrice,
		MaxPrice:    req.MaxPrice,
		InStock:     req.InStock,
		Featured:    req.Featured,
		Status:      req.Status,
		Visibility:  req.Visibility,
		Tags:        req.Tags,
		Attributes:  req.Attributes,
		HasVariants: req.HasVariants,
		CreatedFrom: req.CreatedFrom,
		CreatedTo:   req.CreatedTo,
	}
	
	// Calculate offset
	offset := (req.Page - 1) * req.PageSize
	
	// Search products
	products, err := s.productRepo.Search(ctx, req.Query, filters, req.PageSize, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search products: %w", err)
	}
	
	// Get total count
	total, err := s.productRepo.CountSearch(ctx, req.Query, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to count search results: %w", err)
	}
	
	// Calculate pagination info
	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))
	hasNext := req.Page < totalPages
	hasPrev := req.Page > 1
	
	return &repositories.ProductSearchResult{
		Products:   products,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}, nil
}

// GetProductsByCategory gets products by category
func (s *ProductService) GetProductsByCategory(ctx context.Context, categoryID uuid.UUID, page, pageSize int) ([]*entities.Product, error) {
	offset := (page - 1) * pageSize
	return s.productRepo.GetByCategory(ctx, categoryID, pageSize, offset)
}

// GetProductsByBrand gets products by brand
func (s *ProductService) GetProductsByBrand(ctx context.Context, brandID uuid.UUID, page, pageSize int) ([]*entities.Product, error) {
	offset := (page - 1) * pageSize
	return s.productRepo.GetByBrand(ctx, brandID, pageSize, offset)
}

// GetFeaturedProducts gets featured products
func (s *ProductService) GetFeaturedProducts(ctx context.Context, limit int) ([]*entities.Product, error) {
	return s.productRepo.GetFeatured(ctx, limit, 0)
}

// UpdateProductStock updates product stock
func (s *ProductService) UpdateProductStock(ctx context.Context, id uuid.UUID, quantity int) error {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}
	if product == nil {
		return errors.New("product not found")
	}
	
	if quantity < 0 {
		return product.DeductStock(-quantity)
	} else {
		return product.AddStock(quantity)
	}
}

// Request and response types

// CreateProductRequest represents a create product request
type CreateProductRequest struct {
	SKU              string            `json:"sku" validate:"required"`
	Name             string            `json:"name" validate:"required"`
	Description      string            `json:"description"`
	ShortDescription string            `json:"short_description"`
	Price            float64           `json:"price" validate:"required,min=0"`
	ComparePrice     float64           `json:"compare_price" validate:"min=0"`
	CostPrice        float64           `json:"cost_price" validate:"min=0"`
	CategoryID       uuid.UUID         `json:"category_id" validate:"required"`
	BrandID          *uuid.UUID        `json:"brand_id"`
	StockQuantity    int               `json:"stock_quantity" validate:"min=0"`
	TrackStock       bool              `json:"track_stock"`
	AllowBackorder   bool              `json:"allow_backorder"`
	Weight           float64           `json:"weight" validate:"min=0"`
	Length           float64           `json:"length" validate:"min=0"`
	Width            float64           `json:"width" validate:"min=0"`
	Height           float64           `json:"height" validate:"min=0"`
	Tags             []string          `json:"tags"`
	Attributes       map[string]string `json:"attributes"`
}

// UpdateProductRequest represents an update product request
type UpdateProductRequest struct {
	Name             string                   `json:"name"`
	Description      string                   `json:"description"`
	ShortDescription string                   `json:"short_description"`
	Price            float64                  `json:"price" validate:"min=0"`
	ComparePrice     float64                  `json:"compare_price" validate:"min=0"`
	CostPrice        float64                  `json:"cost_price" validate:"min=0"`
	CategoryID       uuid.UUID                `json:"category_id"`
	BrandID          *uuid.UUID               `json:"brand_id"`
	StockQuantity    int                      `json:"stock_quantity" validate:"min=0"`
	TrackStock       bool                     `json:"track_stock"`
	AllowBackorder   bool                     `json:"allow_backorder"`
	Weight           float64                  `json:"weight" validate:"min=0"`
	Length           float64                  `json:"length" validate:"min=0"`
	Width            float64                  `json:"width" validate:"min=0"`
	Height           float64                  `json:"height" validate:"min=0"`
	MetaTitle        string                   `json:"meta_title"`
	MetaDescription  string                   `json:"meta_description"`
	Tags             []string                 `json:"tags"`
	Attributes       map[string]string        `json:"attributes"`
	Status           *entities.ProductStatus  `json:"status"`
	Visibility       *entities.Visibility     `json:"visibility"`
	Featured         *bool                    `json:"featured"`
}

// SearchProductsRequest represents a search products request
type SearchProductsRequest struct {
	Query       string                   `json:"query"`
	CategoryIDs []uuid.UUID              `json:"category_ids"`
	BrandIDs    []uuid.UUID              `json:"brand_ids"`
	MinPrice    *float64                 `json:"min_price"`
	MaxPrice    *float64                 `json:"max_price"`
	InStock     *bool                    `json:"in_stock"`
	Featured    *bool                    `json:"featured"`
	Status      *entities.ProductStatus  `json:"status"`
	Visibility  *entities.Visibility     `json:"visibility"`
	Tags        []string                 `json:"tags"`
	Attributes  map[string]string        `json:"attributes"`
	HasVariants *bool                    `json:"has_variants"`
	CreatedFrom *string                  `json:"created_from"`
	CreatedTo   *string                  `json:"created_to"`
	Page        int                      `json:"page" validate:"min=1"`
	PageSize    int                      `json:"page_size" validate:"min=1,max=100"`
}

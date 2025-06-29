package database

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"product-service/internal/domain/entities"
	"product-service/internal/domain/repositories"
)

// GormProductRepository implements ProductRepository using GORM
type GormProductRepository struct {
	db *gorm.DB
}

// NewGormProductRepository creates a new GORM product repository
func NewGormProductRepository(db *gorm.DB) repositories.ProductRepository {
	return &GormProductRepository{db: db}
}

// Create creates a new product
func (r *GormProductRepository) Create(ctx context.Context, product *entities.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

// GetByID retrieves a product by ID
func (r *GormProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// GetBySKU retrieves a product by SKU
func (r *GormProductRepository) GetBySKU(ctx context.Context, sku string) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).Where("sku = ?", sku).First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// GetBySlug retrieves a product by slug
func (r *GormProductRepository) GetBySlug(ctx context.Context, slug string) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// Update updates a product
func (r *GormProductRepository) Update(ctx context.Context, product *entities.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

// Delete deletes a product
func (r *GormProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entities.Product{}, id).Error
}

// GetByIDs retrieves products by IDs
func (r *GormProductRepository) GetByIDs(ctx context.Context, ids []uuid.UUID) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&products).Error
	return products, err
}

// GetBySKUs retrieves products by SKUs
func (r *GormProductRepository) GetBySKUs(ctx context.Context, skus []string) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).Where("sku IN ?", skus).Find(&products).Error
	return products, err
}

// GetAll retrieves all products with pagination
func (r *GormProductRepository) GetAll(ctx context.Context, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetByCategory retrieves products by category
func (r *GormProductRepository) GetByCategory(ctx context.Context, categoryID uuid.UUID, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("category_id = ?", categoryID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetByBrand retrieves products by brand
func (r *GormProductRepository) GetByBrand(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("brand_id = ?", brandID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetByStatus retrieves products by status
func (r *GormProductRepository) GetByStatus(ctx context.Context, status entities.ProductStatus, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("status = ?", status).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetFeatured retrieves featured products
func (r *GormProductRepository) GetFeatured(ctx context.Context, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("featured = ? AND status = ? AND visibility IN ?", true, entities.ProductStatusActive, []entities.Visibility{entities.VisibilityVisible, entities.VisibilityFeatured}).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// Search searches for products
func (r *GormProductRepository) Search(ctx context.Context, query string, filters *repositories.ProductFilters, limit, offset int) ([]*entities.Product, error) {
	db := r.db.WithContext(ctx)
	
	// Apply text search
	if query != "" {
		searchQuery := "%" + strings.ToLower(query) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(short_desc) LIKE ?", 
			searchQuery, searchQuery, searchQuery)
	}
	
	// Apply filters
	db = r.applyFilters(db, filters)
	
	var products []*entities.Product
	err := db.Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	
	return products, err
}

// GetByPriceRange retrieves products by price range
func (r *GormProductRepository) GetByPriceRange(ctx context.Context, minPrice, maxPrice float64, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("price BETWEEN ? AND ?", minPrice, maxPrice).
		Limit(limit).
		Offset(offset).
		Order("price ASC").
		Find(&products).Error
	return products, err
}

// GetByTags retrieves products by tags
func (r *GormProductRepository) GetByTags(ctx context.Context, tags []string, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	
	// PostgreSQL array contains query
	err := r.db.WithContext(ctx).
		Where("tags && ?", tags).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error
	
	return products, err
}

// GetLowStock retrieves products with low stock
func (r *GormProductRepository) GetLowStock(ctx context.Context, threshold int, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("track_stock = ? AND stock_quantity <= ?", true, threshold).
		Limit(limit).
		Offset(offset).
		Order("stock_quantity ASC").
		Find(&products).Error
	return products, err
}

// GetOutOfStock retrieves out of stock products
func (r *GormProductRepository) GetOutOfStock(ctx context.Context, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("track_stock = ? AND stock_quantity = 0", true).
		Limit(limit).
		Offset(offset).
		Order("updated_at DESC").
		Find(&products).Error
	return products, err
}

// UpdateStock updates product stock
func (r *GormProductRepository) UpdateStock(ctx context.Context, id uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("id = ?", id).
		Update("stock_quantity", quantity).Error
}

// BulkUpdateStock updates multiple products' stock
func (r *GormProductRepository) BulkUpdateStock(ctx context.Context, updates []repositories.StockUpdate) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			if !update.IsVariant {
				err := tx.Model(&entities.Product{}).
					Where("id = ?", update.ID).
					Update("stock_quantity", update.Quantity).Error
				if err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// GetTopSelling retrieves top selling products
func (r *GormProductRepository) GetTopSelling(ctx context.Context, limit int, days int) ([]*entities.Product, error) {
	// This would typically join with order items table
	// For now, return products ordered by some criteria
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("status = ?", entities.ProductStatusActive).
		Limit(limit).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetRecentlyAdded retrieves recently added products
func (r *GormProductRepository) GetRecentlyAdded(ctx context.Context, limit int, days int) ([]*entities.Product, error) {
	var products []*entities.Product
	err := r.db.WithContext(ctx).
		Where("created_at >= NOW() - INTERVAL ? DAY", days).
		Limit(limit).
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetMostViewed retrieves most viewed products
func (r *GormProductRepository) GetMostViewed(ctx context.Context, limit int, days int) ([]*entities.Product, error) {
	// This would typically use analytics data
	// For now, return featured products
	return r.GetFeatured(ctx, limit, 0)
}

// Count counts all products
func (r *GormProductRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.Product{}).Count(&count).Error
	return count, err
}

// CountByCategory counts products by category
func (r *GormProductRepository) CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("category_id = ?", categoryID).
		Count(&count).Error
	return count, err
}

// CountByBrand counts products by brand
func (r *GormProductRepository) CountByBrand(ctx context.Context, brandID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("brand_id = ?", brandID).
		Count(&count).Error
	return count, err
}

// CountByStatus counts products by status
func (r *GormProductRepository) CountByStatus(ctx context.Context, status entities.ProductStatus) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("status = ?", status).
		Count(&count).Error
	return count, err
}

// CountSearch counts search results
func (r *GormProductRepository) CountSearch(ctx context.Context, query string, filters *repositories.ProductFilters) (int64, error) {
	db := r.db.WithContext(ctx).Model(&entities.Product{})
	
	// Apply text search
	if query != "" {
		searchQuery := "%" + strings.ToLower(query) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(short_desc) LIKE ?", 
			searchQuery, searchQuery, searchQuery)
	}
	
	// Apply filters
	db = r.applyFilters(db, filters)
	
	var count int64
	err := db.Count(&count).Error
	return count, err
}

// ExistsBySKU checks if product exists by SKU
func (r *GormProductRepository) ExistsBySKU(ctx context.Context, sku string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("sku = ?", sku).
		Count(&count).Error
	return count > 0, err
}

// ExistsBySlug checks if product exists by slug
func (r *GormProductRepository) ExistsBySlug(ctx context.Context, slug string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entities.Product{}).
		Where("slug = ?", slug).
		Count(&count).Error
	return count > 0, err
}

// LoadWithImages loads product with images
func (r *GormProductRepository) LoadWithImages(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).
		Preload("Images").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// LoadWithVariants loads product with variants
func (r *GormProductRepository) LoadWithVariants(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).
		Preload("Variants").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// LoadWithCategory loads product with category
func (r *GormProductRepository) LoadWithCategory(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).
		Preload("Category").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// LoadWithBrand loads product with brand
func (r *GormProductRepository) LoadWithBrand(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).
		Preload("Brand").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// LoadComplete loads product with all related data
func (r *GormProductRepository) LoadComplete(ctx context.Context, id uuid.UUID) (*entities.Product, error) {
	var product entities.Product
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Preload("Images").
		Preload("Videos").
		Preload("Variants").
		Preload("Variants.Images").
		Where("id = ?", id).
		First(&product).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// applyFilters applies search filters to the query
func (r *GormProductRepository) applyFilters(db *gorm.DB, filters *repositories.ProductFilters) *gorm.DB {
	if filters == nil {
		return db
	}
	
	if len(filters.CategoryIDs) > 0 {
		db = db.Where("category_id IN ?", filters.CategoryIDs)
	}
	
	if len(filters.BrandIDs) > 0 {
		db = db.Where("brand_id IN ?", filters.BrandIDs)
	}
	
	if filters.MinPrice != nil {
		db = db.Where("price >= ?", *filters.MinPrice)
	}
	
	if filters.MaxPrice != nil {
		db = db.Where("price <= ?", *filters.MaxPrice)
	}
	
	if filters.InStock != nil {
		if *filters.InStock {
			db = db.Where("(track_stock = false OR stock_quantity > 0)")
		} else {
			db = db.Where("track_stock = true AND stock_quantity = 0")
		}
	}
	
	if filters.Featured != nil {
		db = db.Where("featured = ?", *filters.Featured)
	}
	
	if filters.Status != nil {
		db = db.Where("status = ?", *filters.Status)
	}
	
	if filters.Visibility != nil {
		db = db.Where("visibility = ?", *filters.Visibility)
	}
	
	if len(filters.Tags) > 0 {
		db = db.Where("tags && ?", filters.Tags)
	}
	
	if filters.HasVariants != nil {
		db = db.Where("has_variants = ?", *filters.HasVariants)
	}
	
	if filters.CreatedFrom != nil {
		db = db.Where("created_at >= ?", *filters.CreatedFrom)
	}
	
	if filters.CreatedTo != nil {
		db = db.Where("created_at <= ?", *filters.CreatedTo)
	}
	
	// Handle attributes filter (JSONB query)
	if len(filters.Attributes) > 0 {
		for key, value := range filters.Attributes {
			db = db.Where("attributes ->> ? = ?", key, value)
		}
	}
	
	return db
}

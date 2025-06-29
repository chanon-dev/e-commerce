// Product Service - Independent API Handler (NO SHARED CODE)
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Own response types (NOT shared)
type ProductResponse struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Price       float64                `json:"price"`
	Currency    string                 `json:"currency"`
	CategoryID  string                 `json:"categoryId"`
	BrandID     string                 `json:"brandId"`
	SKU         string                 `json:"sku"`
	Images      []ProductImage         `json:"images"`
	Attributes  map[string]interface{} `json:"attributes"`
	IsActive    bool                   `json:"isActive"`
	Stock       int                    `json:"stock"`
	CreatedAt   string                 `json:"createdAt"`
	UpdatedAt   string                 `json:"updatedAt"`
}

type ProductImage struct {
	ID       string `json:"id"`
	URL      string `json:"url"`
	AltText  string `json:"altText"`
	Position int    `json:"position"`
	IsMain   bool   `json:"isMain"`
}

type ProductListResponse struct {
	Products   []ProductResponse `json:"products"`
	Pagination PaginationInfo    `json:"pagination"`
}

type PaginationInfo struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"totalPages"`
	HasNext    bool `json:"hasNext"`
	HasPrev    bool `json:"hasPrev"`
}

type CreateProductRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	Price       float64                `json:"price" binding:"required,gt=0"`
	Currency    string                 `json:"currency"`
	CategoryID  string                 `json:"categoryId" binding:"required"`
	BrandID     string                 `json:"brandId" binding:"required"`
	SKU         string                 `json:"sku" binding:"required"`
	Attributes  map[string]interface{} `json:"attributes"`
	Stock       int                    `json:"stock"`
}

type UpdateProductRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	Price       *float64               `json:"price"`
	CategoryID  *string                `json:"categoryId"`
	BrandID     *string                `json:"brandId"`
	Attributes  map[string]interface{} `json:"attributes"`
	Stock       *int                   `json:"stock"`
	IsActive    *bool                  `json:"isActive"`
}

type ProductHandler struct {
	// productService would be injected here
}

func NewProductHandler() *ProductHandler {
	return &ProductHandler{}
}

// GET /api/v1/products/:id
func (h *ProductHandler) GetProduct(c *gin.Context) {
	productID := c.Param("id")
	
	// Mock product data (in real implementation, would fetch from database)
	product := &ProductResponse{
		ID:          productID,
		Name:        "Sample Product",
		Description: "This is a sample product",
		Price:       99.99,
		Currency:    "USD",
		CategoryID:  "cat_123",
		BrandID:     "brand_456",
		SKU:         "SKU-" + productID,
		Images: []ProductImage{
			{
				ID:       "img_1",
				URL:      "https://example.com/image1.jpg",
				AltText:  "Product image",
				Position: 1,
				IsMain:   true,
			},
		},
		Attributes: map[string]interface{}{
			"color":    "blue",
			"size":     "M",
			"material": "cotton",
		},
		IsActive:  true,
		Stock:     100,
		CreatedAt: time.Now().Format(time.RFC3339),
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, product)
}

// GET /api/v1/products
func (h *ProductHandler) GetProducts(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	categoryID := c.Query("categoryId")
	brandID := c.Query("brandId")
	
	// Mock products data
	products := []ProductResponse{
		{
			ID:          "prod_1",
			Name:        "Product 1",
			Description: "First product",
			Price:       29.99,
			Currency:    "USD",
			CategoryID:  categoryID,
			BrandID:     brandID,
			SKU:         "SKU-001",
			IsActive:    true,
			Stock:       50,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			ID:          "prod_2",
			Name:        "Product 2",
			Description: "Second product",
			Price:       49.99,
			Currency:    "USD",
			CategoryID:  categoryID,
			BrandID:     brandID,
			SKU:         "SKU-002",
			IsActive:    true,
			Stock:       75,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
	}

	total := len(products)
	totalPages := (total + limit - 1) / limit

	response := ProductListResponse{
		Products: products,
		Pagination: PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	}

	c.JSON(http.StatusOK, response)
}

// POST /api/v1/products
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create product (mock implementation)
	product := &ProductResponse{
		ID:          "prod_" + strconv.FormatInt(time.Now().Unix(), 10),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Currency:    req.Currency,
		CategoryID:  req.CategoryID,
		BrandID:     req.BrandID,
		SKU:         req.SKU,
		Attributes:  req.Attributes,
		IsActive:    true,
		Stock:       req.Stock,
		CreatedAt:   time.Now().Format(time.RFC3339),
		UpdatedAt:   time.Now().Format(time.RFC3339),
	}

	// Publish product created event (own event structure)
	go h.publishProductCreatedEvent(product)

	c.JSON(http.StatusCreated, product)
}

// PUT /api/v1/products/:id
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	
	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update product (mock implementation)
	product := &ProductResponse{
		ID:        productID,
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.CategoryID != nil {
		product.CategoryID = *req.CategoryID
	}
	if req.BrandID != nil {
		product.BrandID = *req.BrandID
	}
	if req.Attributes != nil {
		product.Attributes = req.Attributes
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	// Publish product updated event (own event structure)
	go h.publishProductUpdatedEvent(product)

	c.JSON(http.StatusOK, product)
}

// DELETE /api/v1/products/:id
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	
	// Delete product (mock implementation)
	// In real implementation, would soft delete or hard delete from database
	
	// Publish product deleted event (own event structure)
	go h.publishProductDeletedEvent(productID)

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GET /api/v1/products/search
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Mock search results
	products := []ProductResponse{
		{
			ID:          "prod_search_1",
			Name:        "Search Result 1 - " + query,
			Description: "Product matching: " + query,
			Price:       19.99,
			Currency:    "USD",
			SKU:         "SEARCH-001",
			IsActive:    true,
			Stock:       25,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
	}

	response := ProductListResponse{
		Products: products,
		Pagination: PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      1,
			TotalPages: 1,
			HasNext:    false,
			HasPrev:    false,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Health check endpoint
func (h *ProductHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "product-service",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Event publishing methods (own event structures - NOT shared)
func (h *ProductHandler) publishProductCreatedEvent(product *ProductResponse) {
	event := map[string]interface{}{
		"eventType": "product.created",
		"eventId":   h.generateEventID(),
		"timestamp": time.Now().Format(time.RFC3339),
		"data": map[string]interface{}{
			"productId":   product.ID,
			"name":        product.Name,
			"price":       product.Price,
			"currency":    product.Currency,
			"categoryId":  product.CategoryID,
			"brandId":     product.BrandID,
			"sku":         product.SKU,
			"isActive":    product.IsActive,
		},
	}

	// Publish to Kafka (implementation would be here)
	eventJSON, _ := json.Marshal(event)
	println("[Product Service] Publishing product.created event:", string(eventJSON))
}

func (h *ProductHandler) publishProductUpdatedEvent(product *ProductResponse) {
	event := map[string]interface{}{
		"eventType": "product.updated",
		"eventId":   h.generateEventID(),
		"timestamp": time.Now().Format(time.RFC3339),
		"data": map[string]interface{}{
			"productId": product.ID,
			"name":      product.Name,
			"price":     product.Price,
			"isActive":  product.IsActive,
		},
	}

	// Publish to Kafka (implementation would be here)
	eventJSON, _ := json.Marshal(event)
	println("[Product Service] Publishing product.updated event:", string(eventJSON))
}

func (h *ProductHandler) publishProductDeletedEvent(productID string) {
	event := map[string]interface{}{
		"eventType": "product.deleted",
		"eventId":   h.generateEventID(),
		"timestamp": time.Now().Format(time.RFC3339),
		"data": map[string]interface{}{
			"productId": productID,
		},
	}

	// Publish to Kafka (implementation would be here)
	eventJSON, _ := json.Marshal(event)
	println("[Product Service] Publishing product.deleted event:", string(eventJSON))
}

func (h *ProductHandler) generateEventID() string {
	return "evt_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}

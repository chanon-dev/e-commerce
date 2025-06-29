package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"product-service/internal/application/services"
	"product-service/internal/domain/entities"
)

// ProductHandler handles HTTP requests for products
type ProductHandler struct {
	productService *services.ProductService
}

// NewProductHandler creates a new product handler
func NewProductHandler(productService *services.ProductService) *ProductHandler {
	return &ProductHandler{
		productService: productService,
	}
}

// CreateProduct creates a new product
// @Summary Create a new product
// @Description Create a new product with the provided information
// @Tags products
// @Accept json
// @Produce json
// @Param product body services.CreateProductRequest true "Product information"
// @Success 201 {object} APIResponse{data=entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products [post]
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req services.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid request body", err.Error()))
		return
	}
	
	product, err := h.productService.CreateProduct(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to create product", err.Error()))
		return
	}
	
	c.JSON(http.StatusCreated, NewSuccessResponse("Product created successfully", product))
}

// GetProduct retrieves a product by ID
// @Summary Get a product by ID
// @Description Get a product by its ID with optional related data
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Param include_related query bool false "Include related data (images, variants, etc.)"
// @Success 200 {object} APIResponse{data=entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/{id} [get]
func (h *ProductHandler) GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid product ID", err.Error()))
		return
	}
	
	includeRelated := c.Query("include_related") == "true"
	
	product, err := h.productService.GetProduct(c.Request.Context(), id, includeRelated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get product", err.Error()))
		return
	}
	
	if product == nil {
		c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Product retrieved successfully", product))
}

// GetProductBySKU retrieves a product by SKU
// @Summary Get a product by SKU
// @Description Get a product by its SKU with optional related data
// @Tags products
// @Produce json
// @Param sku path string true "Product SKU"
// @Param include_related query bool false "Include related data (images, variants, etc.)"
// @Success 200 {object} APIResponse{data=entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/sku/{sku} [get]
func (h *ProductHandler) GetProductBySKU(c *gin.Context) {
	sku := c.Param("sku")
	if sku == "" {
		c.JSON(http.StatusBadRequest, NewErrorResponse("SKU is required", ""))
		return
	}
	
	includeRelated := c.Query("include_related") == "true"
	
	product, err := h.productService.GetProductBySKU(c.Request.Context(), sku, includeRelated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get product", err.Error()))
		return
	}
	
	if product == nil {
		c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Product retrieved successfully", product))
}

// GetProductBySlug retrieves a product by slug
// @Summary Get a product by slug
// @Description Get a product by its slug with optional related data
// @Tags products
// @Produce json
// @Param slug path string true "Product slug"
// @Param include_related query bool false "Include related data (images, variants, etc.)"
// @Success 200 {object} APIResponse{data=entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/slug/{slug} [get]
func (h *ProductHandler) GetProductBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Slug is required", ""))
		return
	}
	
	includeRelated := c.Query("include_related") == "true"
	
	product, err := h.productService.GetProductBySlug(c.Request.Context(), slug, includeRelated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get product", err.Error()))
		return
	}
	
	if product == nil {
		c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Product retrieved successfully", product))
}

// UpdateProduct updates an existing product
// @Summary Update a product
// @Description Update an existing product with the provided information
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param product body services.UpdateProductRequest true "Product information"
// @Success 200 {object} APIResponse{data=entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/{id} [put]
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid product ID", err.Error()))
		return
	}
	
	var req services.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid request body", err.Error()))
		return
	}
	
	product, err := h.productService.UpdateProduct(c.Request.Context(), id, &req)
	if err != nil {
		if err.Error() == "product not found" {
			c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
			return
		}
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to update product", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Product updated successfully", product))
}

// DeleteProduct deletes a product
// @Summary Delete a product
// @Description Delete a product by its ID
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} APIResponse
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/{id} [delete]
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid product ID", err.Error()))
		return
	}
	
	err = h.productService.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "product not found" {
			c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
			return
		}
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to delete product", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Product deleted successfully", nil))
}

// SearchProducts searches for products
// @Summary Search products
// @Description Search for products with various filters and pagination
// @Tags products
// @Produce json
// @Param q query string false "Search query"
// @Param category_ids query []string false "Category IDs"
// @Param brand_ids query []string false "Brand IDs"
// @Param min_price query number false "Minimum price"
// @Param max_price query number false "Maximum price"
// @Param in_stock query bool false "In stock filter"
// @Param featured query bool false "Featured filter"
// @Param status query int false "Product status"
// @Param visibility query int false "Product visibility"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} APIResponse{data=repositories.ProductSearchResult}
// @Failure 400 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/search [get]
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	req := &services.SearchProductsRequest{
		Query:    c.Query("q"),
		Page:     1,
		PageSize: 20,
	}
	
	// Parse page
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			req.Page = page
		}
	}
	
	// Parse page size
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
			req.PageSize = pageSize
		}
	}
	
	// Parse category IDs
	if categoryIDsStr := c.QueryArray("category_ids"); len(categoryIDsStr) > 0 {
		for _, idStr := range categoryIDsStr {
			if id, err := uuid.Parse(idStr); err == nil {
				req.CategoryIDs = append(req.CategoryIDs, id)
			}
		}
	}
	
	// Parse brand IDs
	if brandIDsStr := c.QueryArray("brand_ids"); len(brandIDsStr) > 0 {
		for _, idStr := range brandIDsStr {
			if id, err := uuid.Parse(idStr); err == nil {
				req.BrandIDs = append(req.BrandIDs, id)
			}
		}
	}
	
	// Parse price filters
	if minPriceStr := c.Query("min_price"); minPriceStr != "" {
		if minPrice, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			req.MinPrice = &minPrice
		}
	}
	
	if maxPriceStr := c.Query("max_price"); maxPriceStr != "" {
		if maxPrice, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			req.MaxPrice = &maxPrice
		}
	}
	
	// Parse boolean filters
	if inStockStr := c.Query("in_stock"); inStockStr != "" {
		if inStock, err := strconv.ParseBool(inStockStr); err == nil {
			req.InStock = &inStock
		}
	}
	
	if featuredStr := c.Query("featured"); featuredStr != "" {
		if featured, err := strconv.ParseBool(featuredStr); err == nil {
			req.Featured = &featured
		}
	}
	
	// Parse status
	if statusStr := c.Query("status"); statusStr != "" {
		if status, err := strconv.Atoi(statusStr); err == nil {
			productStatus := entities.ProductStatus(status)
			req.Status = &productStatus
		}
	}
	
	// Parse visibility
	if visibilityStr := c.Query("visibility"); visibilityStr != "" {
		if visibility, err := strconv.Atoi(visibilityStr); err == nil {
			productVisibility := entities.Visibility(visibility)
			req.Visibility = &productVisibility
		}
	}
	
	// Parse tags
	if tags := c.QueryArray("tags"); len(tags) > 0 {
		req.Tags = tags
	}
	
	result, err := h.productService.SearchProducts(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to search products", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Products retrieved successfully", result))
}

// GetProductsByCategory gets products by category
// @Summary Get products by category
// @Description Get products belonging to a specific category
// @Tags products
// @Produce json
// @Param category_id path string true "Category ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} APIResponse{data=[]entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/category/{category_id} [get]
func (h *ProductHandler) GetProductsByCategory(c *gin.Context) {
	categoryIDStr := c.Param("category_id")
	categoryID, err := uuid.Parse(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid category ID", err.Error()))
		return
	}
	
	page := 1
	pageSize := 20
	
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}
	
	products, err := h.productService.GetProductsByCategory(c.Request.Context(), categoryID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get products", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Products retrieved successfully", products))
}

// GetProductsByBrand gets products by brand
// @Summary Get products by brand
// @Description Get products belonging to a specific brand
// @Tags products
// @Produce json
// @Param brand_id path string true "Brand ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} APIResponse{data=[]entities.Product}
// @Failure 400 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/brand/{brand_id} [get]
func (h *ProductHandler) GetProductsByBrand(c *gin.Context) {
	brandIDStr := c.Param("brand_id")
	brandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid brand ID", err.Error()))
		return
	}
	
	page := 1
	pageSize := 20
	
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}
	
	products, err := h.productService.GetProductsByBrand(c.Request.Context(), brandID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get products", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Products retrieved successfully", products))
}

// GetFeaturedProducts gets featured products
// @Summary Get featured products
// @Description Get a list of featured products
// @Tags products
// @Produce json
// @Param limit query int false "Number of products to return" default(10)
// @Success 200 {object} APIResponse{data=[]entities.Product}
// @Failure 500 {object} APIResponse
// @Router /products/featured [get]
func (h *ProductHandler) GetFeaturedProducts(c *gin.Context) {
	limit := 10
	
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	
	products, err := h.productService.GetFeaturedProducts(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to get featured products", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Featured products retrieved successfully", products))
}

// UpdateProductStock updates product stock
// @Summary Update product stock
// @Description Update the stock quantity of a product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param stock body UpdateStockRequest true "Stock information"
// @Success 200 {object} APIResponse
// @Failure 400 {object} APIResponse
// @Failure 404 {object} APIResponse
// @Failure 500 {object} APIResponse
// @Router /products/{id}/stock [put]
func (h *ProductHandler) UpdateProductStock(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid product ID", err.Error()))
		return
	}
	
	var req UpdateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse("Invalid request body", err.Error()))
		return
	}
	
	err = h.productService.UpdateProductStock(c.Request.Context(), id, req.Quantity)
	if err != nil {
		if err.Error() == "product not found" {
			c.JSON(http.StatusNotFound, NewErrorResponse("Product not found", ""))
			return
		}
		c.JSON(http.StatusInternalServerError, NewErrorResponse("Failed to update stock", err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, NewSuccessResponse("Stock updated successfully", nil))
}

// Supporting types

// UpdateStockRequest represents a stock update request
type UpdateStockRequest struct {
	Quantity int `json:"quantity" binding:"required"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// NewSuccessResponse creates a success response
func NewSuccessResponse(message string, data interface{}) *APIResponse {
	return &APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

// NewErrorResponse creates an error response
func NewErrorResponse(message, error string) *APIResponse {
	return &APIResponse{
		Success: false,
		Message: message,
		Error:   error,
	}
}

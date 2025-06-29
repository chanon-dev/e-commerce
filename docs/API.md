# 📚 API Documentation

## 🌐 API Gateway

All API requests go through the API Gateway at `http://localhost:8080/api/v1`

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email for verification.",
  "userId": "uuid"
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

### POST /auth/verify-email
Verify user email with token.

**Request Body:**
```json
{
  "token": "verification-token"
}
```

### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "NewPassword123!"
}
```

### GET /auth/profile
Get current user profile. (Requires authentication)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "customer",
  "status": "active",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 👤 User Endpoints

### GET /users/profile
Get current user profile. (Requires authentication)

### PUT /users/profile
Update user profile. (Requires authentication)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### POST /users/avatar
Upload user avatar. (Requires authentication)

**Request:** Multipart form data with image file

### GET /users/{id}/addresses
Get user addresses. (Requires authentication)

### POST /users/addresses
Add new address. (Requires authentication)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "company": "Company Name",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "phoneNumber": "+1234567890",
  "isDefault": true,
  "type": "shipping"
}
```

## 🛍️ Product Endpoints

### GET /products
Get all products with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10)
- `category` (string): Category ID filter
- `brand` (string): Brand name filter
- `status` (string): Product status filter
- `featured` (boolean): Featured products only

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "sku": "PROD-001",
      "price": 99.99,
      "comparePrice": 129.99,
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "brand": "Brand Name",
      "images": [
        {
          "id": "uuid",
          "url": "https://example.com/image.jpg",
          "altText": "Product image",
          "isMain": true
        }
      ],
      "tags": ["tag1", "tag2"],
      "status": "active",
      "isActive": true,
      "isFeatured": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### GET /products/{id}
Get product by ID.

### GET /products/search
Search products using Elasticsearch.

**Query Parameters:**
- `q` (string): Search query (required)
- `page` (int): Page number
- `limit` (int): Items per page
- `category` (string): Category filter
- `brand` (string): Brand filter
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter

### GET /products/category/{categoryId}
Get products by category.

### POST /products
Create new product. (Requires authentication - Admin only)

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "sku": "PROD-001",
  "price": 99.99,
  "comparePrice": 129.99,
  "costPrice": 50.00,
  "categoryId": "uuid",
  "brand": "Brand Name",
  "weight": 1.5,
  "dimensions": {
    "length": 10,
    "width": 8,
    "height": 6,
    "unit": "cm"
  },
  "tags": ["tag1", "tag2"],
  "status": "active",
  "isActive": true,
  "isFeatured": false,
  "seo": {
    "title": "SEO Title",
    "description": "SEO Description",
    "keywords": "keyword1, keyword2"
  }
}
```

### PUT /products/{id}
Update product. (Requires authentication - Admin only)

### DELETE /products/{id}
Delete product. (Requires authentication - Admin only)

### POST /products/{id}/images
Upload product images. (Requires authentication - Admin only)

## 🛒 Cart Endpoints

### GET /cart
Get cart contents.

**Query Parameters:**
- `sessionId` (string): Guest session ID (for non-authenticated users)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Product Name",
      "productSku": "PROD-001",
      "productImage": "https://example.com/image.jpg",
      "quantity": 2,
      "unitPrice": 99.99,
      "totalPrice": 199.98
    }
  ],
  "total": 199.98,
  "itemCount": 2,
  "currency": "USD"
}
```

### POST /cart/items
Add item to cart.

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 1,
  "variant": {
    "size": "M",
    "color": "Blue"
  }
}
```

### PUT /cart/items/{itemId}
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /cart/items/{itemId}
Remove item from cart.

### DELETE /cart
Clear entire cart.

### POST /cart/merge
Merge guest cart with user cart after login. (Requires authentication)

**Request Body:**
```json
{
  "guestCartId": "guest-session-id"
}
```

### GET /cart/count
Get cart item count.

### POST /cart/validate
Validate cart items (check availability, prices).

### POST /cart/apply-coupon
Apply coupon to cart.

**Request Body:**
```json
{
  "couponCode": "SAVE10"
}
```

### DELETE /cart/coupon
Remove coupon from cart.

## 📦 Order Endpoints

### GET /orders
Get user orders. (Requires authentication)

**Query Parameters:**
- `page` (int): Page number
- `limit` (int): Items per page
- `status` (string): Order status filter

### GET /orders/{id}
Get order by ID. (Requires authentication)

### POST /orders
Create new order. (Requires authentication)

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 99.99
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "phoneNumber": "+1234567890"
  },
  "billingAddress": {
    // Same structure as shipping address
  },
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "customerNotes": "Please handle with care"
}
```

### PUT /orders/{id}/status
Update order status. (Requires authentication - Admin only)

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Order confirmed and being processed"
}
```

### POST /orders/{id}/cancel
Cancel order. (Requires authentication)

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

## 💳 Payment Endpoints

### POST /payments/process
Process payment. (Requires authentication)

**Request Body:**
```json
{
  "orderId": "uuid",
  "paymentMethod": "credit_card",
  "amount": 199.98,
  "currency": "USD",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}
```

### GET /payments/{id}
Get payment details. (Requires authentication)

### POST /payments/{id}/refund
Process refund. (Requires authentication - Admin only)

**Request Body:**
```json
{
  "amount": 199.98,
  "reason": "Customer request"
}
```

## 📊 Admin Endpoints

### GET /admin/dashboard
Get dashboard statistics. (Requires authentication - Admin only)

**Response:**
```json
{
  "stats": {
    "totalOrders": 1250,
    "totalRevenue": 125000.00,
    "totalCustomers": 850,
    "totalProducts": 120
  },
  "salesChart": [
    {
      "date": "2024-01-01",
      "sales": 5000.00,
      "orders": 25
    }
  ],
  "recentOrders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-001",
      "customerName": "John Doe",
      "total": 199.98,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "topProducts": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sales": 150,
      "revenue": 14999.50
    }
  ]
}
```

### GET /admin/users
Get all users. (Requires authentication - Admin only)

### GET /admin/orders
Get all orders. (Requires authentication - Admin only)

### GET /admin/products
Get all products for admin. (Requires authentication - Admin only)

## 🏷️ Category Endpoints

### GET /categories
Get all categories.

### GET /categories/{id}
Get category by ID.

### POST /categories
Create new category. (Requires authentication - Admin only)

### PUT /categories/{id}
Update category. (Requires authentication - Admin only)

### DELETE /categories/{id}
Delete category. (Requires authentication - Admin only)

## ⭐ Review Endpoints

### GET /reviews/product/{productId}
Get reviews for a product.

### POST /reviews
Create new review. (Requires authentication)

**Request Body:**
```json
{
  "productId": "uuid",
  "rating": 5,
  "title": "Great product!",
  "content": "I love this product. Highly recommended!",
  "images": ["https://example.com/review-image.jpg"]
}
```

### PUT /reviews/{id}
Update review. (Requires authentication)

### DELETE /reviews/{id}
Delete review. (Requires authentication)

## 🎯 Promotion Endpoints

### GET /promotions
Get active promotions.

### GET /promotions/{code}
Get promotion by code.

### POST /promotions/validate
Validate promotion code.

**Request Body:**
```json
{
  "code": "SAVE10",
  "cartTotal": 199.98
}
```

## 📊 Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/endpoint"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## 🔄 Rate Limiting

API requests are rate-limited:
- **Limit**: 100 requests per minute per IP
- **Headers**: Rate limit info is included in response headers
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## 📝 API Testing

### Using cURL
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Get products
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import the Postman collection from `/docs/postman/`
2. Set environment variables
3. Run the authentication request first
4. Use the returned token for subsequent requests

## 🔗 Interactive Documentation

Each service provides interactive API documentation:

- **API Gateway**: http://localhost:8080/api/docs
- **Auth Service**: http://localhost:3001/api/docs
- **User Service**: http://localhost:3002/swagger
- **Product Service**: http://localhost:3003/swagger/index.html
- **Order Service**: http://localhost:3004/swagger
- **Cart Service**: http://localhost:3006/api/docs

## 🔍 Health Check Endpoints

All services provide health check endpoints:

- **Health**: `GET /health`
- **Readiness**: `GET /health/ready`
- **Liveness**: `GET /health/live`
- **Metrics**: `GET /metrics` (Prometheus format)

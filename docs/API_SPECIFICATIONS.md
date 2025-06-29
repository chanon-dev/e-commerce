# 📋 API Specifications - E-Commerce Platform

## 📖 ภาพรวม

เอกสารนี้รวบรวม API specifications ของทุก services ในระบบ E-Commerce Platform พร้อมด้วย request/response examples และ authentication requirements

---

## 🔐 Authentication

### JWT Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication (สำหรับ external services)
```http
X-API-Key: <api_key>
```

---

## 🌐 Frontend APIs

### Customer Platform API

#### Base URL
```
https://customer-platform.ecommerce.local/api
```

#### Endpoints

##### 🏠 Home & Product Listing
```http
GET /products
GET /products/{id}
GET /categories
GET /categories/{id}/products
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_001",
        "name": "iPhone 15 Pro",
        "price": 39900,
        "currency": "THB",
        "category": "smartphones",
        "images": ["url1", "url2"],
        "stock": 50,
        "rating": 4.8
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

##### 🛒 Shopping Cart
```http
GET /cart
POST /cart/items
PUT /cart/items/{id}
DELETE /cart/items/{id}
```

**Add to Cart Request:**
```json
{
  "productId": "prod_001",
  "quantity": 2,
  "options": {
    "color": "black",
    "storage": "256GB"
  }
}
```

##### 👤 User Profile
```http
GET /profile
PUT /profile
GET /orders
GET /orders/{id}
```

### Admin Dashboard API

#### Base URL
```
https://admin.ecommerce.local/api
```

#### Endpoints

##### 📊 Dashboard Analytics
```http
GET /analytics/overview
GET /analytics/sales
GET /analytics/products
GET /analytics/users
```

**Analytics Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 1250000,
    "totalOrders": 850,
    "totalUsers": 1200,
    "topProducts": [
      {
        "id": "prod_001",
        "name": "iPhone 15 Pro",
        "sales": 125000,
        "units": 50
      }
    ]
  }
}
```

##### 🛠️ Product Management
```http
GET /admin/products
POST /admin/products
PUT /admin/products/{id}
DELETE /admin/products/{id}
```

---

## 🔧 Backend Services APIs

### 🚪 API Gateway

#### Base URL
```
https://api.ecommerce.local
```

#### Health Check
```http
GET /health
```

#### Rate Limiting
- **Rate Limit**: 1000 requests/hour per IP
- **Headers**: 
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`

### 🔐 Auth Service

#### Base URL
```
https://api.ecommerce.local/auth
```

#### Endpoints

##### Authentication
```http
POST /login
POST /register
POST /logout
POST /refresh
POST /forgot-password
POST /reset-password
```

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "expiresIn": 3600
  }
}
```

##### OAuth Integration
```http
GET /oauth/google
GET /oauth/facebook
GET /oauth/callback/{provider}
```

### 👤 User Service

#### Base URL
```
https://api.ecommerce.local/users
```

#### Endpoints

##### User Management
```http
GET /users/{id}
PUT /users/{id}
DELETE /users/{id}
GET /users/{id}/profile
PUT /users/{id}/profile
```

**User Profile Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+66812345678",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "addresses": [
        {
          "id": "addr_001",
          "type": "home",
          "street": "123 Main St",
          "city": "Bangkok",
          "province": "Bangkok",
          "postalCode": "10110",
          "country": "Thailand",
          "isDefault": true
        }
      ]
    },
    "preferences": {
      "language": "th",
      "currency": "THB",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  }
}
```

##### Address Management
```http
GET /users/{id}/addresses
POST /users/{id}/addresses
PUT /users/{id}/addresses/{addressId}
DELETE /users/{id}/addresses/{addressId}
```

### 📦 Product Service

#### Base URL
```
https://api.ecommerce.local/products
```

#### Endpoints

##### Product Catalog
```http
GET /products
GET /products/{id}
POST /products
PUT /products/{id}
DELETE /products/{id}
```

**Product Details Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_001",
    "sku": "IPH15PRO256BLK",
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with A17 Pro chip",
    "category": {
      "id": "cat_001",
      "name": "Smartphones",
      "slug": "smartphones"
    },
    "brand": {
      "id": "brand_001",
      "name": "Apple",
      "slug": "apple"
    },
    "price": {
      "regular": 39900,
      "sale": 35900,
      "currency": "THB"
    },
    "inventory": {
      "stock": 50,
      "reserved": 5,
      "available": 45
    },
    "attributes": {
      "color": "Black",
      "storage": "256GB",
      "weight": "187g"
    },
    "images": [
      {
        "id": "img_001",
        "url": "https://cdn.ecommerce.local/products/iphone15pro_1.jpg",
        "alt": "iPhone 15 Pro Front View",
        "isPrimary": true
      }
    ],
    "seo": {
      "title": "iPhone 15 Pro - 256GB Black",
      "description": "Buy iPhone 15 Pro with A17 Pro chip",
      "keywords": ["iphone", "apple", "smartphone"]
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

##### Search & Filtering
```http
GET /products/search?q={query}
GET /products/filter?category={cat}&price_min={min}&price_max={max}
GET /products/recommendations/{userId}
```

##### Categories
```http
GET /categories
GET /categories/{id}
POST /categories
PUT /categories/{id}
DELETE /categories/{id}
```

### 🛍️ Order Service

#### Base URL
```
https://api.ecommerce.local/orders
```

#### Endpoints

##### Order Management
```http
GET /orders
GET /orders/{id}
POST /orders
PUT /orders/{id}
DELETE /orders/{id}
```

**Create Order Request:**
```json
{
  "userId": "user_001",
  "items": [
    {
      "productId": "prod_001",
      "quantity": 1,
      "price": 35900,
      "options": {
        "color": "black",
        "storage": "256GB"
      }
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Bangkok",
    "province": "Bangkok",
    "postalCode": "10110",
    "country": "Thailand"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Bangkok",
    "province": "Bangkok",
    "postalCode": "10110",
    "country": "Thailand"
  },
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "couponCode": "SAVE10"
}
```

**Order Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_001",
    "orderNumber": "ORD-2024-001",
    "userId": "user_001",
    "status": "pending",
    "items": [
      {
        "id": "item_001",
        "productId": "prod_001",
        "productName": "iPhone 15 Pro",
        "quantity": 1,
        "unitPrice": 35900,
        "totalPrice": 35900
      }
    ],
    "summary": {
      "subtotal": 35900,
      "discount": 3590,
      "shipping": 100,
      "tax": 2513,
      "total": 34923
    },
    "payment": {
      "method": "credit_card",
      "status": "pending",
      "transactionId": null
    },
    "shipping": {
      "method": "standard",
      "trackingNumber": null,
      "estimatedDelivery": "2024-01-20"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

##### Order Status Updates
```http
PUT /orders/{id}/status
GET /orders/{id}/tracking
```

### 💳 Payment Service

#### Base URL
```
https://api.ecommerce.local/payments
```

#### Endpoints

##### Payment Processing
```http
POST /payments/process
GET /payments/{id}
POST /payments/{id}/refund
```

**Payment Request:**
```json
{
  "orderId": "order_001",
  "amount": 34923,
  "currency": "THB",
  "paymentMethod": "credit_card",
  "cardDetails": {
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "holderName": "John Doe"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Bangkok",
    "province": "Bangkok",
    "postalCode": "10110",
    "country": "Thailand"
  }
}
```

##### Payment Methods
```http
GET /payment-methods
POST /payment-methods/validate
```

##### Supported Payment Providers
- **Credit Cards**: Visa, MasterCard, JCB
- **Digital Wallets**: TrueMoney, PromptPay
- **Bank Transfer**: SCB, BBL, KTB
- **International**: PayPal, Stripe

### 🛒 Cart Service

#### Base URL
```
https://api.ecommerce.local/cart
```

#### Endpoints

##### Cart Management
```http
GET /cart/{userId}
POST /cart/{userId}/items
PUT /cart/{userId}/items/{itemId}
DELETE /cart/{userId}/items/{itemId}
DELETE /cart/{userId}
```

**Cart Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart_001",
    "userId": "user_001",
    "items": [
      {
        "id": "item_001",
        "productId": "prod_001",
        "productName": "iPhone 15 Pro",
        "quantity": 1,
        "unitPrice": 35900,
        "totalPrice": 35900,
        "options": {
          "color": "black",
          "storage": "256GB"
        }
      }
    ],
    "summary": {
      "itemCount": 1,
      "subtotal": 35900,
      "estimatedTax": 2513,
      "estimatedTotal": 38413
    },
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📊 Additional Services APIs

### 📦 Inventory Service

#### Base URL
```
https://api.ecommerce.local/inventory
```

#### Endpoints
```http
GET /inventory/{productId}
PUT /inventory/{productId}/stock
POST /inventory/reserve
POST /inventory/release
```

### 🚚 Shipping Service

#### Base URL
```
https://api.ecommerce.local/shipping
```

#### Endpoints
```http
GET /shipping/methods
POST /shipping/calculate
GET /shipping/tracking/{trackingNumber}
```

### 🎯 Promotion Service

#### Base URL
```
https://api.ecommerce.local/promotions
```

#### Endpoints
```http
GET /promotions
GET /promotions/{id}
POST /promotions/validate
GET /coupons/{code}
```

### ⭐ Review Service

#### Base URL
```
https://api.ecommerce.local/reviews
```

#### Endpoints
```http
GET /reviews/product/{productId}
POST /reviews
PUT /reviews/{id}
DELETE /reviews/{id}
```

### 🔔 Notification Service

#### Base URL
```
https://api.ecommerce.local/notifications
```

#### Endpoints
```http
GET /notifications/{userId}
POST /notifications/send
PUT /notifications/{id}/read
```

### 👨‍💼 Admin Service

#### Base URL
```
https://api.ecommerce.local/admin
```

#### Endpoints
```http
GET /admin/dashboard
GET /admin/users
GET /admin/orders
GET /admin/products
GET /admin/analytics
```

---

## 🔄 Event-Driven APIs

### Kafka Events

#### Event Types
```json
{
  "user.registered": {
    "userId": "user_001",
    "email": "user@example.com",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "order.created": {
    "orderId": "order_001",
    "userId": "user_001",
    "total": 34923,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "payment.completed": {
    "paymentId": "pay_001",
    "orderId": "order_001",
    "amount": 34923,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "inventory.updated": {
    "productId": "prod_001",
    "oldStock": 50,
    "newStock": 49,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_12345"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 📈 API Versioning

### URL Versioning
```
https://api.ecommerce.local/v1/products
https://api.ecommerce.local/v2/products
```

### Header Versioning
```http
Accept: application/vnd.ecommerce.v1+json
```

---

## 🔒 Security

### Rate Limiting
- **Public APIs**: 100 requests/minute
- **Authenticated APIs**: 1000 requests/minute
- **Admin APIs**: 10000 requests/minute

### CORS Policy
```javascript
{
  "origin": ["https://ecommerce.local", "https://admin.ecommerce.local"],
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"]
}
```

### Input Validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: CSRF tokens
- **Request Size Limits**: 10MB max

---

## 📝 API Testing

### Postman Collection
```json
{
  "info": {
    "name": "E-Commerce Platform APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  }
}
```

### Environment Variables
```json
{
  "base_url": "https://api.ecommerce.local",
  "jwt_token": "your_jwt_token_here",
  "api_key": "your_api_key_here"
}
```

---

**📋 API Specifications สมบูรณ์แล้ว! พร้อมสำหรับการพัฒนาและทดสอบ 🚀**

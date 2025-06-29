# 🗄️ Database Schemas - E-Commerce Platform

## 📖 ภาพรวม

เอกสารนี้รวบรวม database schemas ของทุก services ในระบบ E-Commerce Platform พร้อมด้วย relationships, indexes และ constraints

---

## 🏗️ Database Architecture

### Database Distribution
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     MongoDB     │    │      Redis      │
│   (Primary)     │    │   (Documents)   │    │     (Cache)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Users         │    │ • Cart Items    │    │ • Sessions      │
│ • Products      │    │ • Reviews       │    │ • Cache Data    │
│ • Orders        │    │ • Logs          │    │ • Rate Limits   │
│ • Payments      │    │ • Analytics     │    │ • Temp Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔐 User Management Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_phone_key UNIQUE (phone)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_preferences ON user_profiles USING GIN(preferences);
```

### User Addresses Table
```sql
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'home' CHECK (type IN ('home', 'work', 'other')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    street_address_1 VARCHAR(255) NOT NULL,
    street_address_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'TH',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_is_default ON user_addresses(user_id, is_default);
```

---

## 📦 Product Catalog Schema (PostgreSQL)

### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

### Brands Table
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_is_active ON brands(is_active);
```

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    
    -- Pricing
    regular_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Inventory
    track_inventory BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Physical attributes
    weight DECIMAL(8,2),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_price ON products(regular_price, sale_price);
CREATE INDEX idx_products_stock ON products(stock_quantity);
```

### Product Attributes Table
```sql
CREATE TABLE product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX idx_product_attributes_name ON product_attributes(name);
```

### Product Images Table
```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary);
```

### Product Variants Table
```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN(attributes);
```

---

## 🛍️ Order Management Schema (PostgreSQL)

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 
        'delivered', 'cancelled', 'refunded'
    )),
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Addresses
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Shipping
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
    )),
    payment_method VARCHAR(50),
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_image_url VARCHAR(500),
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product options at time of order
    product_options JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

## 💳 Payment Schema (PostgreSQL)

### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- External references
    transaction_id VARCHAR(255),
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### Payment Refunds Table
```sql
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    provider_refund_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);
```

---

## 🎯 Promotion Schema (PostgreSQL)

### Promotions Table
```sql
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL,
    
    -- Conditions
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_limit_per_user INTEGER,
    
    -- Validity
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Targeting
    applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'categories', 'products', 'users')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_promotions_is_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(starts_at, ends_at);
CREATE INDEX idx_promotions_type ON promotions(type);
```

### Coupons Table
```sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_promotion_id ON coupons(promotion_id);
```

---

## 📊 Analytics Schema (PostgreSQL)

### Order Analytics Table
```sql
CREATE TABLE order_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_order_analytics_date ON order_analytics(date);
```

### Product Analytics Table
```sql
CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_product_analytics_product_date ON product_analytics(product_id, date);
CREATE INDEX idx_product_analytics_date ON product_analytics(date);
```

---

## 🛒 Cart Schema (MongoDB)

### Cart Collection
```javascript
{
  _id: ObjectId("..."),
  userId: "user_001",
  sessionId: "session_123", // for guest users
  items: [
    {
      productId: "prod_001",
      productVariantId: "variant_001", // optional
      quantity: 2,
      unitPrice: 35900,
      totalPrice: 71800,
      addedAt: ISODate("2024-01-15T10:30:00Z"),
      options: {
        color: "black",
        storage: "256GB"
      }
    }
  ],
  summary: {
    itemCount: 2,
    subtotal: 71800,
    estimatedTax: 5026,
    estimatedTotal: 76826
  },
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z"),
  expiresAt: ISODate("2024-01-22T10:00:00Z") // TTL index
}
```

### Cart Indexes
```javascript
// MongoDB Indexes
db.carts.createIndex({ "userId": 1 })
db.carts.createIndex({ "sessionId": 1 })
db.carts.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.carts.createIndex({ "updatedAt": 1 })
```

---

## ⭐ Reviews Schema (MongoDB)

### Reviews Collection
```javascript
{
  _id: ObjectId("..."),
  productId: "prod_001",
  userId: "user_001",
  orderId: "order_001", // to verify purchase
  rating: 5,
  title: "Excellent product!",
  comment: "Really happy with this purchase. Great quality and fast delivery.",
  images: [
    {
      url: "https://cdn.ecommerce.local/reviews/img1.jpg",
      alt: "Product in use"
    }
  ],
  helpful: {
    yes: 15,
    no: 2
  },
  verified: true, // verified purchase
  status: "approved", // pending, approved, rejected
  moderatorNotes: "",
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

### Reviews Indexes
```javascript
db.reviews.createIndex({ "productId": 1, "status": 1 })
db.reviews.createIndex({ "userId": 1 })
db.reviews.createIndex({ "rating": 1 })
db.reviews.createIndex({ "createdAt": -1 })
db.reviews.createIndex({ "verified": 1 })
```

---

## 🔔 Notifications Schema (MongoDB)

### Notifications Collection
```javascript
{
  _id: ObjectId("..."),
  userId: "user_001",
  type: "order_shipped", // order_confirmed, payment_received, etc.
  title: "Your order has been shipped!",
  message: "Your order #ORD-2024-001 is on its way.",
  data: {
    orderId: "order_001",
    trackingNumber: "TH123456789"
  },
  channels: {
    email: {
      sent: true,
      sentAt: ISODate("2024-01-15T10:30:00Z")
    },
    push: {
      sent: true,
      sentAt: ISODate("2024-01-15T10:30:00Z")
    },
    sms: {
      sent: false,
      reason: "User opted out"
    }
  },
  read: false,
  readAt: null,
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

---

## 📊 Logs Schema (MongoDB)

### Activity Logs Collection
```javascript
{
  _id: ObjectId("..."),
  userId: "user_001",
  action: "product_view",
  resource: "products",
  resourceId: "prod_001",
  details: {
    userAgent: "Mozilla/5.0...",
    ipAddress: "192.168.1.1",
    referrer: "https://google.com"
  },
  timestamp: ISODate("2024-01-15T10:30:00Z")
}
```

---

## 🔄 Redis Cache Schema

### Session Storage
```redis
# User sessions
session:user_001 = {
  "userId": "user_001",
  "email": "user@example.com",
  "role": "customer",
  "loginAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-15T14:30:00Z"
}

# Shopping cart cache
cart:user_001 = {
  "items": [...],
  "summary": {...},
  "updatedAt": "2024-01-15T10:30:00Z"
}

# Product cache
product:prod_001 = {
  "id": "prod_001",
  "name": "iPhone 15 Pro",
  "price": 35900,
  "stock": 45,
  "cachedAt": "2024-01-15T10:30:00Z"
}

# Rate limiting
rate_limit:api:192.168.1.1 = {
  "count": 95,
  "resetAt": "2024-01-15T11:00:00Z"
}
```

---

## 🔍 Search Schema (Elasticsearch)

### Products Index
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": { 
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { "type": "text" },
      "category": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" }
        }
      },
      "brand": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" }
        }
      },
      "price": { "type": "double" },
      "stock": { "type": "integer" },
      "rating": { "type": "float" },
      "tags": { "type": "keyword" },
      "attributes": { "type": "object" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
```

---

## 🔗 Database Relationships

### Entity Relationship Diagram
```
Users (1) ──── (M) Orders
  │                 │
  │                 │
  └── (M) UserAddresses
  │
  └── (1) UserProfiles

Products (1) ──── (M) OrderItems
  │                    │
  │                    │
  ├── (M) ProductImages
  ├── (M) ProductAttributes  
  ├── (M) ProductVariants
  └── (M) Categories (M) ──── (1) Categories (parent)

Orders (1) ──── (M) Payments
  │                 │
  │                 │
  └── (M) OrderItems

Promotions (1) ──── (M) Coupons
```

---

## 🔧 Database Maintenance

### Backup Strategy
```sql
-- Daily backups
pg_dump ecommerce_prod > backup_$(date +%Y%m%d).sql

-- Point-in-time recovery
SELECT pg_start_backup('daily_backup');
```

### Performance Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'cat_001';

-- Update statistics
ANALYZE products;

-- Reindex
REINDEX INDEX idx_products_category_id;
```

### Data Archiving
```sql
-- Archive old orders (older than 2 years)
CREATE TABLE orders_archive AS 
SELECT * FROM orders 
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM orders 
WHERE created_at < NOW() - INTERVAL '2 years';
```

---

## 📊 Database Monitoring

### Key Metrics
- **Connection Pool Usage**: < 80%
- **Query Response Time**: < 100ms (95th percentile)
- **Cache Hit Ratio**: > 95%
- **Disk Usage**: < 80%
- **Replication Lag**: < 1 second

### Monitoring Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('ecommerce'));
```

---

**🗄️ Database Schemas สมบูรณ์แล้ว! พร้อมสำหรับการพัฒนาและ deployment 🚀**

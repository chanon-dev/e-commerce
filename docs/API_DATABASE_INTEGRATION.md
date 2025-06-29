# 🔗 API & Database Integration Guide

## 📖 ภาพรวม

เอกสารนี้อธิบายการเชื่อมต่อระหว่าง APIs และ Database schemas พร้อมด้วย data flow, caching strategies และ performance optimization

---

## 🏗️ Service-Database Mapping

### Database Distribution by Service

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔐 Auth Service     ──────► PostgreSQL (users, sessions)  │
│  👤 User Service     ──────► PostgreSQL (profiles, addr)   │
│  📦 Product Service  ──────► PostgreSQL + Elasticsearch    │
│  🛍️ Order Service    ──────► PostgreSQL (orders, items)    │
│  💳 Payment Service  ──────► PostgreSQL (payments, refunds)│
│  🛒 Cart Service     ──────► MongoDB (cart collections)    │
│  📊 Inventory Service──────► PostgreSQL (stock tracking)   │
│  🚚 Shipping Service ──────► PostgreSQL (shipping data)    │
│  🎯 Promotion Service──────► PostgreSQL (promotions, coup) │
│  ⭐ Review Service   ──────► MongoDB (reviews collection)   │
│  🔔 Notification Svc ──────► MongoDB (notifications)       │
│  👨‍💼 Admin Service    ──────► All databases (read access)   │
│                                                             │
│  🔄 Redis Cache      ──────► All services (caching layer)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Auth Service Integration

### API Endpoints → Database Operations

#### POST /auth/login
```javascript
// API Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Database Operations
1. SELECT * FROM users WHERE email = $1 AND status = 'active'
2. Verify password hash
3. INSERT INTO user_sessions (user_id, token, expires_at)
4. Redis: SET session:token user_data EX 3600

// API Response
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": { ... }
}
```

#### POST /auth/register
```javascript
// Database Transaction
BEGIN;
  INSERT INTO users (email, password_hash, first_name, last_name);
  INSERT INTO user_profiles (user_id, preferences, settings);
  INSERT INTO user_addresses (user_id, ...); -- if provided
COMMIT;

// Event Publishing
PUBLISH user.registered {
  "userId": "user_001",
  "email": "user@example.com"
}
```

---

## 👤 User Service Integration

### API Endpoints → Database Operations

#### GET /users/{id}/profile
```sql
-- Single query with JOIN
SELECT 
  u.id, u.email, u.first_name, u.last_name,
  up.avatar_url, up.bio, up.preferences, up.settings,
  json_agg(
    json_build_object(
      'id', ua.id,
      'type', ua.type,
      'street_address_1', ua.street_address_1,
      'city', ua.city,
      'is_default', ua.is_default
    )
  ) as addresses
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_addresses ua ON u.id = ua.user_id
WHERE u.id = $1
GROUP BY u.id, up.id;
```

#### PUT /users/{id}/profile
```javascript
// Database Transaction with Optimistic Locking
BEGIN;
  UPDATE user_profiles 
  SET avatar_url = $1, bio = $2, preferences = $3, 
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $4 AND updated_at = $5; -- optimistic lock
  
  -- Check if update affected any rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'Profile was modified by another process';
  END IF;
COMMIT;

// Cache Invalidation
Redis: DEL user:profile:user_001
```

---

## 📦 Product Service Integration

### Multi-Database Strategy

#### GET /products/{id}
```javascript
// 1. Check Redis Cache
const cached = await redis.get(`product:${id}`);
if (cached) return JSON.parse(cached);

// 2. Query PostgreSQL
const product = await db.query(`
  SELECT 
    p.*,
    c.name as category_name, c.slug as category_slug,
    b.name as brand_name, b.slug as brand_slug,
    json_agg(
      json_build_object(
        'url', pi.url,
        'alt_text', pi.alt_text,
        'is_primary', pi.is_primary
      ) ORDER BY pi.sort_order
    ) as images,
    json_agg(
      json_build_object(
        'name', pa.name,
        'value', pa.value
      ) ORDER BY pa.sort_order
    ) as attributes
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  LEFT JOIN product_images pi ON p.id = pi.product_id
  LEFT JOIN product_attributes pa ON p.id = pa.product_id
  WHERE p.id = $1 AND p.status = 'active'
  GROUP BY p.id, c.id, b.id
`);

// 3. Cache Result
await redis.setex(`product:${id}`, 3600, JSON.stringify(product));

return product;
```

#### POST /products/search
```javascript
// Elasticsearch Query
const searchResults = await elasticsearch.search({
  index: 'products',
  body: {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: searchTerm,
              fields: ['name^3', 'description', 'brand.name^2']
            }
          }
        ],
        filter: [
          { term: { status: 'active' } },
          { range: { stock: { gt: 0 } } }
        ]
      }
    },
    aggs: {
      categories: {
        terms: { field: 'category.id' }
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 1000 },
            { from: 1000, to: 5000 },
            { from: 5000 }
          ]
        }
      }
    }
  }
});
```

---

## 🛍️ Order Service Integration

### Complex Transaction Handling

#### POST /orders
```javascript
// Multi-step Transaction
BEGIN;

// 1. Create Order
const order = await db.query(`
  INSERT INTO orders (
    order_number, user_id, status, subtotal, tax_amount, 
    shipping_amount, total_amount, billing_address, shipping_address
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING *
`);

// 2. Create Order Items
for (const item of orderItems) {
  await db.query(`
    INSERT INTO order_items (
      order_id, product_id, product_name, product_sku,
      unit_price, quantity, total_price, product_options
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `);
  
  // 3. Update Inventory
  const stockUpdate = await db.query(`
    UPDATE products 
    SET stock_quantity = stock_quantity - $1
    WHERE id = $2 AND stock_quantity >= $1
    RETURNING stock_quantity
  `);
  
  if (stockUpdate.rowCount === 0) {
    ROLLBACK;
    throw new Error(`Insufficient stock for product ${item.productId}`);
  }
}

// 4. Apply Promotions
if (couponCode) {
  await db.query(`
    UPDATE coupons 
    SET usage_count = usage_count + 1
    WHERE code = $1
  `);
}

COMMIT;

// 5. Publish Events
await publishEvent('order.created', {
  orderId: order.id,
  userId: order.user_id,
  total: order.total_amount
});

// 6. Clear Cart
await mongodb.deleteOne('carts', { userId: order.user_id });
```

---

## 🛒 Cart Service Integration (MongoDB)

### Document-Based Operations

#### GET /cart/{userId}
```javascript
// MongoDB Aggregation Pipeline
const cart = await db.collection('carts').aggregate([
  { $match: { userId: userId } },
  {
    $lookup: {
      from: 'products', // Assuming products are also in MongoDB
      localField: 'items.productId',
      foreignField: '_id',
      as: 'productDetails'
    }
  },
  {
    $addFields: {
      'items': {
        $map: {
          input: '$items',
          as: 'item',
          in: {
            $mergeObjects: [
              '$$item',
              {
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$productDetails',
                        cond: { $eq: ['$$this._id', '$$item.productId'] }
                      }
                    },
                    0
                  ]
                }
              }
            ]
          }
        }
      }
    }
  }
]).toArray();
```

#### POST /cart/{userId}/items
```javascript
// Upsert Operation with Atomic Updates
await db.collection('carts').updateOne(
  { 
    userId: userId,
    'items.productId': productId 
  },
  {
    $inc: { 'items.$.quantity': quantity },
    $set: { 
      'items.$.updatedAt': new Date(),
      'updatedAt': new Date()
    }
  }
);

// If no existing item found, add new item
const result = await db.collection('carts').updateOne(
  { 
    userId: userId,
    'items.productId': { $ne: productId }
  },
  {
    $push: {
      items: {
        productId: productId,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * quantity,
        addedAt: new Date(),
        options: options
      }
    },
    $set: { updatedAt: new Date() }
  },
  { upsert: true }
);
```

---

## 💳 Payment Service Integration

### Payment Processing Flow

#### POST /payments/process
```javascript
// 1. Validate Order
const order = await db.query(`
  SELECT * FROM orders 
  WHERE id = $1 AND status = 'pending' AND payment_status = 'pending'
`);

if (!order) throw new Error('Invalid order');

// 2. Create Payment Record
BEGIN;
const payment = await db.query(`
  INSERT INTO payments (
    order_id, payment_method, payment_provider, amount, currency, status
  ) VALUES ($1, $2, $3, $4, $5, 'processing')
  RETURNING *
`);

try {
  // 3. Process with External Provider
  const providerResponse = await paymentProvider.charge({
    amount: payment.amount,
    currency: payment.currency,
    source: paymentDetails.token,
    metadata: { orderId: order.id }
  });

  // 4. Update Payment Status
  await db.query(`
    UPDATE payments 
    SET status = $1, transaction_id = $2, provider_transaction_id = $3,
        provider_response = $4, processed_at = CURRENT_TIMESTAMP
    WHERE id = $5
  `, [
    providerResponse.status === 'succeeded' ? 'completed' : 'failed',
    providerResponse.id,
    providerResponse.balance_transaction,
    JSON.stringify(providerResponse),
    payment.id
  ]);

  // 5. Update Order Status
  if (providerResponse.status === 'succeeded') {
    await db.query(`
      UPDATE orders 
      SET payment_status = 'paid', status = 'confirmed'
      WHERE id = $1
    `);
  }

  COMMIT;

  // 6. Publish Events
  await publishEvent('payment.completed', {
    paymentId: payment.id,
    orderId: order.id,
    amount: payment.amount,
    status: 'completed'
  });

} catch (error) {
  ROLLBACK;
  throw error;
}
```

---

## 📊 Caching Strategies

### Multi-Level Caching

#### Level 1: Application Cache (Redis)
```javascript
// Product Cache with TTL
const cacheKey = `product:${productId}`;
const cached = await redis.get(cacheKey);

if (!cached) {
  const product = await fetchFromDatabase(productId);
  await redis.setex(cacheKey, 3600, JSON.stringify(product)); // 1 hour TTL
  return product;
}

return JSON.parse(cached);
```

#### Level 2: Query Result Cache
```javascript
// Cache expensive aggregation queries
const cacheKey = `analytics:daily:${date}`;
const cached = await redis.get(cacheKey);

if (!cached) {
  const analytics = await db.query(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM orders 
    WHERE DATE(created_at) = $1
  `);
  
  await redis.setex(cacheKey, 86400, JSON.stringify(analytics)); // 24 hours
  return analytics;
}
```

#### Level 3: CDN Cache
```javascript
// Static content caching
app.get('/api/products/:id/images', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=31536000', // 1 year
    'ETag': generateETag(req.params.id),
    'Last-Modified': product.updatedAt
  });
});
```

---

## 🔄 Event-Driven Architecture

### Event Publishing & Consumption

#### Event Publishers
```javascript
// Order Service publishes events
class OrderEventPublisher {
  async publishOrderCreated(order) {
    await kafka.publish('order.created', {
      orderId: order.id,
      userId: order.user_id,
      items: order.items,
      total: order.total_amount,
      timestamp: new Date().toISOString()
    });
  }

  async publishOrderStatusChanged(orderId, oldStatus, newStatus) {
    await kafka.publish('order.status_changed', {
      orderId,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### Event Consumers
```javascript
// Inventory Service consumes order events
class InventoryEventConsumer {
  async handleOrderCreated(event) {
    const { orderId, items } = event;
    
    for (const item of items) {
      await db.query(`
        INSERT INTO inventory_transactions (
          product_id, type, quantity, reference_id, reference_type
        ) VALUES ($1, 'reserved', $2, $3, 'order')
      `, [item.productId, item.quantity, orderId]);
    }
  }

  async handleOrderCancelled(event) {
    const { orderId } = event;
    
    // Release reserved inventory
    await db.query(`
      UPDATE inventory_transactions 
      SET type = 'released'
      WHERE reference_id = $1 AND reference_type = 'order'
    `, [orderId]);
  }
}
```

---

## 🔍 Search Integration

### Elasticsearch Synchronization

#### Real-time Indexing
```javascript
// Product Service updates Elasticsearch
class ProductSearchSync {
  async syncProductToElasticsearch(product) {
    const searchDocument = {
      id: product.id,
      name: product.name,
      description: product.description,
      category: {
        id: product.category_id,
        name: product.category_name
      },
      brand: {
        id: product.brand_id,
        name: product.brand_name
      },
      price: product.regular_price,
      salePrice: product.sale_price,
      stock: product.stock_quantity,
      rating: await this.calculateAverageRating(product.id),
      tags: product.tags,
      attributes: product.attributes,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };

    await elasticsearch.index({
      index: 'products',
      id: product.id,
      body: searchDocument
    });
  }

  async removeProductFromElasticsearch(productId) {
    await elasticsearch.delete({
      index: 'products',
      id: productId
    });
  }
}
```

---

## 📊 Performance Optimization

### Database Query Optimization

#### Connection Pooling
```javascript
// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Query Optimization
```sql
-- Use EXPLAIN ANALYZE to optimize queries
EXPLAIN ANALYZE 
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active' 
  AND p.stock_quantity > 0
  AND c.is_active = true
ORDER BY p.created_at DESC
LIMIT 20;

-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_products_status_stock 
ON products(status, stock_quantity) 
WHERE status = 'active';
```

#### Batch Operations
```javascript
// Bulk insert for better performance
const insertOrderItems = async (orderItems) => {
  const values = orderItems.map(item => 
    `('${item.orderId}', '${item.productId}', '${item.productName}', 
      ${item.unitPrice}, ${item.quantity}, ${item.totalPrice})`
  ).join(',');

  await db.query(`
    INSERT INTO order_items (
      order_id, product_id, product_name, unit_price, quantity, total_price
    ) VALUES ${values}
  `);
};
```

---

## 🔐 Security Considerations

### SQL Injection Prevention
```javascript
// Always use parameterized queries
const getUserById = async (userId) => {
  // ✅ Safe - parameterized query
  return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  // ❌ Dangerous - string concatenation
  // return await db.query(`SELECT * FROM users WHERE id = '${userId}'`);
};
```

### Data Encryption
```javascript
// Encrypt sensitive data before storing
const encryptSensitiveData = (data) => {
  return crypto.encrypt(data, process.env.ENCRYPTION_KEY);
};

// Store encrypted payment information
const storePaymentMethod = async (userId, paymentData) => {
  const encryptedData = encryptSensitiveData(paymentData);
  
  await db.query(`
    INSERT INTO user_payment_methods (user_id, encrypted_data)
    VALUES ($1, $2)
  `, [userId, encryptedData]);
};
```

---

## 📈 Monitoring & Observability

### Database Monitoring
```javascript
// Monitor query performance
const monitorQuery = async (queryName, queryFn) => {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > 1000) {
      logger.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    // Send metrics to monitoring system
    metrics.histogram('database.query.duration', duration, {
      query: queryName,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    metrics.counter('database.query.errors', 1, {
      query: queryName,
      error: error.name
    });
    throw error;
  }
};
```

### Health Checks
```javascript
// Database health check endpoint
app.get('/health/database', async (req, res) => {
  try {
    // Check PostgreSQL
    await db.query('SELECT 1');
    
    // Check MongoDB
    await mongodb.admin().ping();
    
    // Check Redis
    await redis.ping();
    
    // Check Elasticsearch
    await elasticsearch.ping();
    
    res.json({
      status: 'healthy',
      databases: {
        postgresql: 'connected',
        mongodb: 'connected',
        redis: 'connected',
        elasticsearch: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

**🔗 API & Database Integration สมบูรณ์แล้ว! พร้อมสำหรับการพัฒนา production-ready applications 🚀**

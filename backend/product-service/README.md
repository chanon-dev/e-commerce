# 📦 Product Service

A comprehensive product management microservice built with Go, following Clean Architecture and Domain-Driven Design principles.

## 🏗️ Architecture

This service implements Clean Architecture with the following layers:

- **Domain Layer**: Core business logic, entities, and repository interfaces
- **Application Layer**: Use cases, business services, and application logic
- **Infrastructure Layer**: Database access, external services, and technical concerns
- **Interface Layer**: HTTP handlers, middleware, and API presentation

## 🚀 Features

### Core Functionality
- ✅ Product catalog management
- ✅ Category and brand management
- ✅ Product variants and options
- ✅ Image and video management
- ✅ Inventory tracking
- ✅ Advanced search and filtering
- ✅ SEO optimization

### Technical Features
- ✅ Clean Architecture with DDD
- ✅ Hexagonal Architecture (Ports & Adapters)
- ✅ GORM for database operations
- ✅ Gin framework for HTTP server
- ✅ PostgreSQL with JSONB support
- ✅ Redis for caching
- ✅ Comprehensive API documentation
- ✅ Docker containerization
- ✅ Health checks and monitoring

### Domain Features
- **Rich Product Models**: Complex product structures with variants
- **Category Hierarchy**: Nested categories with path management
- **Brand Management**: Brand association and statistics
- **Inventory Control**: Stock tracking with backorder support
- **Media Management**: Images and videos with metadata
- **SEO Support**: Slugs, meta tags, and search optimization

## 🛠️ Technology Stack

- **Go 1.21**: Latest Go version
- **Gin**: HTTP web framework
- **GORM**: ORM for database operations
- **PostgreSQL**: Primary database with JSONB support
- **Redis**: Caching and session storage
- **Swagger**: API documentation
- **Docker**: Containerization
- **UUID**: Unique identifiers

## 📁 Project Structure

```
product-service/
├── cmd/
│   └── server/              # Application entry point
│       └── main.go
├── internal/
│   ├── domain/              # Domain layer
│   │   ├── entities/        # Domain entities
│   │   └── repositories/    # Repository interfaces
│   ├── application/         # Application layer
│   │   └── services/        # Business services
│   ├── infrastructure/      # Infrastructure layer
│   │   └── database/        # Database implementations
│   └── interfaces/          # Interface layer
│       └── http/            # HTTP handlers and middleware
├── docs/                    # API documentation
├── docker-compose.yml       # Docker services
├── Dockerfile              # Container definition
├── go.mod                  # Go modules
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Running with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce/backend/product-service
```

2. **Create Docker network**
```bash
docker network create ecommerce-network
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Access the API**
- API: http://localhost:3003
- Swagger UI: http://localhost:3003/swagger/index.html
- Health Check: http://localhost:3003/health

### Running Locally

1. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Install dependencies**
```bash
go mod download
```

3. **Run database migrations**
```bash
# Database will be auto-migrated on startup
```

4. **Start the application**
```bash
go run cmd/server/main.go
```

## 📊 Database Schema

### Core Tables
- **products**: Main product information
- **categories**: Product categories with hierarchy
- **brands**: Product brands
- **product_variants**: Product variations (size, color, etc.)
- **product_images**: Product and variant images
- **product_videos**: Product videos

### Key Features
- **JSONB Support**: Flexible attributes and metadata
- **UUID Primary Keys**: Distributed system friendly
- **Soft Deletes**: Data preservation
- **Audit Fields**: Created/updated tracking
- **Optimized Indexes**: Performance optimization

## 🔍 API Endpoints

### Product Management
```
POST   /api/v1/products              # Create product
GET    /api/v1/products/{id}         # Get product by ID
GET    /api/v1/products/sku/{sku}    # Get product by SKU
GET    /api/v1/products/slug/{slug}  # Get product by slug
PUT    /api/v1/products/{id}         # Update product
DELETE /api/v1/products/{id}         # Delete product
```

### Product Discovery
```
GET    /api/v1/products/search       # Search products
GET    /api/v1/products/featured     # Get featured products
GET    /api/v1/products/category/{id} # Get products by category
GET    /api/v1/products/brand/{id}   # Get products by brand
```

### Inventory Management
```
PUT    /api/v1/products/{id}/stock   # Update product stock
```

### Utility Endpoints
```
GET    /health                       # Health check
GET    /swagger/*                    # API documentation
```

## 🔍 Search & Filtering

The service supports advanced search and filtering:

### Search Parameters
- **q**: Text search across name, description
- **category_ids**: Filter by categories
- **brand_ids**: Filter by brands
- **min_price/max_price**: Price range filtering
- **in_stock**: Stock availability filter
- **featured**: Featured products filter
- **status**: Product status filter
- **tags**: Tag-based filtering

### Example Search Request
```bash
GET /api/v1/products/search?q=laptop&category_ids=electronics&min_price=500&max_price=2000&in_stock=true&page=1&page_size=20
```

## 📦 Product Data Model

### Product Entity
```json
{
  "id": "uuid",
  "sku": "string",
  "name": "string",
  "description": "string",
  "price": 99.99,
  "compare_price": 129.99,
  "stock_quantity": 100,
  "category_id": "uuid",
  "brand_id": "uuid",
  "images": [...],
  "variants": [...],
  "attributes": {...},
  "tags": [...],
  "status": "active",
  "visibility": "visible",
  "featured": true
}
```

### Category Hierarchy
```json
{
  "id": "uuid",
  "name": "Electronics",
  "slug": "electronics",
  "parent_id": null,
  "children": [
    {
      "id": "uuid",
      "name": "Computers",
      "slug": "computers",
      "parent_id": "parent-uuid"
    }
  ]
}
```

## 🧪 Testing

### Run Tests
```bash
go test ./...
```

### Run with Coverage
```bash
go test -cover ./...
```

### API Testing
Use the Swagger UI at `/swagger/index.html` for interactive API testing.

## 📈 Monitoring & Observability

### Health Checks
- Database connectivity
- Redis connectivity
- Service health status

### Metrics
- Request/response metrics
- Database query performance
- Business metrics (products, categories, etc.)

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Performance monitoring

## 🔧 Configuration

### Environment Variables
```bash
# Server
PORT=3003
GIN_MODE=release

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=product_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# External Services
USER_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3004
```

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t product-service .
docker run -p 3003:3003 product-service
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Production Considerations
- Use environment-specific configurations
- Set up proper logging and monitoring
- Configure database connection pooling
- Implement caching strategies
- Set up backup procedures

## 🔄 Integration

### Event Publishing
The service publishes events for:
- Product created/updated/deleted
- Stock level changes
- Category changes
- Brand changes

### External Dependencies
- User Service: User authentication
- Order Service: Order processing
- Inventory Service: Stock management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- Follow Go conventions
- Write comprehensive tests
- Use meaningful commit messages
- Document public APIs

## 📚 Documentation

- [API Documentation](http://localhost:3003/swagger/index.html)
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DB_HOST $DB_PORT $DB_USER
```

**Performance Issues**
```bash
# Check database indexes
# Monitor query performance
# Review caching strategy
```

**Memory Issues**
```bash
# Monitor Go memory usage
# Check for memory leaks
# Optimize database queries
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- Go community for excellent libraries and tools
- Gin framework for HTTP handling
- GORM for database operations

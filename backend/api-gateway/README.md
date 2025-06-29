# 🌐 API Gateway

A comprehensive API Gateway for the e-commerce microservices platform, built with NestJS. This gateway serves as the unified entry point for all client applications, providing routing, authentication, rate limiting, load balancing, and monitoring capabilities.

## 🏗️ Architecture

The API Gateway implements several key patterns:

- **Gateway Pattern**: Single entry point for all client requests
- **Service Discovery**: Dynamic service registration and health monitoring
- **Circuit Breaker**: Fault tolerance and resilience
- **Load Balancing**: Distribute requests across service instances
- **Authentication Gateway**: Centralized authentication and authorization
- **Request/Response Transformation**: Protocol translation and data formatting

## 🚀 Features

### Core Gateway Features
- ✅ **Request Routing**: Intelligent routing to microservices
- ✅ **Service Discovery**: Automatic service registration and health checks
- ✅ **Load Balancing**: Multiple strategies (Round Robin, Health-based, etc.)
- ✅ **Circuit Breaker**: Fault tolerance with automatic recovery
- ✅ **Rate Limiting**: Protection against abuse and overload
- ✅ **Request/Response Caching**: Performance optimization

### Security Features
- ✅ **Authentication Gateway**: JWT token validation
- ✅ **Authorization**: Role-based access control
- ✅ **CORS Handling**: Cross-origin request management
- ✅ **Security Headers**: Helmet integration for security
- ✅ **Request Sanitization**: Input validation and sanitization

### Monitoring & Observability
- ✅ **Health Monitoring**: Service health checks and status
- ✅ **Request Logging**: Comprehensive request/response logging
- ✅ **Performance Metrics**: Response times and throughput
- ✅ **Error Tracking**: Error rates and failure analysis
- ✅ **Admin Dashboard**: Real-time monitoring and management

### Resilience Features
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Timeout Handling**: Request timeout management
- ✅ **Graceful Degradation**: Fallback responses
- ✅ **Service Isolation**: Prevent cascade failures

## 🛠️ Technology Stack

- **NestJS**: Node.js framework for scalable applications
- **TypeScript**: Type-safe development
- **Redis**: Caching and session storage
- **Axios**: HTTP client for service communication
- **Bull**: Background job processing
- **Swagger**: API documentation
- **Helmet**: Security middleware
- **Docker**: Containerization

## 📁 Project Structure

```
api-gateway/
├── src/
│   ├── gateway/                 # Gateway core module
│   │   ├── controllers/         # HTTP controllers
│   │   ├── services/           # Business services
│   │   ├── guards/             # Authentication guards
│   │   ├── interceptors/       # Request/response interceptors
│   │   ├── resolvers/          # Route resolvers
│   │   └── filters/            # Exception filters
│   ├── common/                 # Shared utilities
│   ├── config/                 # Configuration files
│   └── main.ts                 # Application entry point
├── test/                       # Test files
├── docker-compose.yml          # Docker services
├── Dockerfile                  # Container definition
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Redis 7+
- Docker (optional)
- Running microservices (Auth, User, Product services)

### Running with Docker

1. **Create Docker network** (if not exists)
```bash
docker network create ecommerce-network
```

2. **Start the gateway**
```bash
docker-compose up -d
```

3. **Access the gateway**
- API Gateway: http://localhost:8080
- API Documentation: http://localhost:8080/api/docs
- Health Check: http://localhost:8080/health
- Admin Panel: http://localhost:8080/api/v1/admin

### Running Locally

1. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Redis**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

4. **Start the application**
```bash
npm run start:dev
```

## 🔀 Service Routing

The gateway automatically routes requests to appropriate microservices:

### Authentication Routes
```
POST   /api/v1/auth/login          → auth-service
POST   /api/v1/auth/register       → auth-service
POST   /api/v1/auth/refresh        → auth-service
GET    /api/v1/auth/me             → auth-service
```

### User Management Routes
```
GET    /api/v1/users               → user-service
GET    /api/v1/users/:id           → user-service
PUT    /api/v1/users/:id           → user-service
POST   /api/v1/users               → user-service
```

### Product Catalog Routes
```
GET    /api/v1/products            → product-service
GET    /api/v1/products/:id        → product-service
GET    /api/v1/products/search     → product-service
POST   /api/v1/products            → product-service
```

### Order Management Routes
```
GET    /api/v1/orders              → order-service
POST   /api/v1/orders              → order-service
GET    /api/v1/orders/:id          → order-service
PUT    /api/v1/orders/:id          → order-service
```

### Payment Processing Routes
```
POST   /api/v1/payments            → payment-service
GET    /api/v1/payments/:id        → payment-service
POST   /api/v1/payments/refund     → payment-service
```

### Shopping Cart Routes
```
GET    /api/v1/cart                → cart-service
POST   /api/v1/cart/items          → cart-service
PUT    /api/v1/cart/items/:id      → cart-service
DELETE /api/v1/cart/items/:id      → cart-service
```

## 🛡️ Security Features

### Authentication
- JWT token validation with auth service
- Token caching for performance
- Automatic token refresh handling
- Session management

### Authorization
- Role-based access control (RBAC)
- Permission-based authorization
- Resource-level security
- Admin-only endpoints protection

### Rate Limiting
- Global rate limiting: 1000 requests/minute
- Per-endpoint rate limiting
- IP-based throttling
- Burst protection

### Security Headers
```typescript
// Helmet configuration
helmet({
  contentSecurityPolicy: false, // For development
  crossOriginEmbedderPolicy: false,
  // Other security headers enabled by default
})
```

## ⚡ Performance Features

### Caching
- Response caching for GET requests
- Cache invalidation strategies
- Redis-based distributed caching
- Cache warming for critical endpoints

### Load Balancing
- Health-based load balancing
- Round-robin distribution
- Weighted round-robin
- Least connections algorithm

### Circuit Breaker
```typescript
// Circuit breaker configuration
{
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 3,      // Close after 3 successes
  timeout: 60000,           // 1 minute timeout
  monitoringPeriod: 300000  // 5 minutes monitoring
}
```

## 📊 Monitoring & Admin

### Health Monitoring
```bash
# Check overall system health
GET /api/v1/admin/health

# Check specific service
GET /api/v1/admin/services/user-service

# Trigger manual health check
POST /api/v1/admin/services/user-service/health-check
```

### Circuit Breaker Management
```bash
# Get circuit breaker status
GET /api/v1/admin/circuit-breakers

# Reset circuit breaker
POST /api/v1/admin/circuit-breakers/user-service/reset
```

### Load Balancer Management
```bash
# Get load balancer stats
GET /api/v1/admin/load-balancer

# Add service instance
POST /api/v1/admin/load-balancer/user-service/instances
{
  "url": "http://user-service-2:3002",
  "weight": 1
}

# Remove service instance
DELETE /api/v1/admin/load-balancer/user-service/instances?url=http://user-service-2:3002
```

### Cache Management
```bash
# Get cache statistics
GET /api/v1/admin/cache/stats

# Clear all cache
DELETE /api/v1/admin/cache

# Clear specific pattern
DELETE /api/v1/admin/cache?pattern=products:*
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:e2e
```

### Load Testing
```bash
npm run test:load
```

### Manual Testing
Use the Swagger UI at `/api/docs` for interactive API testing.

## 📈 Performance Metrics

### Key Metrics Tracked
- Request throughput (requests/second)
- Response times (p50, p95, p99)
- Error rates by service
- Circuit breaker states
- Cache hit/miss ratios
- Service health status

### Monitoring Endpoints
```bash
# Gateway metrics
GET /api/v1/admin/metrics

# Service health
GET /api/v1/admin/services

# Load balancer stats
GET /api/v1/admin/load-balancer
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=8080

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
PRODUCT_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005
CART_SERVICE_URL=http://localhost:3006
INVENTORY_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3011

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=1000

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT=60000

# Proxy Settings
PROXY_TIMEOUT=10000
PROXY_RETRIES=3
HTTP_TIMEOUT=10000

# CORS
CORS_ORIGIN=*
```

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t api-gateway .
docker run -p 8080:8080 api-gateway
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Production Considerations
- Use environment-specific configurations
- Set up proper logging and monitoring
- Configure SSL/TLS termination
- Implement proper backup strategies
- Set up alerting rules
- Use container orchestration
- Implement blue-green deployments

## 🔄 Integration Flow

### Request Flow
1. **Client Request** → API Gateway
2. **Authentication** → Validate JWT with Auth Service
3. **Authorization** → Check permissions and roles
4. **Rate Limiting** → Apply throttling rules
5. **Service Discovery** → Find healthy service instance
6. **Load Balancing** → Select optimal instance
7. **Circuit Breaker** → Check service availability
8. **Proxy Request** → Forward to microservice
9. **Response Processing** → Transform and cache response
10. **Client Response** → Return processed response

### Error Handling Flow
1. **Service Unavailable** → Circuit breaker opens
2. **Timeout** → Retry with exponential backoff
3. **Authentication Failure** → Return 401 Unauthorized
4. **Authorization Failure** → Return 403 Forbidden
5. **Rate Limit Exceeded** → Return 429 Too Many Requests
6. **Service Error** → Return appropriate error response

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- Follow NestJS conventions
- Write comprehensive tests
- Use meaningful commit messages
- Document public APIs
- Follow TypeScript best practices

## 📚 Documentation

- [API Documentation](http://localhost:8080/api/docs)
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Monitoring Guide](docs/monitoring.md)

## 🆘 Troubleshooting

### Common Issues

**Service Discovery Issues**
```bash
# Check service registration
GET /api/v1/admin/services

# Check service health
GET /api/v1/admin/health
```

**Circuit Breaker Issues**
```bash
# Check circuit breaker status
GET /api/v1/admin/circuit-breakers

# Reset if needed
POST /api/v1/admin/circuit-breakers/service-name/reset
```

**Performance Issues**
```bash
# Check metrics
GET /api/v1/admin/metrics

# Check cache stats
GET /api/v1/admin/cache/stats

# Check load balancer
GET /api/v1/admin/load-balancer
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS framework for excellent architecture
- Redis for high-performance caching
- Axios for reliable HTTP communication
- Bull for background job processing
- The microservices community for best practices

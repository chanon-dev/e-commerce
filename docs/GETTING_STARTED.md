# 🚀 Getting Started with E-commerce Microservices Platform

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Docker Desktop** (v4.0+) - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **.NET SDK** (v8.0+) - [Download](https://dotnet.microsoft.com/download)
- **Go** (v1.21+) - [Download](https://golang.org/dl/)
- **Git** - [Download](https://git-scm.com/)

### Optional Tools
- **kubectl** - For Kubernetes deployment
- **Helm** - For Kubernetes package management
- **Postman** or **Insomnia** - For API testing

## 🏗️ Architecture Overview

Our E-commerce platform consists of:

### Frontend Applications
- **Customer Platform** (Next.js) - Port 3000
- **Admin Dashboard** (Next.js) - Port 3100

### Backend Services
- **API Gateway** (NestJS) - Port 8080
- **Auth Service** (NestJS) - Port 3001
- **User Service** (.NET) - Port 3002
- **Product Service** (Go) - Port 3003
- **Order Service** (.NET) - Port 3004
- **Payment Service** (Go) - Port 3005
- **Cart Service** (NestJS) - Port 3006
- **Inventory Service** (Go) - Port 3007
- **Shipping Service** (NestJS) - Port 3008
- **Promotion Service** (.NET) - Port 3009
- **Review Service** (NestJS) - Port 3010
- **Notification Service** (Go) - Port 3011
- **Admin Service** (NestJS) - Port 3012

### Infrastructure Services
- **PostgreSQL** - Primary database
- **Redis** - Cache and sessions
- **MongoDB** - Document storage
- **Elasticsearch** - Search engine
- **Kafka** - Message queue
- **Keycloak** - Identity management
- **Vault** - Secrets management
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Jaeger** - Distributed tracing

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ecommerce
```

### 2. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 3. Start Infrastructure Services
```bash
# Start databases, message queues, and monitoring
./scripts/start-local.sh
```

This script will:
- Create Docker network
- Start all infrastructure services
- Wait for services to be ready
- Start all application services
- Display service URLs and health check endpoints

### 4. Verify Services
```bash
# Check service status
docker-compose ps

# View logs for specific service
docker-compose logs -f api-gateway
```

### 5. Access the Applications

#### Customer Platform
- **URL**: http://localhost:3000
- **Description**: Customer-facing e-commerce website

#### Admin Dashboard
- **URL**: http://localhost:3100
- **Description**: Admin panel for managing the store

#### API Gateway
- **URL**: http://localhost:8080
- **Documentation**: http://localhost:8080/api/docs

## 🔧 Development Workflow

### Running Individual Services

#### Node.js Services (NestJS)
```bash
cd backend/auth-service
npm install
npm run start:dev
```

#### .NET Services
```bash
cd backend/user-service
dotnet restore
dotnet run
```

#### Go Services
```bash
cd backend/product-service
go mod download
go run main.go
```

### Building Services
```bash
# Build all services
./scripts/build-all.sh

# Build specific service
docker build -t ecommerce/auth-service ./backend/auth-service
```

### Testing
```bash
# Run all tests
./scripts/test-all.sh

# Test specific service
cd backend/auth-service
npm test
```

## 📊 Monitoring and Debugging

### Health Checks
All services provide health check endpoints:
- **Health**: `http://localhost:{port}/health`
- **Readiness**: `http://localhost:{port}/health/ready`
- **Liveness**: `http://localhost:{port}/health/live`

### Monitoring Tools
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Jaeger**: http://localhost:16686
- **Kibana**: http://localhost:5601

### Development Tools
- **Kafka UI**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **Vault UI**: http://localhost:8200 (token: dev-token)

## 🔐 Authentication & Authorization

### Default Accounts
The system comes with pre-configured accounts:

#### Admin Account
- **Email**: admin@example.com
- **Password**: Admin123!
- **Role**: Admin

#### Customer Account
- **Email**: customer@example.com
- **Password**: Customer123!
- **Role**: Customer

### JWT Tokens
All API requests (except public endpoints) require JWT authentication:
```bash
# Login to get token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Use token in subsequent requests
curl -X GET http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Common Tasks

### Adding a New Product
1. Login to Admin Dashboard: http://localhost:3100
2. Navigate to Products → Add Product
3. Fill in product details
4. Upload product images
5. Set inventory levels
6. Publish the product

### Processing Orders
1. Orders appear in Admin Dashboard → Orders
2. Update order status as needed
3. Add tracking information
4. Customers receive notifications automatically

### Managing Promotions
1. Go to Admin Dashboard → Promotions
2. Create new coupon or discount
3. Set conditions and validity period
4. Activate the promotion

## 🔄 Stopping Services

```bash
# Stop all services
./scripts/stop-local.sh

# Stop specific service
docker-compose stop auth-service

# Restart specific service
./scripts/restart-service.sh auth-service
```

## 🧹 Cleanup

```bash
# Remove containers and networks
docker-compose down

# Remove volumes (⚠️ This will delete all data!)
docker-compose down -v

# Clean up unused Docker resources
docker system prune -a
```

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Restart service
./scripts/restart-service.sh service-name
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker exec -it ecommerce-postgresql pg_isready -U postgres

# Reset database
docker-compose restart postgresql
```

#### Memory Issues
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Getting Help

1. **Check Logs**: Always start by checking service logs
2. **Health Checks**: Verify all services are healthy
3. **Documentation**: Refer to individual service documentation
4. **Issues**: Create an issue in the repository

## 📚 Next Steps

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 💡 Tips

- Use `docker-compose logs -f` to follow logs in real-time
- Services are configured with hot-reload for development
- Database data persists between restarts
- Use environment variables for configuration
- All services support graceful shutdown

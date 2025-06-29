# 🛒 E-Commerce Microservices Platform

## 📋 Project Overview

This is a comprehensive e-commerce platform built with microservices architecture using Next.js, .NET, Go, and NestJS.

## 🏗️ Architecture

- **Frontend**: Next.js (Customer Platform & Admin Dashboard)
- **Backend**: Microservices with .NET, Go, and NestJS
- **Security**: HashiCorp Vault + Keycloak
- **Databases**: PostgreSQL, Redis, MongoDB, Elasticsearch
- **Message Queue**: Apache Kafka
- **Monitoring**: Prometheus + Grafana + ELK Stack + Jaeger
- **CI/CD**: Jenkins + ArgoCD
- **Container**: Docker + Kubernetes

## 🏢 Services

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **API Gateway** | NGINX + NestJS | 8080 | Main entry point |
| **Auth Service** | NestJS + Keycloak | 3001 | Authentication & Authorization |
| **User Service** | .NET | 3002 | User management |
| **Product Service** | Go | 3003 | Product catalog |
| **Order Service** | .NET | 3004 | Order processing |
| **Payment Service** | Go | 3005 | Payment processing |
| **Cart Service** | NestJS | 3006 | Shopping cart |
| **Inventory Service** | Go | 3007 | Inventory management |
| **Shipping Service** | NestJS | 3008 | Shipping & delivery |
| **Promotion Service** | .NET | 3009 | Promotions & coupons |
| **Review Service** | NestJS | 3010 | Product reviews |
| **Notification Service** | Go | 3011 | Notifications |
| **Admin Service** | NestJS | 3012 | Admin operations |

## 🌐 Frontend Applications

| Application | Technology | Port | Description |
|-------------|------------|------|-------------|
| **Customer Platform** | Next.js | 3000 | Customer e-commerce site |
| **Admin Dashboard** | Next.js | 3100 | Admin management panel |

## 🗄️ Databases

| Database | Port | Usage |
|----------|------|-------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Cache & sessions |
| **MongoDB** | 27017 | Document storage |
| **Elasticsearch** | 9200 | Search engine |

## 🔐 Security Services

| Service | Port | Description |
|---------|------|-------------|
| **HashiCorp Vault** | 8200 | Secrets management |
| **Keycloak** | 8080 | Identity & access management |

## 📊 Monitoring Stack

| Service | Port | Description |
|---------|------|-------------|
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3000 | Metrics visualization |
| **Jaeger** | 16686 | Distributed tracing |
| **Elasticsearch** | 9200 | Log storage |
| **Kibana** | 5601 | Log visualization |

## 🔄 Message Queue

| Service | Port | Description |
|---------|------|-------------|
| **Apache Kafka** | 9092 | Event streaming |
| **Zookeeper** | 2181 | Kafka coordination |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- .NET 8.0+
- Go 1.21+
- kubectl
- Helm

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce
```

2. **Start infrastructure services**
```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

3. **Start application services**
```bash
docker-compose -f docker-compose.services.yml up -d
```

4. **Start frontend applications**
```bash
# Customer Platform
cd frontend/customer-platform
npm install && npm run dev

# Admin Dashboard
cd frontend/admin-dashboard
npm install && npm run dev
```

### Access URLs

- **Customer Platform**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3100
- **API Gateway**: http://localhost:8080
- **Keycloak**: http://localhost:8080/auth
- **Vault**: http://localhost:8200
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

## 📁 Project Structure

```
ecommerce/
├── frontend/
│   ├── customer-platform/     # Next.js customer app
│   └── admin-dashboard/       # Next.js admin app
├── backend/
│   ├── api-gateway/          # NestJS API Gateway
│   ├── auth-service/         # NestJS Auth Service
│   ├── user-service/         # .NET User Service
│   ├── product-service/      # Go Product Service
│   ├── order-service/        # .NET Order Service
│   ├── payment-service/      # Go Payment Service
│   ├── cart-service/         # NestJS Cart Service
│   ├── inventory-service/    # Go Inventory Service
│   ├── shipping-service/     # NestJS Shipping Service
│   ├── promotion-service/    # .NET Promotion Service
│   ├── review-service/       # NestJS Review Service
│   ├── notification-service/ # Go Notification Service
│   └── admin-service/        # NestJS Admin Service
├── infrastructure/
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   ├── monitoring/          # Monitoring configs
│   └── security/            # Security configs
├── scripts/                 # Automation scripts
└── docs/                   # Documentation
```

## 🔧 Development

### Running Individual Services

Each service can be run independently:

```bash
# .NET Services
cd backend/user-service
dotnet run

# Go Services
cd backend/product-service
go run main.go

# NestJS Services
cd backend/auth-service
npm run start:dev
```

### Building Docker Images

```bash
# Build all services
./scripts/build-all.sh

# Build specific service
docker build -t ecommerce/auth-service ./backend/auth-service
```

## 🧪 Testing

```bash
# Run all tests
./scripts/test-all.sh

# Run specific service tests
cd backend/auth-service
npm test

cd backend/user-service
dotnet test

cd backend/product-service
go test ./...
```

## 📊 Monitoring

- **Application Metrics**: Prometheus + Grafana
- **Distributed Tracing**: Jaeger
- **Logging**: ELK Stack
- **Health Checks**: Built-in health endpoints

## 🔐 Security

- **Authentication**: Keycloak SSO
- **Authorization**: JWT + RBAC
- **Secrets Management**: HashiCorp Vault
- **API Security**: Rate limiting, CORS, validation
- **Container Security**: Security scanning, policies

## 🚀 Deployment

### Local Development
```bash
./scripts/start-local.sh
```

### Kubernetes
```bash
kubectl apply -f infrastructure/kubernetes/
```

### CI/CD
- **CI**: Jenkins pipeline
- **CD**: ArgoCD GitOps

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)
- [Monitoring Guide](docs/monitoring.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

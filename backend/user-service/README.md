# 👤 User Service

A comprehensive user management microservice built with .NET 8, following Clean Architecture and Domain-Driven Design principles.

## 🏗️ Architecture

This service implements Clean Architecture with the following layers:

- **Domain Layer**: Core business logic, entities, value objects, and domain events
- **Application Layer**: Use cases, commands, queries, and application services
- **Infrastructure Layer**: Data access, external services, and cross-cutting concerns
- **API Layer**: REST API controllers and presentation logic

## 🚀 Features

### Core Functionality
- ✅ User registration and profile management
- ✅ Email and phone number verification
- ✅ Role-based access control (RBAC)
- ✅ Address management
- ✅ Session management
- ✅ User preferences and settings

### Technical Features
- ✅ Clean Architecture with DDD
- ✅ CQRS with MediatR
- ✅ Entity Framework Core with SQL Server
- ✅ AutoMapper for object mapping
- ✅ FluentValidation for input validation
- ✅ JWT authentication
- ✅ Comprehensive logging with Serilog
- ✅ Health checks
- ✅ Swagger/OpenAPI documentation
- ✅ Docker containerization
- ✅ Unit and integration tests

### Domain Features
- **Rich Domain Models**: Business logic encapsulated in entities
- **Value Objects**: Email, PhoneNumber, UserPreferences with validation
- **Domain Events**: For integration with other services
- **Multi-country Support**: Phone validation, address formats
- **Audit Trail**: Complete tracking of changes

## 🛠️ Technology Stack

- **.NET 8**: Latest .NET framework
- **Entity Framework Core**: ORM for data access
- **SQL Server**: Primary database
- **Redis**: Caching and session storage
- **MediatR**: CQRS implementation
- **AutoMapper**: Object-to-object mapping
- **FluentValidation**: Input validation
- **Serilog**: Structured logging
- **xUnit**: Unit testing framework
- **Moq**: Mocking framework
- **Docker**: Containerization

## 📁 Project Structure

```
UserService/
├── UserService.Domain/           # Domain layer
│   ├── Entities/                # Domain entities
│   ├── ValueObjects/            # Value objects
│   ├── Events/                  # Domain events
│   └── Common/                  # Base classes
├── UserService.Application/      # Application layer
│   ├── Users/                   # User use cases
│   │   ├── Commands/           # Commands (CUD operations)
│   │   ├── Queries/            # Queries (Read operations)
│   │   └── Common/             # DTOs and mappings
│   └── Common/                  # Shared application logic
├── UserService.Infrastructure/   # Infrastructure layer
│   ├── Data/                   # EF Core context and configurations
│   ├── Repositories/           # Repository implementations
│   └── Services/               # External service implementations
├── UserService.API/             # API layer
│   ├── Controllers/            # REST API controllers
│   └── Program.cs              # Application startup
└── UserService.Tests/           # Test projects
    ├── Domain/                 # Domain tests
    ├── Application/            # Application tests
    └── API/                    # API tests
```

## 🚀 Quick Start

### Prerequisites
- .NET 8 SDK
- SQL Server (or Docker)
- Redis (optional, for caching)

### Running with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce/backend/user-service
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
- API: http://localhost:3002
- Swagger UI: http://localhost:3002
- Health Check: http://localhost:3002/health

### Running Locally

1. **Update connection string**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ECommerceUserService;Trusted_Connection=true;TrustServerCertificate=true"
  }
}
```

2. **Run database migrations**
```bash
cd UserService.API
dotnet ef database update
```

3. **Start the application**
```bash
dotnet run
```

## 📊 Database Schema

### Core Tables
- **Users**: Main user information
- **UserAddresses**: User addresses
- **UserSessions**: Active user sessions
- **Roles**: System roles
- **Permissions**: System permissions
- **UserRoles**: User-role assignments
- **RolePermissions**: Role-permission assignments

### Key Features
- **Optimized Indexes**: For performance
- **Audit Fields**: Created/Modified tracking
- **Soft Deletes**: Data preservation
- **Constraints**: Data integrity

## 🔐 Security

### Authentication
- JWT token-based authentication
- Refresh token support
- Session management

### Authorization
- Role-based access control (RBAC)
- Permission-based authorization
- Resource-level security

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Audit logging

## 📡 API Endpoints

### User Management
```
GET    /api/users              # Get users (paginated)
GET    /api/users/{id}         # Get user by ID
POST   /api/users              # Create user
PUT    /api/users/{id}         # Update user
GET    /api/users/me           # Get current user
PUT    /api/users/me           # Update current user profile
GET    /api/users/search       # Search users
```

### Utility Endpoints
```
GET    /api/users/check-email  # Check email availability
GET    /api/users/statistics   # User statistics (admin)
GET    /health                 # Health check
```

## 🧪 Testing

### Run Unit Tests
```bash
dotnet test UserService.Tests
```

### Run with Coverage
```bash
dotnet test --collect:"XPlat Code Coverage"
```

### Test Categories
- **Domain Tests**: Entity and value object tests
- **Application Tests**: Command and query handler tests
- **Integration Tests**: End-to-end API tests

## 📈 Monitoring & Observability

### Logging
- Structured logging with Serilog
- Request/response logging
- Error tracking
- Performance metrics

### Health Checks
- Database connectivity
- External service dependencies
- Custom health indicators

### Metrics
- Application metrics
- Business metrics
- Performance counters

## 🔧 Configuration

### Environment Variables
```bash
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=<connection-string>
Jwt__Key=<jwt-secret-key>
Jwt__Issuer=<jwt-issuer>
Jwt__Audience=<jwt-audience>
```

### Configuration Files
- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development overrides
- `appsettings.Production.json`: Production settings

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t user-service .
docker run -p 3002:3002 user-service
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### CI/CD Pipeline
- Automated testing
- Code quality checks
- Security scanning
- Automated deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- Follow Clean Architecture principles
- Write comprehensive tests
- Use meaningful commit messages
- Document public APIs

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Testing Guide](docs/testing.md)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check connection string
# Verify SQL Server is running
# Check firewall settings
```

**Authentication Issues**
```bash
# Verify JWT configuration
# Check token expiration
# Validate issuer/audience
```

**Performance Issues**
```bash
# Check database indexes
# Monitor query performance
# Review caching strategy
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- .NET Community for excellent libraries and tools

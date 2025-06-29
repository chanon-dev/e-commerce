# 🔐 Auth Service

A comprehensive authentication and authorization microservice built with NestJS, following Clean Architecture and Domain-Driven Design principles.

## 🏗️ Architecture

This service implements Clean Architecture with the following layers:

- **Domain Layer**: Core business logic, entities, and domain services
- **Application Layer**: Use cases, DTOs, and application services
- **Infrastructure Layer**: Database access, external services, and technical concerns
- **Interface Layer**: HTTP controllers, guards, and API presentation

## 🚀 Features

### Core Authentication
- ✅ User registration with email verification
- ✅ Email/password login
- ✅ JWT access & refresh tokens
- ✅ Password reset functionality
- ✅ Social authentication (Google, Facebook, Apple, LINE)
- ✅ Multi-factor authentication (2FA)

### Session Management
- ✅ Multi-device session tracking
- ✅ Session revocation (single/all devices)
- ✅ Session expiration handling
- ✅ Device fingerprinting
- ✅ Location tracking

### Security Features
- ✅ Rate limiting & throttling
- ✅ Password strength validation
- ✅ Account lockout protection
- ✅ Audit logging
- ✅ CSRF protection
- ✅ Helmet security headers

### Technical Features
- ✅ Clean Architecture with DDD
- ✅ TypeORM with PostgreSQL
- ✅ Redis for caching & sessions
- ✅ Bull Queue for background jobs
- ✅ Comprehensive API documentation
- ✅ Docker containerization
- ✅ Health checks and monitoring

## 🛠️ Technology Stack

- **NestJS**: Node.js framework
- **TypeScript**: Type-safe development
- **TypeORM**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **JWT**: Token-based authentication
- **Passport**: Authentication middleware
- **Bull**: Background job processing
- **Swagger**: API documentation
- **Docker**: Containerization

## 📁 Project Structure

```
auth-service/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── controllers/         # HTTP controllers
│   │   ├── services/           # Business services
│   │   ├── entities/           # Database entities
│   │   ├── dto/                # Data transfer objects
│   │   ├── guards/             # Authentication guards
│   │   ├── strategies/         # Passport strategies
│   │   └── decorators/         # Custom decorators
│   ├── user/                   # User management module
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
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Running with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce/backend/auth-service
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
- API: http://localhost:3001
- Swagger UI: http://localhost:3001/api/docs
- Health Check: http://localhost:3001/health

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

3. **Start database services**
```bash
docker-compose up -d auth-service-db auth-service-redis
```

4. **Run database migrations**
```bash
npm run migration:run
```

5. **Start the application**
```bash
npm run start:dev
```

## 📊 Database Schema

### Core Tables
- **user_sessions**: Active user sessions
- **auth_providers**: Social authentication providers
- **password_resets**: Password reset tokens
- **email_verifications**: Email verification tokens

### Key Features
- **UUID Primary Keys**: Distributed system friendly
- **Soft Deletes**: Data preservation
- **Audit Fields**: Created/updated tracking
- **Indexes**: Optimized for performance
- **JSONB Support**: Flexible metadata storage

## 🔐 API Endpoints

### Authentication
```
POST   /api/v1/auth/register           # User registration
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # User logout
POST   /api/v1/auth/social             # Social authentication
```

### Password Management
```
POST   /api/v1/auth/forgot-password    # Request password reset
POST   /api/v1/auth/reset-password     # Reset password with token
PUT    /api/v1/auth/change-password    # Change password (authenticated)
```

### Email Verification
```
POST   /api/v1/auth/verify-email       # Verify email address
POST   /api/v1/auth/resend-verification # Resend verification email
```

### User Profile & Sessions
```
GET    /api/v1/auth/me                 # Get current user profile
GET    /api/v1/auth/sessions           # Get user sessions
DELETE /api/v1/auth/sessions/:id       # Revoke specific session
GET    /api/v1/auth/validate           # Validate JWT token
```

### Utility Endpoints
```
GET    /health                         # Health check
GET    /api/docs                       # API documentation
```

## 🔒 Authentication Flow

### Registration Flow
1. User submits registration form
2. Validate input and check for existing user
3. Hash password and create user account
4. Send email verification
5. Return JWT tokens for immediate access

### Login Flow
1. User submits email/password
2. Validate credentials
3. Create new session
4. Return JWT access & refresh tokens
5. Update last login timestamp

### Token Refresh Flow
1. Client sends refresh token
2. Validate refresh token and session
3. Generate new access token
4. Update session last accessed time
5. Return new access token

### Social Authentication Flow
1. Client obtains social provider token
2. Verify token with social provider
3. Find or create user account
4. Link social account to user
5. Create session and return tokens

## 🛡️ Security Features

### Password Security
- Minimum 8 characters with complexity requirements
- bcrypt hashing with salt rounds
- Password history prevention
- Account lockout after failed attempts

### Token Security
- JWT with RS256 signing
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Token blacklisting on logout
- Automatic token rotation

### Session Security
- Device fingerprinting
- IP address tracking
- Location detection
- Session timeout handling
- Concurrent session limits

### Rate Limiting
- Login attempts: 10/minute
- Registration: 5/minute
- Password reset: 3/minute
- Email verification: 5/minute

## 📧 Email Integration

### Email Templates
- Welcome email
- Email verification
- Password reset
- Security alerts
- Account notifications

### Email Providers
- SMTP configuration
- SendGrid integration
- AWS SES support
- Template management

## 📱 Social Authentication

### Supported Providers
- Google OAuth 2.0
- Facebook Login
- Apple Sign In
- LINE Login
- GitHub OAuth
- Microsoft OAuth

### Implementation
- Provider token verification
- User data mapping
- Account linking
- Profile synchronization

## 🧪 Testing

### Run Tests
```bash
npm test                # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
```

### Test Categories
- Unit tests for services and utilities
- Integration tests for controllers
- End-to-end tests for complete flows

## 📈 Monitoring & Observability

### Health Checks
- Database connectivity
- Redis connectivity
- External service dependencies
- Memory and CPU usage

### Logging
- Structured JSON logging
- Request/response logging
- Security event logging
- Error tracking

### Metrics
- Authentication success/failure rates
- Token refresh rates
- Session duration statistics
- API response times

## 🔧 Configuration

### Environment Variables
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=auth_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_ISSUER=ecommerce-auth-service
JWT_AUDIENCE=ecommerce-clients

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Social Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t auth-service .
docker run -p 3001:3001 auth-service
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Production Considerations
- Use environment-specific configurations
- Set up proper logging and monitoring
- Configure SSL/TLS certificates
- Implement backup strategies
- Set up alerting rules

## 🔄 Integration

### Event Publishing
The service publishes events for:
- User registration
- Login/logout events
- Password changes
- Email verification
- Account status changes

### External Dependencies
- User Service: User profile management
- Email Service: Email delivery
- SMS Service: SMS notifications
- Analytics Service: Event tracking

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

## 📚 Documentation

- [API Documentation](http://localhost:3001/api/docs)
- [Architecture Guide](docs/architecture.md)
- [Security Guide](docs/security.md)
- [Deployment Guide](docs/deployment.md)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DB_HOST $DB_PORT $DB_USERNAME
```

**Redis Connection Issues**
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli -h localhost -p 6379 ping
```

**JWT Token Issues**
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiry settings
echo $JWT_ACCESS_TOKEN_EXPIRY
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS framework for excellent architecture
- Passport.js for authentication strategies
- TypeORM for database operations
- JWT for secure token handling
- Redis for high-performance caching

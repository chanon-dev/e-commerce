# 🔐 Vault Secret Management - E-commerce Platform

## 📋 Overview

Complete HashiCorp Vault integration for secure secret management across all environments (development, staging, production). This implementation provides centralized secret storage, automatic secret rotation, and environment-specific configurations.

## 🏗️ Architecture

### **Secret Management Flow**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Root Token   │ │    │ │AppRole Auth │ │    │ │AppRole Auth │ │
│ │(Dev Only)   │ │    │ │+ Policies   │ │    │ │+ Policies   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │    HashiCorp Vault      │
                    │  ┌─────────────────────┐│
                    │  │   Secret Engines    ││
                    │  │ • KV v2 (secrets)   ││
                    │  │ • Database          ││
                    │  │ • PKI               ││
                    │  │ • Transit           ││
                    │  └─────────────────────┘│
                    └─────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Auth Service   │    │ Order Service   │    │Payment Service  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │VaultService │ │    │ │VaultService │ │    │ │VaultService │ │
│ │+ Cache      │ │    │ │+ Cache      │ │    │ │+ Cache      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 Secret Organization

### **Secret Paths Structure**
```
secret/
├── database/
│   ├── postgresql          # Main database credentials
│   ├── redis              # Cache credentials
│   └── mongodb            # Document store credentials
├── auth/
│   ├── jwt                # JWT signing secrets
│   ├── keycloak           # Keycloak integration
│   └── oauth              # OAuth provider configs
├── messaging/
│   ├── kafka              # Kafka cluster credentials
│   └── rabbitmq           # RabbitMQ credentials (if used)
├── payment/
│   ├── stripe             # Stripe API keys
│   ├── paypal             # PayPal credentials
│   └── square             # Square credentials
├── shipping/
│   ├── fedex              # FedEx API credentials
│   ├── ups                # UPS API credentials
│   ├── usps               # USPS API credentials
│   └── dhl                # DHL API credentials
├── notification/
│   ├── email              # SMTP configuration
│   ├── sms                # SMS provider credentials
│   └── push               # Push notification keys
└── external/
    ├── google             # Google APIs
    ├── aws                # AWS credentials
    └── monitoring         # Monitoring service keys
```

## 🚀 Environment-Specific Setup

### **Development Environment**
```bash
# Start Vault in development mode
docker-compose -f docker-compose.infrastructure.yml up -d vault

# Initialize development secrets
./infrastructure/vault/vault-setup.sh development

# Verify setup
vault kv list secret/
```

**Development Features:**
- ✅ Root token authentication (simplified)
- ✅ Local Vault instance
- ✅ Fallback to environment variables
- ✅ Debug logging enabled
- ✅ Relaxed security policies

### **Staging Environment**
```bash
# Setup staging secrets with AppRole
export VAULT_ADDR="https://vault-staging.company.com"
export VAULT_TOKEN="staging-admin-token"

./infrastructure/vault/vault-setup.sh staging

# Get AppRole credentials for applications
vault read auth/approle/role/ecommerce-app/role-id
vault write -f auth/approle/role/ecommerce-app/secret-id
```

**Staging Features:**
- ✅ AppRole authentication
- ✅ Policy-based access control
- ✅ Secret rotation testing
- ✅ Production-like security
- ✅ Audit logging

### **Production Environment**
```bash
# Setup production secrets (secure environment)
export VAULT_ADDR="https://vault.company.com"
export VAULT_TOKEN="production-admin-token"
export VAULT_NAMESPACE="ecommerce"

./infrastructure/vault/vault-setup.sh production

# Backup secrets
./infrastructure/vault/vault-setup.sh production --backup
```

**Production Features:**
- ✅ AppRole authentication only
- ✅ Strict access policies
- ✅ Automatic secret rotation
- ✅ High availability setup
- ✅ Comprehensive audit logging
- ✅ Encryption at rest and in transit

## 💻 Service Integration

### **Basic Usage**
```typescript
// Inject VaultService in your NestJS service
constructor(private readonly vaultService: VaultService) {}

// Get database configuration
const dbConfig = await this.vaultService.getDatabaseConfig();

// Get JWT secret
const jwtSecret = await this.vaultService.getJWTSecret();

// Get payment provider config
const stripeConfig = await this.vaultService.getPaymentConfig('stripe');
```

### **Advanced Usage**
```typescript
// Custom secret retrieval
const customSecret = await this.vaultService.getSecret('custom/path');

// Set new secret
await this.vaultService.setSecret('custom/path', {
  apiKey: 'new-api-key',
  endpoint: 'https://api.example.com'
});

// Rotate secret
await this.vaultService.rotateSecret('auth/jwt', {
  secret: generateNewJWTSecret(),
  rotatedAt: new Date().toISOString()
});
```

### **Configuration with Caching**
```typescript
// VaultService automatically caches secrets for 5 minutes
// Force refresh from Vault
const freshSecret = await this.vaultService.getSecret('path', 'secret', false);

// Check cache statistics
const cacheStats = this.vaultService.getCacheStats();
console.log(`Cache size: ${cacheStats.size}, Keys: ${cacheStats.keys}`);
```

## 🔧 Authentication Methods

### **Development: Root Token**
```bash
# Simple token-based auth for development
export VAULT_TOKEN="dev-only-token"
```

### **Production: AppRole**
```bash
# Secure AppRole authentication
export VAULT_ROLE_ID="your-role-id"
export VAULT_SECRET_ID="your-secret-id"
```

### **Service Configuration**
```typescript
// Environment-specific authentication
const vaultConfig = {
  development: {
    token: process.env.VAULT_TOKEN,
    endpoint: 'http://localhost:8200'
  },
  production: {
    roleId: process.env.VAULT_ROLE_ID,
    secretId: process.env.VAULT_SECRET_ID,
    endpoint: 'https://vault.company.com',
    namespace: 'ecommerce'
  }
};
```

## 🛡️ Security Best Practices

### **Access Policies**
```hcl
# Example policy for ecommerce application
path "secret/data/database/*" {
  capabilities = ["read"]
}

path "secret/data/auth/*" {
  capabilities = ["read"]
}

path "secret/data/payment/*" {
  capabilities = ["read"]
}

# Deny access to admin secrets
path "secret/data/admin/*" {
  capabilities = ["deny"]
}
```

### **Secret Rotation**
```typescript
// Automatic secret rotation
@Cron('0 2 * * 0') // Weekly at 2 AM
async rotateWeeklySecrets() {
  await this.vaultService.rotateSecret('auth/jwt', {
    secret: this.generateJWTSecret(),
    rotatedAt: new Date().toISOString()
  });
}

// Database credential rotation
@Cron('0 3 1 * *') // Monthly at 3 AM on 1st
async rotateMonthlySecrets() {
  const newPassword = this.generateSecurePassword();
  
  // Update database password
  await this.databaseService.updatePassword(newPassword);
  
  // Update Vault secret
  await this.vaultService.rotateSecret('database/postgresql', {
    password: newPassword,
    rotatedAt: new Date().toISOString()
  });
}
```

## 📊 Monitoring & Health Checks

### **Health Check Endpoint**
```typescript
@Get('/health/vault')
async getVaultHealth() {
  return await this.vaultService.healthCheck();
}

// Response example:
{
  "status": "healthy",
  "vault": {
    "status": "healthy",
    "initialized": true,
    "sealed": false,
    "version": "1.15.0"
  },
  "cache": {
    "size": 12,
    "hitRate": 0.85
  }
}
```

### **Metrics Collection**
```typescript
// Custom metrics for monitoring
@Injectable()
export class VaultMetricsService {
  private secretRetrievalCount = 0;
  private cacheHitCount = 0;
  private errorCount = 0;

  recordSecretRetrieval() {
    this.secretRetrievalCount++;
  }

  recordCacheHit() {
    this.cacheHitCount++;
  }

  recordError() {
    this.errorCount++;
  }

  getMetrics() {
    return {
      secretRetrievals: this.secretRetrievalCount,
      cacheHits: this.cacheHitCount,
      errors: this.errorCount,
      cacheHitRate: this.cacheHitCount / this.secretRetrievalCount
    };
  }
}
```

## 🔄 Secret Lifecycle Management

### **Development Workflow**
1. **Local Development**
   ```bash
   # Start local Vault
   docker-compose up -d vault
   
   # Initialize with dev secrets
   ./infrastructure/vault/vault-setup.sh development
   
   # Run application
   npm run start:dev
   ```

2. **Adding New Secrets**
   ```bash
   # Add new secret via CLI
   vault kv put secret/new-service/config \
     apiKey="new-api-key" \
     endpoint="https://api.newservice.com"
   
   # Or via VaultService
   await this.vaultService.setSecret('new-service/config', {
     apiKey: 'new-api-key',
     endpoint: 'https://api.newservice.com'
   });
   ```

### **Production Deployment**
1. **Pre-deployment**
   ```bash
   # Backup current secrets
   ./infrastructure/vault/vault-setup.sh production --backup
   
   # Update secrets if needed
   vault kv put secret/database/postgresql password="new-secure-password"
   ```

2. **Deployment**
   ```bash
   # Deploy with Vault integration
   kubectl apply -f k8s/vault-config.yaml
   kubectl apply -f k8s/app-deployment.yaml
   ```

3. **Post-deployment**
   ```bash
   # Verify secret access
   kubectl exec deployment/auth-service -- curl localhost:3001/health/vault
   
   # Monitor secret usage
   kubectl logs deployment/auth-service | grep "Vault"
   ```

## 🚨 Troubleshooting

### **Common Issues**

#### **Vault Sealed**
```bash
# Check Vault status
vault status

# Unseal Vault (requires unseal keys)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>
```

#### **Authentication Failed**
```bash
# Check token validity
vault token lookup

# Renew token if needed
vault token renew

# For AppRole issues
vault read auth/approle/role/ecommerce-app/role-id
vault write -f auth/approle/role/ecommerce-app/secret-id
```

#### **Secret Not Found**
```bash
# List available secrets
vault kv list secret/

# Check specific path
vault kv get secret/database/postgresql

# Verify permissions
vault token capabilities secret/database/postgresql
```

### **Debug Mode**
```typescript
// Enable debug logging
process.env.ENABLE_DEBUG_LOGGING = 'true';

// Check cache status
const cacheStats = this.vaultService.getCacheStats();
console.log('Vault cache:', cacheStats);

// Force cache clear
this.vaultService.clearCache();
```

## 📚 Quick Reference

### **Environment Variables**
```bash
# Required for all environments
VAULT_ADDR=http://localhost:8200

# Development
VAULT_TOKEN=dev-only-token

# Production
VAULT_ROLE_ID=your-role-id
VAULT_SECRET_ID=your-secret-id
VAULT_NAMESPACE=ecommerce

# Optional
VAULT_CACHE_TTL=300000
VAULT_RETRY_ATTEMPTS=3
VAULT_RETRY_DELAY=1000
```

### **Common Commands**
```bash
# Setup environments
./infrastructure/vault/vault-setup.sh development
./infrastructure/vault/vault-setup.sh staging
./infrastructure/vault/vault-setup.sh production

# Manage secrets
vault kv put secret/path key=value
vault kv get secret/path
vault kv delete secret/path

# Health checks
vault status
vault auth list
vault secrets list
```

### **Service Integration**
```typescript
// Module import
import { VaultModule } from '@/infrastructure/vault/vault.module';

@Module({
  imports: [VaultModule],
  // ...
})

// Service injection
constructor(private readonly vaultService: VaultService) {}

// Usage
const secret = await this.vaultService.getSecret('path');
```

---

## 🎯 Next Steps

1. **Setup Vault Cluster** for high availability in production
2. **Implement Secret Rotation** for all sensitive credentials
3. **Configure Audit Logging** for compliance requirements
4. **Setup Monitoring Dashboards** for Vault metrics
5. **Create Disaster Recovery** procedures for Vault

**Your secret management is now enterprise-ready and secure!** 🔐

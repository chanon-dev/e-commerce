#!/bin/bash

# Vault initialization and configuration script
set -e

VAULT_ADDR="http://localhost:8200"
VAULT_TOKEN="myroot"

echo "🔐 Initializing HashiCorp Vault for E-commerce Platform..."

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
until curl -s $VAULT_ADDR/v1/sys/health > /dev/null; do
  echo "Waiting for Vault..."
  sleep 2
done

echo "✅ Vault is ready!"

# Set Vault address and token
export VAULT_ADDR=$VAULT_ADDR
export VAULT_TOKEN=$VAULT_TOKEN

# Enable KV secrets engine v2
echo "🔧 Enabling KV secrets engine..."
vault secrets enable -version=2 -path=ecommerce kv || echo "KV engine already enabled"

# Enable database secrets engine
echo "🔧 Enabling database secrets engine..."
vault secrets enable database || echo "Database engine already enabled"

# Enable AWS secrets engine
echo "🔧 Enabling AWS secrets engine..."
vault secrets enable aws || echo "AWS engine already enabled"

# Create policies
echo "📋 Creating Vault policies..."

# API Gateway policy
vault policy write api-gateway-policy - <<EOF
# API Gateway secrets
path "ecommerce/data/api-gateway/*" {
  capabilities = ["read"]
}

path "ecommerce/data/shared/*" {
  capabilities = ["read"]
}

# Database credentials
path "database/creds/api-gateway-role" {
  capabilities = ["read"]
}
EOF

# Auth Service policy
vault policy write auth-service-policy - <<EOF
# Auth Service secrets
path "ecommerce/data/auth-service/*" {
  capabilities = ["read", "create", "update"]
}

path "ecommerce/data/shared/*" {
  capabilities = ["read"]
}

# Database credentials
path "database/creds/auth-service-role" {
  capabilities = ["read"]
}

# JWT signing keys
path "ecommerce/data/jwt/*" {
  capabilities = ["read", "create", "update"]
}
EOF

# User Service policy
vault policy write user-service-policy - <<EOF
# User Service secrets
path "ecommerce/data/user-service/*" {
  capabilities = ["read"]
}

path "ecommerce/data/shared/*" {
  capabilities = ["read"]
}

# Database credentials
path "database/creds/user-service-role" {
  capabilities = ["read"]
}
EOF

# Product Service policy
vault policy write product-service-policy - <<EOF
# Product Service secrets
path "ecommerce/data/product-service/*" {
  capabilities = ["read"]
}

path "ecommerce/data/shared/*" {
  capabilities = ["read"]
}

# Database credentials
path "database/creds/product-service-role" {
  capabilities = ["read"]
}

# AWS S3 credentials
path "aws/creds/s3-role" {
  capabilities = ["read"]
}
EOF

# Payment Service policy
vault policy write payment-service-policy - <<EOF
# Payment Service secrets (highly sensitive)
path "ecommerce/data/payment-service/*" {
  capabilities = ["read"]
}

path "ecommerce/data/shared/encryption-keys" {
  capabilities = ["read"]
}

# Database credentials
path "database/creds/payment-service-role" {
  capabilities = ["read"]
}

# Payment provider credentials
path "ecommerce/data/payment-providers/*" {
  capabilities = ["read"]
}
EOF

# Create application roles
echo "👤 Creating application roles..."

# API Gateway role
vault write auth/approle/role/api-gateway \
    token_policies="api-gateway-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true

# Auth Service role
vault write auth/approle/role/auth-service \
    token_policies="auth-service-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true

# User Service role
vault write auth/approle/role/user-service \
    token_policies="user-service-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true

# Product Service role
vault write auth/approle/role/product-service \
    token_policies="product-service-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true

# Payment Service role (more restrictive)
vault write auth/approle/role/payment-service \
    token_policies="payment-service-policy" \
    token_ttl=30m \
    token_max_ttl=2h \
    bind_secret_id=true

# Store application secrets
echo "🔑 Storing application secrets..."

# Shared secrets
vault kv put ecommerce/shared/database \
    host="postgres" \
    port="5432" \
    database="ecommerce"

vault kv put ecommerce/shared/redis \
    host="redis" \
    port="6379"

vault kv put ecommerce/shared/elasticsearch \
    host="elasticsearch" \
    port="9200"

vault kv put ecommerce/shared/kafka \
    brokers="kafka:9092"

vault kv put ecommerce/shared/encryption-keys \
    aes_key="$(openssl rand -base64 32)" \
    hmac_key="$(openssl rand -base64 32)"

# JWT secrets
vault kv put ecommerce/jwt/signing-keys \
    private_key="$(openssl genrsa 2048 | base64 -w 0)" \
    public_key="$(openssl rsa -pubout 2>/dev/null | base64 -w 0)" \
    secret="$(openssl rand -base64 64)"

# API Gateway secrets
vault kv put ecommerce/api-gateway/config \
    rate_limit_redis_url="redis://redis:6379" \
    cors_origins="http://localhost:3000,http://localhost:3100"

# Auth Service secrets
vault kv put ecommerce/auth-service/config \
    jwt_secret="$(openssl rand -base64 64)" \
    refresh_token_secret="$(openssl rand -base64 64)" \
    email_verification_secret="$(openssl rand -base64 32)" \
    password_reset_secret="$(openssl rand -base64 32)"

vault kv put ecommerce/auth-service/oauth \
    google_client_id="your-google-client-id" \
    google_client_secret="your-google-client-secret" \
    facebook_app_id="your-facebook-app-id" \
    facebook_app_secret="your-facebook-app-secret" \
    github_client_id="your-github-client-id" \
    github_client_secret="your-github-client-secret"

vault kv put ecommerce/auth-service/email \
    smtp_host="smtp.gmail.com" \
    smtp_port="587" \
    smtp_user="your-email@gmail.com" \
    smtp_password="your-app-password"

# User Service secrets
vault kv put ecommerce/user-service/config \
    connection_string="Host=postgres;Database=ecommerce_users;Username=user_service;Password=$(openssl rand -base64 16)"

# Product Service secrets
vault kv put ecommerce/product-service/config \
    db_connection="host=postgres port=5432 user=product_service password=$(openssl rand -base64 16) dbname=ecommerce_products sslmode=disable" \
    elasticsearch_url="http://elasticsearch:9200"

vault kv put ecommerce/product-service/aws \
    access_key_id="your-aws-access-key" \
    secret_access_key="your-aws-secret-key" \
    region="us-east-1" \
    s3_bucket="ecommerce-product-images"

# Payment Service secrets (highly sensitive)
vault kv put ecommerce/payment-service/config \
    db_connection="host=postgres port=5432 user=payment_service password=$(openssl rand -base64 16) dbname=ecommerce_payments sslmode=disable" \
    encryption_key="$(openssl rand -base64 32)"

vault kv put ecommerce/payment-providers/stripe \
    publishable_key="pk_test_your_stripe_publishable_key" \
    secret_key="sk_test_your_stripe_secret_key" \
    webhook_secret="whsec_your_webhook_secret"

vault kv put ecommerce/payment-providers/paypal \
    client_id="your-paypal-client-id" \
    client_secret="your-paypal-client-secret" \
    webhook_id="your-webhook-id"

# Cart Service secrets
vault kv put ecommerce/cart-service/config \
    redis_url="redis://redis:6379/1" \
    session_secret="$(openssl rand -base64 32)"

# Order Service secrets
vault kv put ecommerce/order-service/config \
    connection_string="Host=postgres;Database=ecommerce_orders;Username=order_service;Password=$(openssl rand -base64 16)" \
    mongodb_connection="mongodb://mongo:27017/ecommerce_orders"

# Inventory Service secrets
vault kv put ecommerce/inventory-service/config \
    db_connection="host=postgres port=5432 user=inventory_service password=$(openssl rand -base64 16) dbname=ecommerce_inventory sslmode=disable"

# Shipping Service secrets
vault kv put ecommerce/shipping-service/config \
    db_connection="Host=postgres;Database=ecommerce_shipping;Username=shipping_service;Password=$(openssl rand -base64 16)"

vault kv put ecommerce/shipping-service/carriers \
    fedex_key="your-fedex-key" \
    fedex_password="your-fedex-password" \
    fedex_account="your-fedex-account" \
    fedex_meter="your-fedex-meter" \
    ups_username="your-ups-username" \
    ups_password="your-ups-password" \
    ups_access_key="your-ups-access-key" \
    dhl_site_id="your-dhl-site-id" \
    dhl_password="your-dhl-password"

# Promotion Service secrets
vault kv put ecommerce/promotion-service/config \
    connection_string="Host=postgres;Database=ecommerce_promotions;Username=promotion_service;Password=$(openssl rand -base64 16)" \
    redis_url="redis://redis:6379/2"

# Notification Service secrets
vault kv put ecommerce/notification-service/config \
    kafka_brokers="kafka:9092" \
    email_api_key="your-sendgrid-api-key" \
    sms_api_key="your-twilio-api-key" \
    sms_auth_token="your-twilio-auth-token" \
    push_notification_key="your-firebase-key"

# Review Service secrets
vault kv put ecommerce/review-service/config \
    mongodb_connection="mongodb://mongo:27017/ecommerce_reviews"

# Admin Service secrets
vault kv put ecommerce/admin-service/config \
    db_connection="Host=postgres;Database=ecommerce_admin;Username=admin_service;Password=$(openssl rand -base64 16)" \
    admin_jwt_secret="$(openssl rand -base64 64)"

# Get role IDs and secret IDs for applications
echo "📝 Generating application credentials..."

mkdir -p /tmp/vault-credentials

# Generate credentials for each service
for service in api-gateway auth-service user-service product-service payment-service; do
    echo "Generating credentials for $service..."
    
    role_id=$(vault read -field=role_id auth/approle/role/$service/role-id)
    secret_id=$(vault write -field=secret_id -f auth/approle/role/$service/secret-id)
    
    cat > /tmp/vault-credentials/$service.env <<EOF
VAULT_ADDR=http://vault:8200
VAULT_ROLE_ID=$role_id
VAULT_SECRET_ID=$secret_id
EOF
    
    echo "✅ Credentials generated for $service"
done

echo "🎉 Vault initialization completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the credential files from /tmp/vault-credentials/ to your services"
echo "2. Update your application configurations to use Vault"
echo "3. Replace placeholder values with actual API keys and secrets"
echo ""
echo "🌐 Vault UI: http://localhost:8200"
echo "🔑 Root Token: myroot"
echo "🎛️ Vault UI (Alternative): http://localhost:8000"

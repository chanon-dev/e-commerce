#!/bin/bash

# Vault Setup Script for E-commerce Platform
# This script initializes Vault with secrets for different environments

set -e

# Configuration
VAULT_ADDR=${VAULT_ADDR:-"http://localhost:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-""}
ENVIRONMENT=${1:-"development"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[VAULT]${NC} $1"
}

# Function to check if Vault is running and unsealed
check_vault_status() {
    print_status "Checking Vault status..."
    
    if ! curl -s "$VAULT_ADDR/v1/sys/health" > /dev/null; then
        print_error "Vault is not accessible at $VAULT_ADDR"
        print_error "Please start Vault first: docker-compose -f docker-compose.infrastructure.yml up -d vault"
        exit 1
    fi
    
    local health=$(curl -s "$VAULT_ADDR/v1/sys/health")
    local sealed=$(echo "$health" | jq -r '.sealed // true')
    
    if [ "$sealed" = "true" ]; then
        print_error "Vault is sealed. Please unseal Vault first."
        exit 1
    fi
    
    print_status "Vault is running and unsealed"
}

# Function to authenticate with Vault
authenticate_vault() {
    if [ -z "$VAULT_TOKEN" ]; then
        if [ "$ENVIRONMENT" = "development" ]; then
            # Use root token for development
            VAULT_TOKEN="dev-only-token"
            print_warning "Using development root token"
        else
            print_error "VAULT_TOKEN environment variable is required for $ENVIRONMENT"
            exit 1
        fi
    fi
    
    export VAULT_TOKEN
    print_status "Authenticated with Vault"
}

# Function to enable secrets engine
enable_secrets_engine() {
    local engine_type=$1
    local path=$2
    
    print_status "Enabling $engine_type secrets engine at $path..."
    
    if vault secrets list | grep -q "^$path/"; then
        print_warning "Secrets engine already enabled at $path"
        return 0
    fi
    
    vault secrets enable -path="$path" "$engine_type"
    print_status "Enabled $engine_type secrets engine at $path"
}

# Function to create database secrets
create_database_secrets() {
    print_header "Creating Database Secrets"
    
    case $ENVIRONMENT in
        "production")
            vault kv put secret/database/postgresql \
                host="$DB_HOST" \
                port="$DB_PORT" \
                username="$DB_USERNAME" \
                password="$DB_PASSWORD" \
                database="$DB_NAME"
            ;;
        "staging")
            vault kv put secret/database/postgresql \
                host="postgres-staging.company.com" \
                port="5432" \
                username="ecommerce_staging" \
                password="$(openssl rand -base64 32)" \
                database="ecommerce_staging"
            ;;
        "development")
            vault kv put secret/database/postgresql \
                host="localhost" \
                port="5432" \
                username="postgres" \
                password="password" \
                database="ecommerce"
            ;;
    esac
    
    print_status "Database secrets created for $ENVIRONMENT"
}

# Function to create Redis secrets
create_redis_secrets() {
    print_header "Creating Redis Secrets"
    
    case $ENVIRONMENT in
        "production")
            vault kv put secret/cache/redis \
                host="$REDIS_HOST" \
                port="$REDIS_PORT" \
                password="$REDIS_PASSWORD"
            ;;
        "staging")
            vault kv put secret/cache/redis \
                host="redis-staging.company.com" \
                port="6379" \
                password="$(openssl rand -base64 32)"
            ;;
        "development")
            vault kv put secret/cache/redis \
                host="localhost" \
                port="6379"
            ;;
    esac
    
    print_status "Redis secrets created for $ENVIRONMENT"
}

# Function to create JWT secrets
create_jwt_secrets() {
    print_header "Creating JWT Secrets"
    
    local jwt_secret
    case $ENVIRONMENT in
        "production"|"staging")
            jwt_secret="$(openssl rand -base64 64)"
            ;;
        "development")
            jwt_secret="dev-jwt-secret-change-in-production"
            ;;
    esac
    
    vault kv put secret/auth/jwt \
        secret="$jwt_secret" \
        algorithm="HS256" \
        expiresIn="1h" \
        issuer="ecommerce-platform" \
        audience="ecommerce-users"
    
    print_status "JWT secrets created for $ENVIRONMENT"
}

# Function to create Keycloak secrets
create_keycloak_secrets() {
    print_header "Creating Keycloak Secrets"
    
    case $ENVIRONMENT in
        "production")
            vault kv put secret/auth/keycloak \
                url="$KEYCLOAK_URL" \
                realm="$KEYCLOAK_REALM" \
                clientId="$KEYCLOAK_CLIENT_ID" \
                clientSecret="$KEYCLOAK_CLIENT_SECRET"
            ;;
        "staging")
            vault kv put secret/auth/keycloak \
                url="https://keycloak-staging.company.com" \
                realm="ecommerce-staging" \
                clientId="ecommerce-staging-client" \
                clientSecret="$(openssl rand -base64 32)"
            ;;
        "development")
            vault kv put secret/auth/keycloak \
                url="http://localhost:8080" \
                realm="ecommerce" \
                clientId="ecommerce-client" \
                clientSecret="dev-secret"
            ;;
    esac
    
    print_status "Keycloak secrets created for $ENVIRONMENT"
}

# Function to create Kafka secrets
create_kafka_secrets() {
    print_header "Creating Kafka Secrets"
    
    case $ENVIRONMENT in
        "production")
            vault kv put secret/messaging/kafka \
                brokers="$KAFKA_BROKERS" \
                username="$KAFKA_SASL_USERNAME" \
                password="$KAFKA_SASL_PASSWORD" \
                ssl='{"ca":"'$KAFKA_SSL_CA'","cert":"'$KAFKA_SSL_CERT'","key":"'$KAFKA_SSL_KEY'"}'
            ;;
        "staging")
            vault kv put secret/messaging/kafka \
                brokers="kafka-staging-1:9092,kafka-staging-2:9092" \
                username="ecommerce-staging" \
                password="$(openssl rand -base64 32)"
            ;;
        "development")
            vault kv put secret/messaging/kafka \
                brokers="localhost:9092"
            ;;
    esac
    
    print_status "Kafka secrets created for $ENVIRONMENT"
}

# Function to create payment provider secrets
create_payment_secrets() {
    print_header "Creating Payment Provider Secrets"
    
    # Stripe
    case $ENVIRONMENT in
        "production")
            vault kv put secret/payment/stripe \
                publicKey="$STRIPE_PUBLIC_KEY" \
                secretKey="$STRIPE_SECRET_KEY" \
                webhookSecret="$STRIPE_WEBHOOK_SECRET"
            ;;
        "staging")
            vault kv put secret/payment/stripe \
                publicKey="pk_test_staging_key" \
                secretKey="sk_test_staging_key" \
                webhookSecret="whsec_staging_secret"
            ;;
        "development")
            vault kv put secret/payment/stripe \
                publicKey="pk_test_dev_key" \
                secretKey="sk_test_dev_key" \
                webhookSecret="whsec_dev_secret"
            ;;
    esac
    
    # PayPal
    case $ENVIRONMENT in
        "production")
            vault kv put secret/payment/paypal \
                clientId="$PAYPAL_CLIENT_ID" \
                clientSecret="$PAYPAL_CLIENT_SECRET" \
                mode="live"
            ;;
        "staging"|"development")
            vault kv put secret/payment/paypal \
                clientId="sandbox_client_id" \
                clientSecret="sandbox_client_secret" \
                mode="sandbox"
            ;;
    esac
    
    print_status "Payment provider secrets created for $ENVIRONMENT"
}

# Function to create shipping carrier secrets
create_shipping_secrets() {
    print_header "Creating Shipping Carrier Secrets"
    
    # FedEx
    vault kv put secret/shipping/fedex \
        accountNumber="${FEDEX_ACCOUNT_NUMBER:-dev_account}" \
        meterNumber="${FEDEX_METER_NUMBER:-dev_meter}" \
        key="${FEDEX_KEY:-dev_key}" \
        password="${FEDEX_PASSWORD:-dev_password}" \
        testMode="$([[ $ENVIRONMENT == "production" ]] && echo "false" || echo "true")"
    
    # UPS
    vault kv put secret/shipping/ups \
        username="${UPS_USERNAME:-dev_user}" \
        password="${UPS_PASSWORD:-dev_password}" \
        accessKey="${UPS_ACCESS_KEY:-dev_access_key}" \
        accountNumber="${UPS_ACCOUNT_NUMBER:-dev_account}" \
        testMode="$([[ $ENVIRONMENT == "production" ]] && echo "false" || echo "true")"
    
    # USPS
    vault kv put secret/shipping/usps \
        userId="${USPS_USER_ID:-dev_user}" \
        password="${USPS_PASSWORD:-dev_password}" \
        testMode="$([[ $ENVIRONMENT == "production" ]] && echo "false" || echo "true")"
    
    print_status "Shipping carrier secrets created for $ENVIRONMENT"
}

# Function to create email/notification secrets
create_notification_secrets() {
    print_header "Creating Notification Secrets"
    
    # Email (SMTP)
    case $ENVIRONMENT in
        "production")
            vault kv put secret/notification/email \
                smtp='{"host":"'$SMTP_HOST'","port":'$SMTP_PORT',"secure":true,"user":"'$SMTP_USER'","pass":"'$SMTP_PASS'"}' \
                from="$EMAIL_FROM"
            ;;
        "staging")
            vault kv put secret/notification/email \
                smtp='{"host":"smtp-staging.company.com","port":587,"secure":true,"user":"staging@company.com","pass":"staging_password"}' \
                from="noreply-staging@company.com"
            ;;
        "development")
            vault kv put secret/notification/email \
                smtp='{"host":"localhost","port":1025,"secure":false,"user":"","pass":""}' \
                from="noreply@localhost"
            ;;
    esac
    
    # SMS (Twilio)
    case $ENVIRONMENT in
        "production")
            vault kv put secret/notification/sms \
                accountSid="$TWILIO_ACCOUNT_SID" \
                authToken="$TWILIO_AUTH_TOKEN" \
                fromNumber="$TWILIO_FROM_NUMBER"
            ;;
        "staging"|"development")
            vault kv put secret/notification/sms \
                accountSid="test_account_sid" \
                authToken="test_auth_token" \
                fromNumber="+1234567890"
            ;;
    esac
    
    print_status "Notification secrets created for $ENVIRONMENT"
}

# Function to create API keys for external services
create_external_api_secrets() {
    print_header "Creating External API Secrets"
    
    # Google APIs
    vault kv put secret/external/google \
        mapsApiKey="${GOOGLE_MAPS_API_KEY:-dev_maps_key}" \
        analyticsId="${GOOGLE_ANALYTICS_ID:-dev_analytics_id}"
    
    # AWS Services
    if [ "$ENVIRONMENT" = "production" ]; then
        vault kv put secret/external/aws \
            accessKeyId="$AWS_ACCESS_KEY_ID" \
            secretAccessKey="$AWS_SECRET_ACCESS_KEY" \
            region="$AWS_REGION"
    else
        vault kv put secret/external/aws \
            accessKeyId="dev_access_key" \
            secretAccessKey="dev_secret_key" \
            region="us-east-1"
    fi
    
    print_status "External API secrets created for $ENVIRONMENT"
}

# Function to setup AppRole authentication for production
setup_approle_auth() {
    if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
        return 0
    fi
    
    print_header "Setting up AppRole Authentication"
    
    # Enable AppRole auth method
    if ! vault auth list | grep -q "approle/"; then
        vault auth enable approle
        print_status "AppRole auth method enabled"
    fi
    
    # Create policy for ecommerce application
    cat > /tmp/ecommerce-policy.hcl << EOF
path "secret/data/*" {
  capabilities = ["read"]
}

path "secret/metadata/*" {
  capabilities = ["list"]
}
EOF
    
    vault policy write ecommerce-policy /tmp/ecommerce-policy.hcl
    rm /tmp/ecommerce-policy.hcl
    
    # Create AppRole
    vault write auth/approle/role/ecommerce-app \
        token_policies="ecommerce-policy" \
        token_ttl=1h \
        token_max_ttl=4h \
        bind_secret_id=true
    
    # Get Role ID and Secret ID
    local role_id=$(vault read -field=role_id auth/approle/role/ecommerce-app/role-id)
    local secret_id=$(vault write -field=secret_id -f auth/approle/role/ecommerce-app/secret-id)
    
    print_status "AppRole created successfully"
    print_status "Role ID: $role_id"
    print_status "Secret ID: $secret_id"
    print_warning "Save these credentials securely for your application configuration"
}

# Function to list all secrets
list_secrets() {
    print_header "Listing All Secrets for $ENVIRONMENT"
    
    echo "Database secrets:"
    vault kv get secret/database/postgresql || echo "  Not found"
    echo ""
    
    echo "Cache secrets:"
    vault kv get secret/cache/redis || echo "  Not found"
    echo ""
    
    echo "Auth secrets:"
    vault kv get secret/auth/jwt || echo "  Not found"
    vault kv get secret/auth/keycloak || echo "  Not found"
    echo ""
    
    echo "Messaging secrets:"
    vault kv get secret/messaging/kafka || echo "  Not found"
    echo ""
    
    echo "Payment secrets:"
    vault kv list secret/payment/ || echo "  Not found"
    echo ""
    
    echo "Shipping secrets:"
    vault kv list secret/shipping/ || echo "  Not found"
    echo ""
    
    echo "Notification secrets:"
    vault kv list secret/notification/ || echo "  Not found"
    echo ""
}

# Function to backup secrets
backup_secrets() {
    print_header "Backing up Secrets"
    
    local backup_file="vault-backup-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
    
    # This is a simplified backup - in production, use proper Vault backup tools
    vault kv get -format=json secret/ > "$backup_file" 2>/dev/null || true
    
    print_status "Secrets backed up to $backup_file"
}

# Main execution
main() {
    print_header "Vault Setup for E-commerce Platform ($ENVIRONMENT)"
    
    # Check prerequisites
    if ! command -v vault &> /dev/null; then
        print_error "Vault CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check Vault status
    check_vault_status
    
    # Authenticate
    authenticate_vault
    
    # Enable secrets engines
    enable_secrets_engine "kv-v2" "secret"
    
    # Create all secrets
    create_database_secrets
    create_redis_secrets
    create_jwt_secrets
    create_keycloak_secrets
    create_kafka_secrets
    create_payment_secrets
    create_shipping_secrets
    create_notification_secrets
    create_external_api_secrets
    
    # Setup AppRole for production
    setup_approle_auth
    
    print_status "✅ Vault setup completed successfully for $ENVIRONMENT!"
    print_status "🔐 All secrets have been stored securely in Vault"
    
    if [ "${2:-}" = "--list" ]; then
        list_secrets
    fi
    
    if [ "${2:-}" = "--backup" ]; then
        backup_secrets
    fi
}

# Script usage
usage() {
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Environments:"
    echo "  development  Setup for local development"
    echo "  staging      Setup for staging environment"
    echo "  production   Setup for production environment"
    echo ""
    echo "Options:"
    echo "  --list       List all secrets after setup"
    echo "  --backup     Create backup of secrets"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production --list"
    echo "  $0 staging --backup"
}

# Handle command line arguments
case "${1:-}" in
    "development"|"staging"|"production")
        main "$@"
        ;;
    "--help"|"")
        usage
        exit 0
        ;;
    *)
        print_error "Invalid environment: $1"
        usage
        exit 1
        ;;
esac

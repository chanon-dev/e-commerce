#!/bin/bash

# Keycloak initialization and configuration script
set -e

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
REALM_NAME="ecommerce"

echo "🔐 Initializing Keycloak for E-commerce Platform..."

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
until curl -s "$KEYCLOAK_URL/health/ready" > /dev/null; do
  echo "Waiting for Keycloak..."
  sleep 5
done

echo "✅ Keycloak is ready!"

# Get admin access token
echo "🔑 Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token obtained"

# Function to make authenticated requests to Keycloak Admin API
keycloak_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -n "$data" ]; then
    curl -s -X "$method" "$KEYCLOAK_URL/admin/realms/$endpoint" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s -X "$method" "$KEYCLOAK_URL/admin/realms/$endpoint" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json"
  fi
}

# Check if realm already exists
echo "🏢 Checking if realm exists..."
REALM_EXISTS=$(keycloak_api "GET" "$REALM_NAME" | jq -r '.realm // empty')

if [ "$REALM_EXISTS" = "$REALM_NAME" ]; then
  echo "✅ Realm '$REALM_NAME' already exists"
else
  echo "📋 Realm '$REALM_NAME' will be created during import"
fi

# Configure realm settings (if realm exists)
if [ "$REALM_EXISTS" = "$REALM_NAME" ]; then
  echo "⚙️ Configuring realm settings..."
  
  # Update realm settings
  keycloak_api "PUT" "$REALM_NAME" '{
    "realm": "ecommerce",
    "displayName": "E-commerce Platform",
    "enabled": true,
    "registrationAllowed": true,
    "registrationEmailAsUsername": true,
    "rememberMe": true,
    "verifyEmail": true,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true,
    "passwordPolicy": "length(8) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1) and notUsername",
    "supportedLocales": ["en", "th"],
    "defaultLocale": "en",
    "internationalizationEnabled": true
  }'
  
  echo "✅ Realm settings updated"
fi

# Create additional users if needed
echo "👥 Creating additional test users..."

# Create test customer
keycloak_api "POST" "$REALM_NAME/users" '{
  "username": "testcustomer",
  "email": "test@customer.com",
  "firstName": "Test",
  "lastName": "Customer",
  "enabled": true,
  "emailVerified": true,
  "credentials": [{
    "type": "password",
    "value": "customer123",
    "temporary": false
  }],
  "attributes": {
    "customer_id": ["CUST-001"],
    "loyalty_points": ["100"],
    "phone": ["+1234567890"],
    "date_of_birth": ["1990-01-01"],
    "preferred_language": ["en"]
  }
}'

# Create test vendor
keycloak_api "POST" "$REALM_NAME/users" '{
  "username": "testvendor",
  "email": "test@vendor.com",
  "firstName": "Test",
  "lastName": "Vendor",
  "enabled": true,
  "emailVerified": true,
  "credentials": [{
    "type": "password",
    "value": "vendor123",
    "temporary": false
  }],
  "attributes": {
    "vendor_id": ["VEND-001"],
    "company_name": ["Test Vendor Inc"],
    "tax_id": ["123456789"],
    "business_type": ["retail"]
  }
}'

echo "✅ Test users created"

# Configure identity providers (if secrets are available)
echo "🔗 Configuring identity providers..."

# Google OAuth (update with real credentials)
keycloak_api "PUT" "$REALM_NAME/identity-provider/instances/google" '{
  "alias": "google",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "config": {
    "clientId": "your-google-client-id",
    "clientSecret": "your-google-client-secret",
    "syncMode": "IMPORT",
    "hostedDomain": "",
    "useJwksUrl": "true"
  }
}'

# Facebook OAuth (update with real credentials)
keycloak_api "PUT" "$REALM_NAME/identity-provider/instances/facebook" '{
  "alias": "facebook",
  "displayName": "Facebook",
  "providerId": "facebook",
  "enabled": true,
  "config": {
    "clientId": "your-facebook-app-id",
    "clientSecret": "your-facebook-app-secret",
    "syncMode": "IMPORT"
  }
}'

# GitHub OAuth (update with real credentials)
keycloak_api "PUT" "$REALM_NAME/identity-provider/instances/github" '{
  "alias": "github",
  "displayName": "GitHub",
  "providerId": "github",
  "enabled": true,
  "config": {
    "clientId": "your-github-client-id",
    "clientSecret": "your-github-client-secret",
    "syncMode": "IMPORT"
  }
}'

echo "✅ Identity providers configured"

# Configure client scopes
echo "🎯 Configuring client scopes..."

# Create custom client scope for e-commerce
keycloak_api "POST" "$REALM_NAME/client-scopes" '{
  "name": "ecommerce-orders",
  "description": "Access to order information",
  "protocol": "openid-connect",
  "attributes": {
    "include.in.token.scope": "true",
    "display.on.consent.screen": "true"
  },
  "protocolMappers": [{
    "name": "order-access",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-audience-mapper",
    "config": {
      "included.client.audience": "ecommerce-api",
      "id.token.claim": "false",
      "access.token.claim": "true"
    }
  }]
}'

echo "✅ Client scopes configured"

# Configure authentication flows
echo "🔄 Configuring authentication flows..."

# Create custom registration flow with email verification
REGISTRATION_FLOW_ID=$(keycloak_api "POST" "$REALM_NAME/authentication/flows" '{
  "alias": "ecommerce-registration",
  "description": "E-commerce registration flow with email verification",
  "providerId": "basic-flow",
  "topLevel": true,
  "builtIn": false
}' | jq -r '.id')

if [ "$REGISTRATION_FLOW_ID" != "null" ] && [ -n "$REGISTRATION_FLOW_ID" ]; then
  # Add registration form execution
  keycloak_api "POST" "$REALM_NAME/authentication/flows/ecommerce-registration/executions/execution" '{
    "provider": "registration-page-form"
  }'
  
  # Add email verification execution
  keycloak_api "POST" "$REALM_NAME/authentication/flows/ecommerce-registration/executions/execution" '{
    "provider": "registration-mail-verification"
  }'
  
  echo "✅ Custom registration flow created"
fi

# Create event listeners configuration
echo "📊 Configuring event listeners..."

keycloak_api "PUT" "$REALM_NAME/events/config" '{
  "eventsEnabled": true,
  "eventsListeners": ["jboss-logging"],
  "enabledEventTypes": [
    "LOGIN", "LOGIN_ERROR", "REGISTER", "REGISTER_ERROR",
    "LOGOUT", "LOGOUT_ERROR", "CODE_TO_TOKEN", "CODE_TO_TOKEN_ERROR",
    "CLIENT_LOGIN", "CLIENT_LOGIN_ERROR", "REFRESH_TOKEN", "REFRESH_TOKEN_ERROR",
    "UPDATE_PROFILE", "UPDATE_PROFILE_ERROR", "UPDATE_PASSWORD", "UPDATE_PASSWORD_ERROR",
    "UPDATE_EMAIL", "UPDATE_EMAIL_ERROR", "VERIFY_EMAIL", "VERIFY_EMAIL_ERROR",
    "RESET_PASSWORD", "RESET_PASSWORD_ERROR", "REMOVE_TOTP", "REMOVE_TOTP_ERROR",
    "GRANT_CONSENT", "GRANT_CONSENT_ERROR", "UPDATE_CONSENT", "UPDATE_CONSENT_ERROR",
    "REVOKE_GRANT", "REVOKE_GRANT_ERROR"
  ],
  "eventsExpiration": 2592000,
  "adminEventsEnabled": true,
  "adminEventsDetailsEnabled": true
}'

echo "✅ Event listeners configured"

# Generate client credentials for services
echo "🔑 Generating service credentials..."

mkdir -p /tmp/keycloak-credentials

# Get client secrets
FRONTEND_SECRET=$(keycloak_api "GET" "$REALM_NAME/clients" | jq -r '.[] | select(.clientId=="ecommerce-frontend") | .secret')
ADMIN_SECRET=$(keycloak_api "GET" "$REALM_NAME/clients" | jq -r '.[] | select(.clientId=="ecommerce-admin") | .secret')
API_SECRET=$(keycloak_api "GET" "$REALM_NAME/clients" | jq -r '.[] | select(.clientId=="ecommerce-api") | .secret')

# Create environment files for each service
cat > /tmp/keycloak-credentials/frontend.env <<EOF
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-frontend
KEYCLOAK_CLIENT_SECRET=$FRONTEND_SECRET
EOF

cat > /tmp/keycloak-credentials/admin.env <<EOF
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-admin
KEYCLOAK_CLIENT_SECRET=$ADMIN_SECRET
EOF

cat > /tmp/keycloak-credentials/api.env <<EOF
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-api
KEYCLOAK_CLIENT_SECRET=$API_SECRET
EOF

echo "✅ Service credentials generated"

# Create test tokens for development
echo "🧪 Creating test tokens..."

# Get token for test customer
CUSTOMER_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testcustomer" \
  -d "password=customer123" \
  -d "grant_type=password" \
  -d "client_id=ecommerce-frontend" \
  -d "client_secret=$FRONTEND_SECRET" | jq -r '.access_token')

# Get token for test vendor
VENDOR_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testvendor" \
  -d "password=vendor123" \
  -d "grant_type=password" \
  -d "client_id=ecommerce-frontend" \
  -d "client_secret=$FRONTEND_SECRET" | jq -r '.access_token')

# Save test tokens
cat > /tmp/keycloak-credentials/test-tokens.json <<EOF
{
  "customer_token": "$CUSTOMER_TOKEN",
  "vendor_token": "$VENDOR_TOKEN",
  "expires_in": 300
}
EOF

echo "✅ Test tokens created"

echo "🎉 Keycloak initialization completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "🌐 Keycloak URL: $KEYCLOAK_URL"
echo "🏢 Realm: $REALM_NAME"
echo "👤 Admin User: $ADMIN_USER"
echo "🔑 Admin Password: $ADMIN_PASSWORD"
echo ""
echo "👥 Test Users:"
echo "  - Customer: testcustomer / customer123"
echo "  - Vendor: testvendor / vendor123"
echo ""
echo "🔗 Identity Providers:"
echo "  - Google OAuth (configure with real credentials)"
echo "  - Facebook OAuth (configure with real credentials)"
echo "  - GitHub OAuth (configure with real credentials)"
echo ""
echo "📁 Credentials saved to: /tmp/keycloak-credentials/"
echo ""
echo "🚀 Next Steps:"
echo "1. Update identity provider credentials with real OAuth app credentials"
echo "2. Configure your applications to use the generated client credentials"
echo "3. Test authentication flows with the test users"
echo "4. Customize themes and branding as needed"

#!/bin/bash

echo "🔐 Setting up Keycloak for E-commerce Platform..."

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to start..."
sleep 30

# Get admin access token
get_admin_token() {
    curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin&password=admin&grant_type=password&client_id=admin-cli" | \
        jq -r '.access_token'
}

ADMIN_TOKEN=$(get_admin_token)

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token. Make sure Keycloak is running."
    exit 1
fi

echo "✅ Got admin token"

# Create E-commerce realm
echo "🏢 Creating E-commerce realm..."
curl -s -X POST "http://localhost:8080/admin/realms" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "realm": "ecommerce",
        "enabled": true,
        "displayName": "E-commerce Platform",
        "displayNameHtml": "<div class=\"kc-logo-text\"><span>E-commerce Platform</span></div>",
        "loginTheme": "keycloak",
        "adminTheme": "keycloak",
        "accountTheme": "keycloak",
        "emailTheme": "keycloak",
        "internationalizationEnabled": true,
        "supportedLocales": ["en", "th"],
        "defaultLocale": "en",
        "sslRequired": "external",
        "registrationAllowed": true,
        "registrationEmailAsUsername": true,
        "rememberMe": true,
        "verifyEmail": true,
        "loginWithEmailAllowed": true,
        "duplicateEmailsAllowed": false,
        "resetPasswordAllowed": true,
        "editUsernameAllowed": false,
        "bruteForceProtected": true,
        "permanentLockout": false,
        "maxFailureWaitSeconds": 900,
        "minimumQuickLoginWaitSeconds": 60,
        "waitIncrementSeconds": 60,
        "quickLoginCheckMilliSeconds": 1000,
        "maxDeltaTimeSeconds": 43200,
        "failureFactor": 30,
        "passwordPolicy": "length(8) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1) and notUsername",
        "otpPolicyType": "totp",
        "otpPolicyAlgorithm": "HmacSHA1",
        "otpPolicyInitialCounter": 0,
        "otpPolicyDigits": 6,
        "otpPolicyLookAheadWindow": 1,
        "otpPolicyPeriod": 30
    }'

echo "✅ E-commerce realm created"

# Create Customer client
echo "👤 Creating Customer client..."
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "clientId": "customer-app",
        "name": "Customer Application",
        "description": "E-commerce customer platform",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "secret": "customer-app-secret",
        "redirectUris": [
            "http://localhost:3000/*",
            "https://ecommerce.com/*"
        ],
        "webOrigins": [
            "http://localhost:3000",
            "https://ecommerce.com"
        ],
        "protocol": "openid-connect",
        "publicClient": false,
        "bearerOnly": false,
        "consentRequired": false,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "directAccessGrantsEnabled": true,
        "serviceAccountsEnabled": false,
        "frontchannelLogout": true,
        "attributes": {
            "saml.assertion.signature": "false",
            "saml.force.post.binding": "false",
            "saml.multivalued.roles": "false",
            "saml.encrypt": "false",
            "saml.server.signature": "false",
            "saml.server.signature.keyinfo.ext": "false",
            "exclude.session.state.from.auth.response": "false",
            "saml_force_name_id_format": "false",
            "saml.client.signature": "false",
            "tls.client.certificate.bound.access.tokens": "false",
            "saml.authnstatement": "false",
            "display.on.consent.screen": "false",
            "saml.onetimeuse.condition": "false"
        }
    }'

echo "✅ Customer client created"

# Create Admin client
echo "👨‍💼 Creating Admin client..."
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "clientId": "admin-app",
        "name": "Admin Dashboard",
        "description": "E-commerce admin dashboard",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "secret": "admin-app-secret",
        "redirectUris": [
            "http://localhost:3100/*",
            "https://admin.ecommerce.com/*"
        ],
        "webOrigins": [
            "http://localhost:3100",
            "https://admin.ecommerce.com"
        ],
        "protocol": "openid-connect",
        "publicClient": false,
        "bearerOnly": false,
        "consentRequired": false,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "directAccessGrantsEnabled": true,
        "serviceAccountsEnabled": true,
        "frontchannelLogout": true
    }'

echo "✅ Admin client created"

# Create API client for service-to-service communication
echo "🔌 Creating API client..."
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "clientId": "api-service",
        "name": "API Service",
        "description": "Service-to-service communication",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "secret": "api-service-secret",
        "protocol": "openid-connect",
        "publicClient": false,
        "bearerOnly": true,
        "consentRequired": false,
        "standardFlowEnabled": false,
        "implicitFlowEnabled": false,
        "directAccessGrantsEnabled": false,
        "serviceAccountsEnabled": true
    }'

echo "✅ API client created"

# Create roles
echo "🎭 Creating roles..."

# Customer role
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "customer",
        "description": "Customer role for e-commerce platform",
        "composite": false,
        "clientRole": false,
        "containerId": "ecommerce"
    }'

# Admin role
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "admin",
        "description": "Administrator role for e-commerce platform",
        "composite": false,
        "clientRole": false,
        "containerId": "ecommerce"
    }'

# Manager role
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "manager",
        "description": "Manager role for e-commerce platform",
        "composite": false,
        "clientRole": false,
        "containerId": "ecommerce"
    }'

echo "✅ Roles created"

# Create test users
echo "👥 Creating test users..."

# Admin user
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin@ecommerce.com",
        "email": "admin@ecommerce.com",
        "firstName": "Admin",
        "lastName": "User",
        "enabled": true,
        "emailVerified": true,
        "credentials": [{
            "type": "password",
            "value": "Admin123!",
            "temporary": false
        }],
        "realmRoles": ["admin"],
        "attributes": {
            "department": ["IT"],
            "position": ["Administrator"]
        }
    }'

# Customer user
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "customer@ecommerce.com",
        "email": "customer@ecommerce.com",
        "firstName": "John",
        "lastName": "Doe",
        "enabled": true,
        "emailVerified": true,
        "credentials": [{
            "type": "password",
            "value": "Customer123!",
            "temporary": false
        }],
        "realmRoles": ["customer"],
        "attributes": {
            "phone": ["+1234567890"],
            "address": ["123 Main St, City, Country"]
        }
    }'

echo "✅ Test users created"

# Configure social login providers
echo "🌐 Configuring social login providers..."

# Google OAuth
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/identity-provider/instances" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "alias": "google",
        "providerId": "google",
        "enabled": true,
        "updateProfileFirstLoginMode": "on",
        "trustEmail": true,
        "storeToken": false,
        "addReadTokenRoleOnCreate": false,
        "authenticateByDefault": false,
        "linkOnly": false,
        "firstBrokerLoginFlowAlias": "first broker login",
        "config": {
            "clientId": "your-google-client-id",
            "clientSecret": "your-google-client-secret",
            "hostedDomain": "",
            "useJwksUrl": "true"
        }
    }'

# Facebook OAuth
curl -s -X POST "http://localhost:8080/admin/realms/ecommerce/identity-provider/instances" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "alias": "facebook",
        "providerId": "facebook",
        "enabled": true,
        "updateProfileFirstLoginMode": "on",
        "trustEmail": true,
        "storeToken": false,
        "addReadTokenRoleOnCreate": false,
        "authenticateByDefault": false,
        "linkOnly": false,
        "firstBrokerLoginFlowAlias": "first broker login",
        "config": {
            "clientId": "your-facebook-app-id",
            "clientSecret": "your-facebook-app-secret",
            "defaultScope": "email"
        }
    }'

echo "✅ Social login providers configured"

# Configure email settings
echo "📧 Configuring email settings..."
curl -s -X PUT "http://localhost:8080/admin/realms/ecommerce" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "smtpServer": {
            "host": "smtp.gmail.com",
            "port": "587",
            "from": "noreply@ecommerce.com",
            "fromDisplayName": "E-commerce Platform",
            "replyTo": "support@ecommerce.com",
            "replyToDisplayName": "E-commerce Support",
            "envelopeFrom": "",
            "ssl": "false",
            "starttls": "true",
            "auth": "true",
            "user": "your-email@gmail.com",
            "password": "your-app-password"
        }
    }'

echo "✅ Email settings configured"

# Configure security settings
echo "🔒 Configuring security settings..."
curl -s -X PUT "http://localhost:8080/admin/realms/ecommerce" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "bruteForceProtected": true,
        "permanentLockout": false,
        "maxFailureWaitSeconds": 900,
        "minimumQuickLoginWaitSeconds": 60,
        "waitIncrementSeconds": 60,
        "quickLoginCheckMilliSeconds": 1000,
        "maxDeltaTimeSeconds": 43200,
        "failureFactor": 30,
        "passwordPolicy": "length(8) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1) and notUsername and notEmail and passwordHistory(3)",
        "otpPolicyType": "totp",
        "otpPolicyAlgorithm": "HmacSHA1",
        "otpPolicyInitialCounter": 0,
        "otpPolicyDigits": 6,
        "otpPolicyLookAheadWindow": 1,
        "otpPolicyPeriod": 30,
        "otpSupportedApplications": ["totpAppGoogleName", "totpAppMicrosoftAuthenticatorName"]
    }'

echo "✅ Security settings configured"

echo ""
echo "🎉 Keycloak setup completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "🌐 Keycloak URL: http://localhost:8080"
echo "🏢 Realm: ecommerce"
echo ""
echo "👤 Test Users:"
echo "  Admin: admin@ecommerce.com / Admin123!"
echo "  Customer: customer@ecommerce.com / Customer123!"
echo ""
echo "🔑 Client Credentials:"
echo "  Customer App: customer-app / customer-app-secret"
echo "  Admin App: admin-app / admin-app-secret"
echo "  API Service: api-service / api-service-secret"
echo ""
echo "🔗 Important URLs:"
echo "  Admin Console: http://localhost:8080/admin"
echo "  Account Console: http://localhost:8080/realms/ecommerce/account"
echo "  OpenID Configuration: http://localhost:8080/realms/ecommerce/.well-known/openid_configuration"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Update social login credentials (Google, Facebook)"
echo "  2. Configure SMTP settings for email"
echo "  3. Update redirect URIs for production domains"
echo "  4. Configure SSL certificates for production"
echo "  5. Set up backup procedures"

#!/bin/bash

echo "🧪 Running tests for all E-commerce services..."

# Array of Node.js services
node_services=(
    "api-gateway"
    "auth-service"
    "cart-service"
    "shipping-service"
    "review-service"
    "admin-service"
)

# Array of .NET services
dotnet_services=(
    "user-service"
    "order-service"
    "promotion-service"
)

# Array of Go services
go_services=(
    "product-service"
    "payment-service"
    "inventory-service"
    "notification-service"
)

# Test Node.js services
for service in "${node_services[@]}"; do
    echo "🧪 Testing $service (Node.js)..."
    
    if [ -d "backend/$service" ]; then
        cd "backend/$service"
        
        if [ -f "package.json" ]; then
            npm test
            
            if [ $? -eq 0 ]; then
                echo "✅ $service tests passed"
            else
                echo "❌ $service tests failed"
            fi
        else
            echo "⚠️  package.json not found for $service, skipping..."
        fi
        
        cd "../.."
    else
        echo "⚠️  Directory not found for $service, skipping..."
    fi
    
    echo ""
done

# Test .NET services
for service in "${dotnet_services[@]}"; do
    echo "🧪 Testing $service (.NET)..."
    
    if [ -d "backend/$service" ]; then
        cd "backend/$service"
        
        if [ -f "*.csproj" ] || [ -f "*.sln" ]; then
            dotnet test
            
            if [ $? -eq 0 ]; then
                echo "✅ $service tests passed"
            else
                echo "❌ $service tests failed"
            fi
        else
            echo "⚠️  .csproj file not found for $service, skipping..."
        fi
        
        cd "../.."
    else
        echo "⚠️  Directory not found for $service, skipping..."
    fi
    
    echo ""
done

# Test Go services
for service in "${go_services[@]}"; do
    echo "🧪 Testing $service (Go)..."
    
    if [ -d "backend/$service" ]; then
        cd "backend/$service"
        
        if [ -f "go.mod" ]; then
            go test ./...
            
            if [ $? -eq 0 ]; then
                echo "✅ $service tests passed"
            else
                echo "❌ $service tests failed"
            fi
        else
            echo "⚠️  go.mod not found for $service, skipping..."
        fi
        
        cd "../.."
    else
        echo "⚠️  Directory not found for $service, skipping..."
    fi
    
    echo ""
done

echo "✅ All tests completed!"
echo ""
echo "💡 Tips:"
echo "  - Use 'npm test' in individual Node.js service directories"
echo "  - Use 'dotnet test' in individual .NET service directories"
echo "  - Use 'go test ./...' in individual Go service directories"
echo "  - Add '--coverage' flag for coverage reports"

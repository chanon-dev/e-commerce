#!/bin/bash

echo "🔨 Building all E-commerce services..."

# Array of services to build
services=(
    "api-gateway"
    "auth-service"
    "user-service"
    "product-service"
    "order-service"
    "payment-service"
    "cart-service"
    "inventory-service"
    "shipping-service"
    "promotion-service"
    "review-service"
    "notification-service"
    "admin-service"
)

# Build each service
for service in "${services[@]}"; do
    echo "🔨 Building $service..."
    
    if [ -f "backend/$service/Dockerfile" ]; then
        docker build -t "ecommerce/$service:latest" "./backend/$service"
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully built $service"
        else
            echo "❌ Failed to build $service"
            exit 1
        fi
    else
        echo "⚠️  Dockerfile not found for $service, skipping..."
    fi
    
    echo ""
done

echo "✅ All services built successfully!"
echo ""
echo "💡 Tips:"
echo "  - Use 'docker images | grep ecommerce' to see all built images"
echo "  - Use './scripts/start-local.sh' to start all services"
echo "  - Use 'docker-compose -f docker-compose.services.yml up --build' to rebuild and start"

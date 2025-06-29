#!/bin/bash

if [ $# -eq 0 ]; then
    echo "❌ Please provide a service name"
    echo "Usage: ./scripts/restart-service.sh <service-name>"
    echo ""
    echo "Available services:"
    echo "  - api-gateway"
    echo "  - auth-service"
    echo "  - user-service"
    echo "  - product-service"
    echo "  - order-service"
    echo "  - payment-service"
    echo "  - cart-service"
    echo "  - inventory-service"
    echo "  - shipping-service"
    echo "  - promotion-service"
    echo "  - review-service"
    echo "  - notification-service"
    echo "  - admin-service"
    exit 1
fi

SERVICE_NAME=$1

echo "🔄 Restarting $SERVICE_NAME..."

# Check if service exists in services compose file
if docker-compose -f docker-compose.services.yml config --services | grep -q "^$SERVICE_NAME$"; then
    # Stop the service
    echo "🛑 Stopping $SERVICE_NAME..."
    docker-compose -f docker-compose.services.yml stop $SERVICE_NAME
    
    # Remove the container
    echo "🗑️  Removing $SERVICE_NAME container..."
    docker-compose -f docker-compose.services.yml rm -f $SERVICE_NAME
    
    # Start the service
    echo "🚀 Starting $SERVICE_NAME..."
    docker-compose -f docker-compose.services.yml up -d $SERVICE_NAME
    
    # Wait a moment and check status
    sleep 5
    echo "🔍 Checking $SERVICE_NAME status..."
    docker-compose -f docker-compose.services.yml ps $SERVICE_NAME
    
    echo "✅ $SERVICE_NAME restarted successfully!"
    
elif docker-compose -f docker-compose.infrastructure.yml config --services | grep -q "^$SERVICE_NAME$"; then
    # Stop the service
    echo "🛑 Stopping $SERVICE_NAME..."
    docker-compose -f docker-compose.infrastructure.yml stop $SERVICE_NAME
    
    # Remove the container
    echo "🗑️  Removing $SERVICE_NAME container..."
    docker-compose -f docker-compose.infrastructure.yml rm -f $SERVICE_NAME
    
    # Start the service
    echo "🚀 Starting $SERVICE_NAME..."
    docker-compose -f docker-compose.infrastructure.yml up -d $SERVICE_NAME
    
    # Wait a moment and check status
    sleep 5
    echo "🔍 Checking $SERVICE_NAME status..."
    docker-compose -f docker-compose.infrastructure.yml ps $SERVICE_NAME
    
    echo "✅ $SERVICE_NAME restarted successfully!"
    
else
    echo "❌ Service '$SERVICE_NAME' not found in docker-compose files"
    exit 1
fi

echo ""
echo "💡 Tips:"
echo "  - Use 'docker-compose logs -f $SERVICE_NAME' to view logs"
echo "  - Use 'docker-compose ps' to check all service statuses"

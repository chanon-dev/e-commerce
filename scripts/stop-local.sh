#!/bin/bash

echo "🛑 Stopping E-commerce Microservices Platform..."

# Stop application services
echo "🏢 Stopping application services..."
docker-compose -f docker-compose.services.yml down

# Stop infrastructure services
echo "📦 Stopping infrastructure services..."
docker-compose -f docker-compose.infrastructure.yml down

echo "✅ All services stopped!"
echo ""
echo "💡 Tips:"
echo "  - Use './scripts/start-local.sh' to start all services again"
echo "  - Use 'docker system prune' to clean up unused containers and images"
echo "  - Use 'docker volume prune' to clean up unused volumes (⚠️  This will delete data!)"

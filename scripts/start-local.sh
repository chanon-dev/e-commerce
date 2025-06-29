#!/bin/bash

echo "🚀 Starting E-commerce Microservices Platform..."

# Create network if it doesn't exist
docker network create ecommerce-network 2>/dev/null || true

# Start infrastructure services
echo "📦 Starting infrastructure services..."
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for infrastructure services to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 30

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
until docker exec ecommerce-postgresql pg_isready -U postgres; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Check if Redis is ready
echo "🔍 Checking Redis connection..."
until docker exec ecommerce-redis redis-cli ping; do
  echo "Waiting for Redis..."
  sleep 2
done

# Check if Kafka is ready
echo "🔍 Checking Kafka connection..."
until docker exec ecommerce-kafka kafka-topics --bootstrap-server localhost:9092 --list; do
  echo "Waiting for Kafka..."
  sleep 2
done

# Start application services
echo "🏢 Starting application services..."
docker-compose -f docker-compose.services.yml up -d

# Wait for application services to be ready
echo "⏳ Waiting for application services to be ready..."
sleep 60

echo "✅ All services are starting up!"
echo ""
echo "🌐 Service URLs:"
echo "  - API Gateway: http://localhost:8080"
echo "  - Auth Service: http://localhost:3001"
echo "  - User Service: http://localhost:3002"
echo "  - Product Service: http://localhost:3003"
echo "  - Order Service: http://localhost:3004"
echo "  - Payment Service: http://localhost:3005"
echo "  - Cart Service: http://localhost:3006"
echo "  - Inventory Service: http://localhost:3007"
echo "  - Shipping Service: http://localhost:3008"
echo "  - Promotion Service: http://localhost:3009"
echo "  - Review Service: http://localhost:3010"
echo "  - Notification Service: http://localhost:3011"
echo "  - Admin Service: http://localhost:3012"
echo ""
echo "🔧 Infrastructure URLs:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MongoDB: localhost:27017"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - Kafka: localhost:9092"
echo "  - Keycloak: http://localhost:8080"
echo "  - Vault: http://localhost:8200"
echo ""
echo "📊 Monitoring URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Jaeger: http://localhost:16686"
echo "  - Kibana: http://localhost:5601"
echo "  - Kafka UI: http://localhost:8081"
echo "  - Redis Commander: http://localhost:8082"
echo ""
echo "📚 API Documentation:"
echo "  - API Gateway: http://localhost:8080/api/docs"
echo "  - Auth Service: http://localhost:3001/api/docs"
echo "  - User Service: http://localhost:3002/swagger"
echo "  - Product Service: http://localhost:3003/swagger/index.html"
echo "  - Order Service: http://localhost:3004/swagger"
echo "  - Cart Service: http://localhost:3006/api/docs"
echo ""
echo "🔍 Health Checks:"
echo "  - API Gateway: http://localhost:8080/health"
echo "  - All Services: http://localhost:{port}/health"
echo ""
echo "💡 Tips:"
echo "  - Use 'docker-compose logs -f [service-name]' to view logs"
echo "  - Use 'docker-compose ps' to check service status"
echo "  - Use './scripts/stop-local.sh' to stop all services"
echo "  - Use './scripts/restart-service.sh [service-name]' to restart a specific service"

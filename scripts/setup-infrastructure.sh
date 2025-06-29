#!/bin/bash

# E-commerce Infrastructure Setup Script
set -e

echo "🚀 Setting up E-commerce Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_header "📁 Creating necessary directories..."
    
    mkdir -p infrastructure/{vault,keycloak,monitoring,scripts}
    mkdir -p infrastructure/vault/{vault-config,scripts}
    mkdir -p infrastructure/keycloak/{keycloak-config,themes}
    mkdir -p infrastructure/monitoring/{prometheus,grafana}
    mkdir -p infrastructure/monitoring/grafana/{provisioning,dashboards}
    mkdir -p logs
    mkdir -p data
    
    print_status "Directories created successfully"
}

# Create network
create_network() {
    print_header "🌐 Creating Docker network..."
    
    if ! docker network ls | grep -q ecommerce-network; then
        docker network create ecommerce-network --driver bridge --subnet=172.20.0.0/16
        print_status "Docker network 'ecommerce-network' created"
    else
        print_status "Docker network 'ecommerce-network' already exists"
    fi
}

# Start infrastructure services
start_infrastructure() {
    print_header "🏗️ Starting infrastructure services..."
    
    cd infrastructure
    
    # Start core infrastructure
    print_status "Starting core infrastructure services..."
    docker-compose -f docker-compose.infrastructure.yml up -d postgres redis mongo elasticsearch
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 30
    
    # Start messaging and search services
    print_status "Starting messaging and search services..."
    docker-compose -f docker-compose.infrastructure.yml up -d zookeeper kafka
    
    # Wait for Kafka to be ready
    sleep 20
    
    # Start monitoring services
    print_status "Starting monitoring services..."
    docker-compose -f docker-compose.infrastructure.yml up -d prometheus grafana jaeger
    
    # Start security services
    print_status "Starting security services..."
    docker-compose -f docker-compose.infrastructure.yml up -d vault keycloak-db
    
    # Wait for Vault to be ready
    sleep 15
    docker-compose -f docker-compose.infrastructure.yml up -d keycloak
    
    # Start additional services
    print_status "Starting additional services..."
    docker-compose -f docker-compose.infrastructure.yml up -d minio mailhog kafka-ui kibana
    
    cd ..
    
    print_status "All infrastructure services started"
}

# Initialize Vault
initialize_vault() {
    print_header "🔐 Initializing HashiCorp Vault..."
    
    # Wait for Vault to be ready
    print_status "Waiting for Vault to be ready..."
    until curl -s http://localhost:8200/v1/sys/health > /dev/null; do
        echo "Waiting for Vault..."
        sleep 5
    done
    
    # Run Vault initialization script
    if [ -f "infrastructure/vault/scripts/init-vault.sh" ]; then
        chmod +x infrastructure/vault/scripts/init-vault.sh
        ./infrastructure/vault/scripts/init-vault.sh
        print_status "Vault initialized successfully"
    else
        print_warning "Vault initialization script not found"
    fi
}

# Initialize Keycloak
initialize_keycloak() {
    print_header "🔑 Initializing Keycloak..."
    
    # Wait for Keycloak to be ready
    print_status "Waiting for Keycloak to be ready..."
    until curl -s http://localhost:8080/health/ready > /dev/null; do
        echo "Waiting for Keycloak..."
        sleep 5
    done
    
    # Run Keycloak initialization script
    if [ -f "infrastructure/keycloak/scripts/init-keycloak.sh" ]; then
        chmod +x infrastructure/keycloak/scripts/init-keycloak.sh
        ./infrastructure/keycloak/scripts/init-keycloak.sh
        print_status "Keycloak initialized successfully"
    else
        print_warning "Keycloak initialization script not found"
    fi
}

# Setup MinIO buckets
setup_minio() {
    print_header "📦 Setting up MinIO buckets..."
    
    # Wait for MinIO to be ready
    print_status "Waiting for MinIO to be ready..."
    until curl -s http://localhost:9000/minio/health/live > /dev/null; do
        echo "Waiting for MinIO..."
        sleep 5
    done
    
    # Install MinIO client if not present
    if ! command -v mc &> /dev/null; then
        print_status "Installing MinIO client..."
        curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
        chmod +x mc
        sudo mv mc /usr/local/bin/
    fi
    
    # Configure MinIO client
    mc alias set local http://localhost:9000 minioadmin minioadmin123
    
    # Create buckets
    mc mb local/ecommerce-products --ignore-existing
    mc mb local/ecommerce-images --ignore-existing
    mc mb local/ecommerce-documents --ignore-existing
    mc mb local/ecommerce-backups --ignore-existing
    
    # Set bucket policies
    mc anonymous set public local/ecommerce-products
    mc anonymous set public local/ecommerce-images
    
    print_status "MinIO buckets created and configured"
}

# Create Kafka topics
create_kafka_topics() {
    print_header "📨 Creating Kafka topics..."
    
    # Wait for Kafka to be ready
    print_status "Waiting for Kafka to be ready..."
    sleep 30
    
    # Create topics
    docker exec ecommerce-kafka kafka-topics --create --topic user-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic order-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic payment-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic inventory-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic shipping-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic notification-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    docker exec ecommerce-kafka kafka-topics --create --topic audit-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
    
    print_status "Kafka topics created"
}

# Setup Elasticsearch indices
setup_elasticsearch() {
    print_header "🔍 Setting up Elasticsearch indices..."
    
    # Wait for Elasticsearch to be ready
    print_status "Waiting for Elasticsearch to be ready..."
    until curl -s http://localhost:9200/_cluster/health > /dev/null; do
        echo "Waiting for Elasticsearch..."
        sleep 5
    done
    
    # Create indices
    curl -X PUT "localhost:9200/products" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "name": { "type": "text", "analyzer": "standard" },
          "description": { "type": "text", "analyzer": "standard" },
          "category": { "type": "keyword" },
          "brand": { "type": "keyword" },
          "price": { "type": "double" },
          "tags": { "type": "keyword" },
          "created_at": { "type": "date" }
        }
      }
    }'
    
    curl -X PUT "localhost:9200/orders" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "order_number": { "type": "keyword" },
          "customer_email": { "type": "keyword" },
          "status": { "type": "keyword" },
          "total_amount": { "type": "double" },
          "created_at": { "type": "date" }
        }
      }
    }'
    
    curl -X PUT "localhost:9200/logs" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "timestamp": { "type": "date" },
          "level": { "type": "keyword" },
          "service": { "type": "keyword" },
          "message": { "type": "text" },
          "user_id": { "type": "keyword" }
        }
      }
    }'
    
    print_status "Elasticsearch indices created"
}

# Display service URLs
display_urls() {
    print_header "🌐 Service URLs"
    
    echo ""
    echo "📊 Monitoring & Management:"
    echo "  - Grafana: http://localhost:3000 (admin/admin123)"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Jaeger: http://localhost:16686"
    echo "  - Kibana: http://localhost:5601"
    echo "  - Kafka UI: http://localhost:8081"
    echo ""
    echo "🔐 Security:"
    echo "  - Vault: http://localhost:8200 (token: myroot)"
    echo "  - Keycloak: http://localhost:8080 (admin/admin123)"
    echo ""
    echo "💾 Databases:"
    echo "  - PostgreSQL: localhost:5432 (postgres/postgres123)"
    echo "  - MongoDB: localhost:27017 (admin/admin123)"
    echo "  - Redis: localhost:6379"
    echo "  - Elasticsearch: http://localhost:9200"
    echo ""
    echo "📦 Storage & Messaging:"
    echo "  - MinIO: http://localhost:9001 (minioadmin/minioadmin123)"
    echo "  - Kafka: localhost:9092"
    echo "  - Mailhog: http://localhost:8025"
    echo ""
}

# Health check
health_check() {
    print_header "🏥 Running health checks..."
    
    services=(
        "postgres:5432"
        "redis:6379"
        "mongo:27017"
        "elasticsearch:9200"
        "kafka:9092"
        "vault:8200"
        "keycloak:8080"
        "prometheus:9090"
        "grafana:3000"
        "jaeger:16686"
        "minio:9000"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if nc -z localhost "$port" 2>/dev/null; then
            print_status "$name is running on port $port"
        else
            print_warning "$name is not responding on port $port"
        fi
    done
}

# Main execution
main() {
    print_header "🛒 E-commerce Infrastructure Setup"
    echo "This script will set up the complete infrastructure for the e-commerce platform."
    echo ""
    
    # Check prerequisites
    check_docker
    
    # Setup steps
    create_directories
    create_network
    start_infrastructure
    
    # Wait for services to be fully ready
    print_status "Waiting for all services to be ready..."
    sleep 60
    
    # Initialize services
    initialize_vault
    initialize_keycloak
    setup_minio
    create_kafka_topics
    setup_elasticsearch
    
    # Final checks
    health_check
    display_urls
    
    print_header "✅ Infrastructure setup completed successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Update Vault secrets with real API keys and credentials"
    echo "2. Configure Keycloak identity providers with OAuth credentials"
    echo "3. Start the microservices using docker-compose -f docker-compose.services.yml up -d"
    echo "4. Access the services using the URLs listed above"
    echo ""
    echo "📚 Documentation: Check the README.md files in each service directory"
    echo "🐛 Troubleshooting: Check logs with 'docker-compose logs <service-name>'"
}

# Run main function
main "$@"

#!/bin/bash

# Kafka Setup Script for E-commerce Platform
# This script sets up Kafka topics and configurations

set -e

echo "🚀 Starting Kafka setup for E-commerce Platform..."

# Configuration
KAFKA_CONTAINER="ecommerce-kafka-1"
KAFKA_BROKER="localhost:9092"
REPLICATION_FACTOR=3
DEFAULT_PARTITIONS=3

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
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Function to check if Kafka is running
check_kafka_health() {
    print_status "Checking Kafka cluster health..."
    
    # Wait for Kafka to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $KAFKA_CONTAINER kafka-broker-api-versions --bootstrap-server $KAFKA_BROKER > /dev/null 2>&1; then
            print_status "Kafka cluster is healthy and ready"
            return 0
        fi
        
        print_warning "Waiting for Kafka cluster... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    print_error "Kafka cluster is not responding after $max_attempts attempts"
    return 1
}

# Function to create a topic
create_topic() {
    local topic_name=$1
    local partitions=${2:-$DEFAULT_PARTITIONS}
    local replication=${3:-$REPLICATION_FACTOR}
    local retention=${4:-"604800000"} # 7 days default
    
    print_status "Creating topic: $topic_name (partitions: $partitions, replication: $replication)"
    
    # Check if topic already exists
    if docker exec $KAFKA_CONTAINER kafka-topics --bootstrap-server $KAFKA_BROKER --list | grep -q "^$topic_name$"; then
        print_warning "Topic $topic_name already exists, skipping creation"
        return 0
    fi
    
    # Create topic
    docker exec $KAFKA_CONTAINER kafka-topics \
        --bootstrap-server $KAFKA_BROKER \
        --create \
        --topic $topic_name \
        --partitions $partitions \
        --replication-factor $replication \
        --config retention.ms=$retention \
        --config cleanup.policy=delete \
        --config compression.type=gzip \
        --config max.message.bytes=2000000
    
    if [ $? -eq 0 ]; then
        print_status "Successfully created topic: $topic_name"
    else
        print_error "Failed to create topic: $topic_name"
        return 1
    fi
}

# Function to create all e-commerce topics
create_ecommerce_topics() {
    print_header "Creating E-commerce Platform Topics"
    
    # User Events (3 partitions, 7 days retention)
    create_topic "user-events" 3 3 "604800000"
    
    # Order Events (6 partitions, 30 days retention)
    create_topic "order-events" 6 3 "2592000000"
    
    # Payment Events (6 partitions, 90 days retention)
    create_topic "payment-events" 6 3 "7776000000"
    
    # Inventory Events (4 partitions, 14 days retention)
    create_topic "inventory-events" 4 3 "1209600000"
    
    # Product Events (3 partitions, 30 days retention)
    create_topic "product-events" 3 3 "2592000000"
    
    # Cart Events (4 partitions, 3 days retention)
    create_topic "cart-events" 4 3 "259200000"
    
    # Shipping Events (4 partitions, 30 days retention)
    create_topic "shipping-events" 4 3 "2592000000"
    
    # Review Events (3 partitions, 90 days retention)
    create_topic "review-events" 3 3 "7776000000"
    
    # Promotion Events (2 partitions, 30 days retention)
    create_topic "promotion-events" 2 3 "2592000000"
    
    # Notification Events (4 partitions, 7 days retention)
    create_topic "notification-events" 4 3 "604800000"
    
    # Analytics Events (8 partitions, 30 days retention)
    create_topic "analytics-events" 8 3 "2592000000"
    
    # Audit Events (4 partitions, 365 days retention)
    create_topic "audit-events" 4 3 "31536000000"
    
    # Dead Letter Queue (2 partitions, 30 days retention)
    create_topic "dead-letter-queue" 2 3 "2592000000"
    
    # System Events (2 partitions, 7 days retention)
    create_topic "system-events" 2 3 "604800000"
}

# Function to create Kafka Connect topics
create_connect_topics() {
    print_header "Creating Kafka Connect Topics"
    
    create_topic "docker-connect-configs" 1 3 "604800000"
    create_topic "docker-connect-offsets" 25 3 "604800000"
    create_topic "docker-connect-status" 5 3 "604800000"
}

# Function to list all topics
list_topics() {
    print_header "Listing All Topics"
    
    docker exec $KAFKA_CONTAINER kafka-topics \
        --bootstrap-server $KAFKA_BROKER \
        --list
}

# Function to describe topics
describe_topics() {
    print_header "Describing E-commerce Topics"
    
    local topics=(
        "user-events"
        "order-events"
        "payment-events"
        "inventory-events"
        "product-events"
        "cart-events"
        "shipping-events"
        "review-events"
        "promotion-events"
        "notification-events"
        "analytics-events"
        "audit-events"
    )
    
    for topic in "${topics[@]}"; do
        print_status "Describing topic: $topic"
        docker exec $KAFKA_CONTAINER kafka-topics \
            --bootstrap-server $KAFKA_BROKER \
            --describe \
            --topic $topic
        echo ""
    done
}

# Function to create consumer groups
create_consumer_groups() {
    print_header "Creating Consumer Groups"
    
    local groups=(
        "user-events-consumer"
        "order-events-consumer"
        "payment-events-consumer"
        "inventory-events-consumer"
        "product-events-consumer"
        "cart-events-consumer"
        "shipping-events-consumer"
        "review-events-consumer"
        "promotion-events-consumer"
        "notification-events-consumer"
        "analytics-events-consumer"
        "audit-events-consumer"
    )
    
    for group in "${groups[@]}"; do
        print_status "Consumer group $group will be created automatically when consumers connect"
    done
}

# Function to test Kafka setup
test_kafka_setup() {
    print_header "Testing Kafka Setup"
    
    local test_topic="test-topic"
    local test_message="Hello from E-commerce Platform!"
    
    # Create test topic
    print_status "Creating test topic..."
    create_topic $test_topic 1 1 "60000" # 1 minute retention
    
    # Produce test message
    print_status "Producing test message..."
    echo $test_message | docker exec -i $KAFKA_CONTAINER kafka-console-producer \
        --bootstrap-server $KAFKA_BROKER \
        --topic $test_topic
    
    # Consume test message
    print_status "Consuming test message..."
    timeout 10s docker exec $KAFKA_CONTAINER kafka-console-consumer \
        --bootstrap-server $KAFKA_BROKER \
        --topic $test_topic \
        --from-beginning \
        --max-messages 1
    
    # Clean up test topic
    print_status "Cleaning up test topic..."
    docker exec $KAFKA_CONTAINER kafka-topics \
        --bootstrap-server $KAFKA_BROKER \
        --delete \
        --topic $test_topic
    
    print_status "Kafka setup test completed successfully!"
}

# Function to show cluster info
show_cluster_info() {
    print_header "Kafka Cluster Information"
    
    print_status "Broker information:"
    docker exec $KAFKA_CONTAINER kafka-broker-api-versions \
        --bootstrap-server $KAFKA_BROKER
    
    print_status "Cluster metadata:"
    docker exec $KAFKA_CONTAINER kafka-metadata-shell \
        --snapshot /var/lib/kafka/data/__cluster_metadata-0/00000000000000000000.log \
        --print
}

# Function to setup monitoring
setup_monitoring() {
    print_header "Setting up Kafka Monitoring"
    
    # Create monitoring topics
    create_topic "__consumer_offsets" 50 3 "604800000"
    create_topic "__transaction_state" 50 3 "604800000"
    
    print_status "Monitoring topics created"
    print_status "Kafka Exporter is available at http://localhost:9308/metrics"
    print_status "Kafka UI is available at http://localhost:8080"
}

# Main execution
main() {
    print_header "E-commerce Platform Kafka Setup"
    
    # Check if Kafka is running
    if ! check_kafka_health; then
        print_error "Kafka cluster is not healthy. Please start Kafka first:"
        print_error "docker-compose -f docker-compose.kafka.yml up -d"
        exit 1
    fi
    
    # Create all topics
    create_ecommerce_topics
    create_connect_topics
    
    # Setup monitoring
    setup_monitoring
    
    # Create consumer groups info
    create_consumer_groups
    
    # List all topics
    list_topics
    
    # Test setup
    if [ "${1:-}" = "--test" ]; then
        test_kafka_setup
    fi
    
    # Show cluster info
    if [ "${1:-}" = "--info" ]; then
        show_cluster_info
        describe_topics
    fi
    
    print_status "✅ Kafka setup completed successfully!"
    print_status "📊 Kafka UI: http://localhost:8080"
    print_status "📈 Kafka Exporter: http://localhost:9308/metrics"
    print_status "🔗 Schema Registry: http://localhost:8081"
    print_status "🔌 Kafka Connect: http://localhost:8083"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --test    Run setup test after creating topics"
    echo "  --info    Show detailed cluster information"
    echo "  --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Basic setup"
    echo "  $0 --test         # Setup with test"
    echo "  $0 --info         # Setup with detailed info"
}

# Handle command line arguments
case "${1:-}" in
    --help)
        usage
        exit 0
        ;;
    --test|--info)
        main "$1"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        usage
        exit 1
        ;;
esac

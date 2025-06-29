#!/bin/bash

# Independent Service Deployment Script
set -e

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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Available services
AVAILABLE_SERVICES=(
    "api-gateway"
    "auth-service"
    "user-service"
    "product-service"
    "cart-service"
    "order-service"
    "payment-service"
    "inventory-service"
    "shipping-service"
    "promotion-service"
    "review-service"
    "notification-service"
    "admin-service"
)

# Function to show usage
show_usage() {
    echo "Usage: $0 <service-name> [options]"
    echo ""
    echo "Available services:"
    for service in "${AVAILABLE_SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    echo "Options:"
    echo "  --build         Force rebuild the service image"
    echo "  --no-deps       Don't start dependency services"
    echo "  --scale N       Scale service to N instances"
    echo "  --env ENV       Use specific environment (dev, staging, prod)"
    echo "  --health-check  Wait for service health check to pass"
    echo "  --logs          Show logs after deployment"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 user-service --build --health-check"
    echo "  $0 product-service --scale 3 --env staging"
    echo "  $0 order-service --no-deps --logs"
}

# Function to validate service name
validate_service() {
    local service=$1
    for available_service in "${AVAILABLE_SERVICES[@]}"; do
        if [[ "$available_service" == "$service" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to check if infrastructure is running
check_infrastructure() {
    print_status "Checking infrastructure services..."
    
    local required_services=("postgres" "redis" "kafka" "vault" "keycloak")
    local missing_services=()
    
    for service in "${required_services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "ecommerce-$service"; then
            missing_services+=("$service")
        fi
    done
    
    if [[ ${#missing_services[@]} -gt 0 ]]; then
        print_error "Missing infrastructure services: ${missing_services[*]}"
        print_status "Please start infrastructure first:"
        print_status "  ./scripts/setup-infrastructure.sh"
        return 1
    fi
    
    print_status "Infrastructure services are running"
    return 0
}

# Function to get service dependencies
get_service_dependencies() {
    local service=$1
    case $service in
        "api-gateway")
            echo "redis kafka vault keycloak"
            ;;
        "auth-service")
            echo "postgres redis kafka vault keycloak"
            ;;
        "user-service")
            echo "postgres kafka vault"
            ;;
        "product-service")
            echo "postgres elasticsearch kafka vault minio"
            ;;
        "cart-service")
            echo "redis kafka vault"
            ;;
        "order-service")
            echo "postgres mongo kafka vault"
            ;;
        "payment-service")
            echo "postgres kafka vault"
            ;;
        "inventory-service")
            echo "postgres kafka vault"
            ;;
        "shipping-service")
            echo "postgres kafka vault"
            ;;
        "promotion-service")
            echo "postgres redis kafka vault"
            ;;
        "review-service")
            echo "mongo kafka vault"
            ;;
        "notification-service")
            echo "postgres kafka vault mailhog"
            ;;
        "admin-service")
            echo "postgres kafka vault keycloak"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Function to wait for service health
wait_for_health() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service health check..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            print_status "$service is healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service health check failed after $max_attempts attempts"
    return 1
}

# Function to get service port
get_service_port() {
    local service=$1
    case $service in
        "api-gateway") echo "3000" ;;
        "auth-service") echo "3001" ;;
        "user-service") echo "3002" ;;
        "product-service") echo "3003" ;;
        "order-service") echo "3004" ;;
        "payment-service") echo "3005" ;;
        "cart-service") echo "3006" ;;
        "inventory-service") echo "3007" ;;
        "shipping-service") echo "3008" ;;
        "promotion-service") echo "3009" ;;
        "review-service") echo "3010" ;;
        "notification-service") echo "3011" ;;
        "admin-service") echo "3012" ;;
        *) echo "8080" ;;
    esac
}

# Function to deploy service
deploy_service() {
    local service=$1
    local build_flag=$2
    local no_deps=$3
    local scale=$4
    local env=$5
    local health_check=$6
    local show_logs=$7
    
    print_header "🚀 Deploying $service"
    
    # Check if service exists
    if ! validate_service "$service"; then
        print_error "Invalid service name: $service"
        show_usage
        exit 1
    fi
    
    # Check infrastructure (unless no-deps is specified)
    if [[ "$no_deps" != "true" ]]; then
        if ! check_infrastructure; then
            exit 1
        fi
    fi
    
    # Build docker-compose command
    local compose_cmd="docker-compose -f docker-compose.services.yml"
    
    # Add environment file if specified
    if [[ -n "$env" ]]; then
        if [[ -f ".env.$env" ]]; then
            compose_cmd="$compose_cmd --env-file .env.$env"
        else
            print_warning "Environment file .env.$env not found, using default"
        fi
    fi
    
    # Stop existing service
    print_status "Stopping existing $service..."
    $compose_cmd stop "$service" 2>/dev/null || true
    $compose_cmd rm -f "$service" 2>/dev/null || true
    
    # Build if requested
    if [[ "$build_flag" == "true" ]]; then
        print_status "Building $service..."
        $compose_cmd build "$service"
    fi
    
    # Start service
    print_status "Starting $service..."
    if [[ -n "$scale" ]]; then
        $compose_cmd up -d --scale "$service=$scale" "$service"
    else
        $compose_cmd up -d "$service"
    fi
    
    # Wait for health check
    if [[ "$health_check" == "true" ]]; then
        local port=$(get_service_port "$service")
        wait_for_health "$service" "$port"
    fi
    
    # Show logs
    if [[ "$show_logs" == "true" ]]; then
        print_status "Showing logs for $service..."
        $compose_cmd logs -f "$service"
    fi
    
    print_status "✅ $service deployed successfully"
    
    # Show service info
    local port=$(get_service_port "$service")
    print_status "Service URL: http://localhost:$port"
    print_status "Health Check: http://localhost:$port/health"
    print_status "Logs: docker-compose -f docker-compose.services.yml logs -f $service"
}

# Parse command line arguments
SERVICE_NAME=""
BUILD_FLAG="false"
NO_DEPS="false"
SCALE=""
ENV=""
HEALTH_CHECK="false"
SHOW_LOGS="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_FLAG="true"
            shift
            ;;
        --no-deps)
            NO_DEPS="true"
            shift
            ;;
        --scale)
            SCALE="$2"
            shift 2
            ;;
        --env)
            ENV="$2"
            shift 2
            ;;
        --health-check)
            HEALTH_CHECK="true"
            shift
            ;;
        --logs)
            SHOW_LOGS="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$SERVICE_NAME" ]]; then
                SERVICE_NAME="$1"
            else
                print_error "Multiple service names provided"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if service name is provided
if [[ -z "$SERVICE_NAME" ]]; then
    print_error "Service name is required"
    show_usage
    exit 1
fi

# Deploy the service
deploy_service "$SERVICE_NAME" "$BUILD_FLAG" "$NO_DEPS" "$SCALE" "$ENV" "$HEALTH_CHECK" "$SHOW_LOGS"

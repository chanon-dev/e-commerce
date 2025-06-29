#!/bin/bash

# E-Commerce Kubernetes Deployment Script
# สคริปต์สำหรับ deploy frontend และ backend services ไปยัง Kubernetes

set -e

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
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl ไม่พบในระบบ กรุณาติดตั้ง kubectl ก่อน"
        exit 1
    fi
    print_status "kubectl พร้อมใช้งาน"
}

# Check cluster connection
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "ไม่สามารถเชื่อมต่อกับ Kubernetes cluster ได้"
        exit 1
    fi
    print_status "เชื่อมต่อกับ Kubernetes cluster สำเร็จ"
}

# Create namespace
create_namespace() {
    print_header "สร้าง Namespace"
    kubectl apply -f k8s/namespace.yaml
    print_status "Namespace 'ecommerce' ถูกสร้างแล้ว"
}

# Deploy secrets and configmaps
deploy_configs() {
    print_header "Deploy Secrets และ ConfigMaps"
    
    # Deploy secrets
    kubectl apply -f k8s/secrets/
    print_status "Secrets ถูก deploy แล้ว"
    
    # Deploy configmaps
    kubectl apply -f k8s/configmaps/
    print_status "ConfigMaps ถูก deploy แล้ว"
}

# Deploy frontend services
deploy_frontend() {
    print_header "Deploy Frontend Services"
    
    print_status "กำลัง deploy Customer Platform..."
    kubectl apply -f k8s/deployments/frontend/customer-platform-deployment.yaml
    
    print_status "กำลัง deploy Admin Dashboard..."
    kubectl apply -f k8s/deployments/frontend/admin-dashboard-deployment.yaml
    
    print_status "Frontend services ถูก deploy แล้ว"
}

# Deploy backend services
deploy_backend() {
    print_header "Deploy Backend Services"
    
    print_status "กำลัง deploy API Gateway..."
    kubectl apply -f k8s/deployments/backend/api-gateway-deployment.yaml
    
    print_status "กำลัง deploy Auth Service..."
    kubectl apply -f k8s/deployments/backend/auth-service-deployment.yaml
    
    print_status "กำลัง deploy User Service..."
    kubectl apply -f k8s/deployments/backend/user-service-deployment.yaml
    
    print_status "กำลัง deploy Product Service..."
    kubectl apply -f k8s/deployments/backend/product-service-deployment.yaml
    
    print_status "กำลัง deploy Order Service..."
    kubectl apply -f k8s/deployments/backend/order-service-deployment.yaml
    
    print_status "กำลัง deploy Payment Service..."
    kubectl apply -f k8s/deployments/backend/payment-service-deployment.yaml
    
    print_status "กำลัง deploy Cart Service..."
    kubectl apply -f k8s/deployments/backend/cart-service-deployment.yaml
    
    print_status "Backend services ถูก deploy แล้ว"
}

# Deploy additional services
deploy_additional_services() {
    print_header "Deploy Additional Services"
    
    print_status "กำลัง deploy Inventory, Shipping, Promotion, Review, Notification และ Admin Services..."
    kubectl apply -f k8s/deployments/services/all-services-deployment.yaml
    
    print_status "Additional services ถูก deploy แล้ว"
}

# Wait for deployments to be ready
wait_for_deployments() {
    print_header "รอให้ Deployments พร้อมใช้งาน"
    
    # Frontend deployments
    kubectl wait --for=condition=available --timeout=300s deployment/customer-platform -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/admin-dashboard -n ecommerce
    
    # Backend deployments
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/user-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/product-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/order-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/payment-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/cart-service -n ecommerce
    
    # Additional services
    kubectl wait --for=condition=available --timeout=300s deployment/inventory-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/shipping-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/promotion-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/review-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/notification-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/admin-service -n ecommerce
    
    print_status "ทุก Deployments พร้อมใช้งานแล้ว"
}

# Show deployment status
show_status() {
    print_header "สถานะการ Deploy"
    
    echo -e "\n${BLUE}Pods:${NC}"
    kubectl get pods -n ecommerce
    
    echo -e "\n${BLUE}Services:${NC}"
    kubectl get services -n ecommerce
    
    echo -e "\n${BLUE}Ingresses:${NC}"
    kubectl get ingress -n ecommerce
}

# Main deployment function
deploy_all() {
    print_header "เริ่มต้น Deploy E-Commerce Platform"
    
    check_kubectl
    check_cluster
    create_namespace
    deploy_configs
    deploy_frontend
    deploy_backend
    deploy_additional_services
    wait_for_deployments
    show_status
    
    print_header "Deploy สำเร็จ!"
    echo -e "${GREEN}🎉 E-Commerce Platform ถูก deploy ไปยัง Kubernetes แล้ว!${NC}"
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Customer Platform: http://shop.ecommerce.local"
    echo -e "  Admin Dashboard: http://admin.ecommerce.local"
    echo -e "  API Gateway: http://api.ecommerce.local"
}

# Function to deploy only frontend
deploy_frontend_only() {
    print_header "Deploy Frontend Services เท่านั้น"
    
    check_kubectl
    check_cluster
    create_namespace
    deploy_configs
    deploy_frontend
    
    kubectl wait --for=condition=available --timeout=300s deployment/customer-platform -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/admin-dashboard -n ecommerce
    
    print_status "Frontend services deploy สำเร็จ"
}

# Function to deploy only backend
deploy_backend_only() {
    print_header "Deploy Backend Services เท่านั้น"
    
    check_kubectl
    check_cluster
    create_namespace
    deploy_configs
    deploy_backend
    deploy_additional_services
    
    # Wait for main backend services
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/user-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/product-service -n ecommerce
    
    print_status "Backend services deploy สำเร็จ"
}

# Function to clean up deployments
cleanup() {
    print_header "ลบ Deployments ทั้งหมด"
    
    kubectl delete namespace ecommerce --ignore-not-found=true
    
    print_status "ลบ deployments สำเร็จ"
}

# Show help
show_help() {
    echo "E-Commerce Kubernetes Deployment Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  all        Deploy ทั้งหมด (frontend + backend)"
    echo "  frontend   Deploy frontend services เท่านั้น"
    echo "  backend    Deploy backend services เท่านั้น"
    echo "  status     แสดงสถานะการ deploy"
    echo "  cleanup    ลบ deployments ทั้งหมด"
    echo "  help       แสดงข้อความช่วยเหลือ"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 frontend"
    echo "  $0 backend"
    echo "  $0 status"
}

# Main script logic
case "$1" in
    "all")
        deploy_all
        ;;
    "frontend")
        deploy_frontend_only
        ;;
    "backend")
        deploy_backend_only
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

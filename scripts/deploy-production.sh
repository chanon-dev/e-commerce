#!/bin/bash

set -e

echo "🚀 Starting E-commerce Production Deployment..."

# Configuration
NAMESPACE="ecommerce-prod"
MONITORING_NAMESPACE="ecommerce-monitoring"
SECURITY_NAMESPACE="ecommerce-security"
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG="${1:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    # Check if argocd CLI is installed
    if ! command -v argocd &> /dev/null; then
        log_warning "argocd CLI is not installed, some features may not work"
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_namespaces() {
    log_info "Creating namespaces..."
    
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace ${MONITORING_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace ${SECURITY_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespaces
    kubectl label namespace ${NAMESPACE} name=${NAMESPACE} --overwrite
    kubectl label namespace ${MONITORING_NAMESPACE} name=${MONITORING_NAMESPACE} --overwrite
    kubectl label namespace ${SECURITY_NAMESPACE} name=${SECURITY_NAMESPACE} --overwrite
    
    log_success "Namespaces created"
}

deploy_security() {
    log_info "Deploying security components..."
    
    # Deploy cert-manager
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.0 \
        --set installCRDs=true
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s
    
    # Deploy security policies
    kubectl apply -f k8s/security/
    
    # Deploy Falco
    helm repo add falcosecurity https://falcosecurity.github.io/charts
    helm repo update
    helm upgrade --install falco falcosecurity/falco \
        --namespace ${SECURITY_NAMESPACE} \
        --set falco.grpc.enabled=true \
        --set falco.grpcOutput.enabled=true
    
    log_success "Security components deployed"
}

deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Deploy Prometheus Operator
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
        --namespace ${MONITORING_NAMESPACE} \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.persistence.enabled=true \
        --set grafana.persistence.size=10Gi \
        --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi
    
    # Deploy Jaeger
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace ${MONITORING_NAMESPACE} \
        --set provisionDataStore.cassandra=false \
        --set provisionDataStore.elasticsearch=true \
        --set storage.type=elasticsearch
    
    # Deploy ELK Stack
    helm repo add elastic https://helm.elastic.co
    helm repo update
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace ${MONITORING_NAMESPACE} \
        --set replicas=3 \
        --set volumeClaimTemplate.resources.requests.storage=30Gi
    
    helm upgrade --install kibana elastic/kibana \
        --namespace ${MONITORING_NAMESPACE}
    
    log_success "Monitoring stack deployed"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure components..."
    
    # Deploy Redis Cluster
    kubectl apply -f k8s/base/redis/
    
    # Deploy PostgreSQL
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    helm upgrade --install postgresql bitnami/postgresql \
        --namespace ${NAMESPACE} \
        --set auth.postgresPassword=secure-password \
        --set primary.persistence.size=100Gi \
        --set readReplicas.replicaCount=2
    
    # Deploy MongoDB
    helm upgrade --install mongodb bitnami/mongodb \
        --namespace ${NAMESPACE} \
        --set auth.rootPassword=secure-password \
        --set persistence.size=50Gi \
        --set replicaSet.enabled=true \
        --set replicaSet.replicas.secondary=2
    
    # Deploy Kafka
    helm upgrade --install kafka bitnami/kafka \
        --namespace ${NAMESPACE} \
        --set replicaCount=3 \
        --set persistence.size=20Gi \
        --set zookeeper.replicaCount=3
    
    log_success "Infrastructure components deployed"
}

deploy_applications() {
    log_info "Deploying application services..."
    
    # Update image tags in kustomization files
    find k8s/overlays/prod -name "kustomization.yaml" -exec sed -i "s|newTag: .*|newTag: ${IMAGE_TAG}|g" {} \;
    
    # Deploy using Kustomize
    kubectl apply -k k8s/overlays/prod
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available deployment --all -n ${NAMESPACE} --timeout=600s
    
    log_success "Application services deployed"
}

deploy_ingress() {
    log_info "Deploying ingress controller..."
    
    # Deploy NGINX Ingress Controller
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.replicaCount=3 \
        --set controller.nodeSelector."kubernetes\.io/os"=linux \
        --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
        --set controller.admissionWebhooks.patch.nodeSelector."kubernetes\.io/os"=linux
    
    # Deploy ingress resources
    kubectl apply -f k8s/base/ingress/
    
    log_success "Ingress controller deployed"
}

setup_argocd() {
    log_info "Setting up ArgoCD..."
    
    # Deploy ArgoCD
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    # Wait for ArgoCD to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
    
    # Deploy ArgoCD applications
    kubectl apply -f infrastructure/argocd/applications/
    
    # Get ArgoCD admin password
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
    log_info "ArgoCD admin password: ${ARGOCD_PASSWORD}"
    
    log_success "ArgoCD setup completed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check all pods are running
    FAILED_PODS=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers | wc -l)
    if [ ${FAILED_PODS} -gt 0 ]; then
        log_warning "${FAILED_PODS} pods are not running"
        kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running
    fi
    
    # Check services
    log_info "Checking service endpoints..."
    kubectl get endpoints -n ${NAMESPACE}
    
    # Check ingress
    log_info "Checking ingress status..."
    kubectl get ingress -n ${NAMESPACE}
    
    # Run smoke tests
    if [ -d "tests/smoke" ]; then
        log_info "Running smoke tests..."
        cd tests/smoke
        npm install
        ENVIRONMENT=production npm test
        cd ../..
    fi
    
    log_success "Health checks completed"
}

setup_monitoring_alerts() {
    log_info "Setting up monitoring alerts..."
    
    # Apply Prometheus rules
    kubectl apply -f k8s/monitoring/prometheus-rules.yaml
    
    # Apply Grafana dashboards
    kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
    
    log_success "Monitoring alerts configured"
}

cleanup_old_resources() {
    log_info "Cleaning up old resources..."
    
    # Remove old ReplicaSets
    kubectl delete replicaset --all -n ${NAMESPACE} --cascade=orphan
    
    # Remove completed jobs older than 7 days
    kubectl delete job --field-selector=status.successful=1 -n ${NAMESPACE} --ignore-not-found=true
    
    log_success "Cleanup completed"
}

print_access_info() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Access Information:"
    echo "====================="
    
    # Get LoadBalancer IP
    EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -z "$EXTERNAL_IP" ]; then
        EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    echo "🌐 External IP/Hostname: ${EXTERNAL_IP}"
    echo ""
    echo "🔗 Application URLs:"
    echo "  - Customer Platform: https://ecommerce.com"
    echo "  - Admin Dashboard: https://admin.ecommerce.com"
    echo "  - API Gateway: https://api.ecommerce.com"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "  - Grafana: https://grafana.ecommerce.com"
    echo "  - Prometheus: https://prometheus.ecommerce.com"
    echo "  - Jaeger: https://jaeger.ecommerce.com"
    echo "  - Kibana: https://kibana.ecommerce.com"
    echo ""
    echo "🔧 Management URLs:"
    echo "  - ArgoCD: https://argocd.ecommerce.com"
    echo "  - ArgoCD Password: ${ARGOCD_PASSWORD}"
    echo ""
    echo "💡 Next Steps:"
    echo "  1. Update DNS records to point to ${EXTERNAL_IP}"
    echo "  2. Configure monitoring alerts"
    echo "  3. Set up backup procedures"
    echo "  4. Review security policies"
    echo "  5. Configure CI/CD pipelines"
}

# Main execution
main() {
    log_info "Starting production deployment with image tag: ${IMAGE_TAG}"
    
    check_prerequisites
    create_namespaces
    deploy_security
    deploy_monitoring
    deploy_infrastructure
    deploy_applications
    deploy_ingress
    setup_argocd
    setup_monitoring_alerts
    run_health_checks
    cleanup_old_resources
    print_access_info
    
    log_success "🚀 Production deployment completed successfully!"
}

# Run main function
main "$@"

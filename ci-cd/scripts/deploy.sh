#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE_JENKINS="jenkins"
NAMESPACE_ARGOCD="argocd"
NAMESPACE_ECOMMERCE="ecommerce"
DOCKER_REGISTRY="your-registry.com"
GITHUB_REPO="https://github.com/your-org/ecommerce.git"

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
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    # Check if argocd CLI is installed
    if ! command -v argocd &> /dev/null; then
        log_warning "argocd CLI is not installed. Installing..."
        install_argocd_cli
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

install_argocd_cli() {
    log_info "Installing ArgoCD CLI..."
    
    # Detect OS
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case $ARCH in
        x86_64) ARCH="amd64" ;;
        arm64) ARCH="arm64" ;;
        *) log_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    # Download and install ArgoCD CLI
    curl -sSL -o argocd-linux-${ARCH} https://github.com/argoproj/argo-cd/releases/latest/download/argocd-${OS}-${ARCH}
    sudo install -m 555 argocd-linux-${ARCH} /usr/local/bin/argocd
    rm argocd-linux-${ARCH}
    
    log_success "ArgoCD CLI installed successfully"
}

create_secrets() {
    log_info "Creating secrets..."
    
    # Create Jenkins secrets
    kubectl create namespace $NAMESPACE_JENKINS --dry-run=client -o yaml | kubectl apply -f -
    
    # Create Jenkins secrets if they don't exist
    if ! kubectl get secret jenkins-secrets -n $NAMESPACE_JENKINS &> /dev/null; then
        kubectl create secret generic jenkins-secrets -n $NAMESPACE_JENKINS \
            --from-literal=docker-registry-user="${DOCKER_REGISTRY_USER:-admin}" \
            --from-literal=docker-registry-pass="${DOCKER_REGISTRY_PASS:-password}" \
            --from-literal=vault-token="${VAULT_TOKEN:-dev-token}" \
            --from-literal=argocd-token="${ARGOCD_TOKEN:-}" \
            --from-literal=slack-token="${SLACK_TOKEN:-}" \
            --from-file=kubeconfig="${HOME}/.kube/config"
    fi
    
    # Create ArgoCD secrets
    kubectl create namespace $NAMESPACE_ARGOCD --dry-run=client -o yaml | kubectl apply -f -
    
    # Create repository secret for ArgoCD
    if ! kubectl get secret repo-secret -n $NAMESPACE_ARGOCD &> /dev/null; then
        kubectl create secret generic repo-secret -n $NAMESPACE_ARGOCD \
            --from-literal=username="${GITHUB_USERNAME:-}" \
            --from-literal=password="${GITHUB_TOKEN:-}"
    fi
    
    # Create OIDC secret for ArgoCD
    if ! kubectl get secret argocd-secret -n $NAMESPACE_ARGOCD &> /dev/null; then
        kubectl create secret generic argocd-secret -n $NAMESPACE_ARGOCD \
            --from-literal=oidc.keycloak.clientSecret="${KEYCLOAK_CLIENT_SECRET:-argocd-secret}"
    fi
    
    log_success "Secrets created successfully"
}

deploy_jenkins() {
    log_info "Deploying Jenkins..."
    
    # Apply Jenkins deployment
    kubectl apply -f ci-cd/jenkins/jenkins-deployment.yaml
    
    # Wait for Jenkins to be ready
    log_info "Waiting for Jenkins to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/jenkins -n $NAMESPACE_JENKINS
    
    # Get Jenkins admin password
    log_info "Getting Jenkins admin password..."
    sleep 30  # Wait for Jenkins to initialize
    JENKINS_PASSWORD=$(kubectl exec -n $NAMESPACE_JENKINS deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "admin123")
    
    log_success "Jenkins deployed successfully"
    log_info "Jenkins URL: https://jenkins.ecommerce.local"
    log_info "Jenkins Admin Password: $JENKINS_PASSWORD"
}

deploy_argocd() {
    log_info "Deploying ArgoCD..."
    
    # Create required ConfigMaps
    kubectl create configmap argocd-ssh-known-hosts-cm -n $NAMESPACE_ARGOCD --dry-run=client -o yaml | kubectl apply -f -
    kubectl create configmap argocd-tls-certs-cm -n $NAMESPACE_ARGOCD --dry-run=client -o yaml | kubectl apply -f -
    kubectl create configmap argocd-gpg-keys-cm -n $NAMESPACE_ARGOCD --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply ArgoCD deployment
    kubectl apply -f ci-cd/argocd/argocd-deployment.yaml
    
    # Wait for ArgoCD to be ready
    log_info "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n $NAMESPACE_ARGOCD
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n $NAMESPACE_ARGOCD
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-application-controller -n $NAMESPACE_ARGOCD
    
    # Get ArgoCD admin password
    log_info "Getting ArgoCD admin password..."
    sleep 30  # Wait for ArgoCD to initialize
    ARGOCD_PASSWORD=$(kubectl -n $NAMESPACE_ARGOCD get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "admin123")
    
    log_success "ArgoCD deployed successfully"
    log_info "ArgoCD URL: https://argocd.ecommerce.local"
    log_info "ArgoCD Admin Password: $ARGOCD_PASSWORD"
}

deploy_applications() {
    log_info "Deploying ArgoCD applications..."
    
    # Apply ArgoCD applications
    kubectl apply -f ci-cd/argocd/applications/ecommerce-apps.yaml
    
    # Wait for applications to be created
    sleep 10
    
    # Login to ArgoCD (if credentials are available)
    if [[ -n "${ARGOCD_PASSWORD:-}" ]]; then
        argocd login argocd.ecommerce.local --username admin --password "$ARGOCD_PASSWORD" --insecure
        
        # Sync all applications
        log_info "Syncing all applications..."
        argocd app sync -l app.kubernetes.io/part-of=ecommerce --async
    fi
    
    log_success "ArgoCD applications deployed successfully"
}

setup_monitoring() {
    log_info "Setting up monitoring for CI/CD..."
    
    # Create ServiceMonitor for Jenkins
    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: jenkins
  namespace: $NAMESPACE_JENKINS
spec:
  selector:
    matchLabels:
      app: jenkins
  endpoints:
  - port: http
    path: /prometheus
EOF

    # Create ServiceMonitor for ArgoCD
    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: $NAMESPACE_ARGOCD
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-server
  endpoints:
  - port: metrics
EOF

    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-repo-server-metrics
  namespace: $NAMESPACE_ARGOCD
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-repo-server
  endpoints:
  - port: metrics
EOF

    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-application-controller-metrics
  namespace: $NAMESPACE_ARGOCD
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-application-controller
  endpoints:
  - port: metrics
EOF

    log_success "Monitoring setup completed"
}

create_ingress_dns() {
    log_info "Setting up DNS entries for ingress..."
    
    # Get ingress controller external IP
    EXTERNAL_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "127.0.0.1")
    
    log_info "Add the following entries to your /etc/hosts file or DNS server:"
    echo "$EXTERNAL_IP jenkins.ecommerce.local"
    echo "$EXTERNAL_IP argocd.ecommerce.local"
    echo "$EXTERNAL_IP api.ecommerce.local"
    echo "$EXTERNAL_IP customer.ecommerce.local"
    echo "$EXTERNAL_IP admin.ecommerce.local"
    echo "$EXTERNAL_IP vault.ecommerce.local"
    echo "$EXTERNAL_IP keycloak.ecommerce.local"
    echo "$EXTERNAL_IP grafana.ecommerce.local"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

show_status() {
    log_info "Deployment Status:"
    echo ""
    
    # Jenkins status
    echo "Jenkins:"
    kubectl get pods -n $NAMESPACE_JENKINS -l app=jenkins
    echo ""
    
    # ArgoCD status
    echo "ArgoCD:"
    kubectl get pods -n $NAMESPACE_ARGOCD
    echo ""
    
    # Applications status
    echo "Applications:"
    if command -v argocd &> /dev/null && [[ -n "${ARGOCD_PASSWORD:-}" ]]; then
        argocd app list
    else
        kubectl get applications -n $NAMESPACE_ARGOCD
    fi
}

main() {
    log_info "Starting E-Commerce Platform CI/CD Deployment"
    
    # Parse command line arguments
    DEPLOY_JENKINS=true
    DEPLOY_ARGOCD=true
    DEPLOY_APPS=true
    SETUP_MONITORING=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-jenkins)
                DEPLOY_JENKINS=false
                shift
                ;;
            --skip-argocd)
                DEPLOY_ARGOCD=false
                shift
                ;;
            --skip-apps)
                DEPLOY_APPS=false
                shift
                ;;
            --skip-monitoring)
                SETUP_MONITORING=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-jenkins     Skip Jenkins deployment"
                echo "  --skip-argocd      Skip ArgoCD deployment"
                echo "  --skip-apps        Skip application deployment"
                echo "  --skip-monitoring  Skip monitoring setup"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    create_secrets
    
    if [[ "$DEPLOY_JENKINS" == "true" ]]; then
        deploy_jenkins
    fi
    
    if [[ "$DEPLOY_ARGOCD" == "true" ]]; then
        deploy_argocd
    fi
    
    if [[ "$DEPLOY_APPS" == "true" ]]; then
        deploy_applications
    fi
    
    if [[ "$SETUP_MONITORING" == "true" ]]; then
        setup_monitoring
    fi
    
    create_ingress_dns
    show_status
    cleanup
    
    log_success "E-Commerce Platform CI/CD Deployment completed successfully!"
    
    echo ""
    log_info "Next Steps:"
    echo "1. Configure DNS entries as shown above"
    echo "2. Access Jenkins at https://jenkins.ecommerce.local"
    echo "3. Access ArgoCD at https://argocd.ecommerce.local"
    echo "4. Configure webhooks in your Git repository"
    echo "5. Set up Slack notifications (optional)"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"

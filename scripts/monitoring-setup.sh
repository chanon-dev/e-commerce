#!/bin/bash

# Monitoring & Observability Setup Script for E-commerce Platform
# This script sets up the complete monitoring stack

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
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[MONITORING]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-"development"}
MONITORING_NAMESPACE="monitoring"
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"admin123"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
PAGERDUTY_KEY=${PAGERDUTY_KEY:-""}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    # Check if kubectl is available (for Kubernetes deployment)
    if command -v kubectl &> /dev/null; then
        print_status "kubectl found - Kubernetes deployment available"
        KUBECTL_AVAILABLE=true
    else
        print_warning "kubectl not found - only Docker deployment available"
        KUBECTL_AVAILABLE=false
    fi
    
    # Check if Helm is available
    if command -v helm &> /dev/null; then
        print_status "Helm found - Helm charts available"
        HELM_AVAILABLE=true
    else
        print_warning "Helm not found - using manual Kubernetes manifests"
        HELM_AVAILABLE=false
    fi
    
    print_status "Prerequisites check completed"
}

# Function to create monitoring directories
create_directories() {
    print_header "Creating Monitoring Directories"
    
    local dirs=(
        "infrastructure/monitoring/prometheus/rules"
        "infrastructure/monitoring/alertmanager/templates"
        "infrastructure/monitoring/grafana/dashboards"
        "infrastructure/monitoring/grafana/provisioning/datasources"
        "infrastructure/monitoring/grafana/provisioning/dashboards"
        "infrastructure/monitoring/elk/elasticsearch/config"
        "infrastructure/monitoring/elk/logstash/pipeline"
        "infrastructure/monitoring/elk/logstash/templates"
        "infrastructure/monitoring/elk/kibana/config"
        "infrastructure/monitoring/jaeger/config"
        "infrastructure/monitoring/thanos"
        "infrastructure/monitoring/blackbox"
        "infrastructure/monitoring/business-metrics-exporter"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        print_status "Created directory: $dir"
    done
}

# Function to generate configuration files
generate_configs() {
    print_header "Generating Configuration Files"
    
    # Generate Grafana datasource configuration
    cat > infrastructure/monitoring/grafana/provisioning/datasources/datasources.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    
  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch-1:9200
    database: "ecommerce-logs-*"
    interval: Daily
    timeField: "@timestamp"
    
  - name: Jaeger
    type: jaeger
    access: proxy
    url: http://jaeger-query:16686
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF

    # Generate Grafana dashboard provisioning
    cat > infrastructure/monitoring/grafana/provisioning/dashboards/dashboards.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Generate Blackbox Exporter configuration
    cat > infrastructure/monitoring/blackbox/blackbox.yml << EOF
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: GET
      follow_redirects: true
      preferred_ip_protocol: "ip4"
      
  http_post_2xx:
    prober: http
    timeout: 5s
    http:
      method: POST
      headers:
        Content-Type: application/json
      body: '{"health": "check"}'
      
  tcp_connect:
    prober: tcp
    timeout: 5s
    
  icmp:
    prober: icmp
    timeout: 5s
    icmp:
      preferred_ip_protocol: "ip4"
EOF

    # Generate Thanos configuration
    cat > infrastructure/monitoring/thanos/bucket_config.yaml << EOF
type: S3
config:
  bucket: "ecommerce-metrics-storage"
  endpoint: "s3.amazonaws.com"
  region: "us-east-1"
  access_key: "${AWS_ACCESS_KEY_ID}"
  secret_key: "${AWS_SECRET_ACCESS_KEY}"
  insecure: false
  signature_version2: false
  encrypt_sse: false
  put_user_metadata: {}
  http_config:
    idle_conn_timeout: 90s
    response_header_timeout: 2m
    insecure_skip_verify: false
  trace:
    enable: false
  part_size: 134217728
EOF

    print_status "Configuration files generated"
}

# Function to setup Docker monitoring stack
setup_docker_monitoring() {
    print_header "Setting up Docker Monitoring Stack"
    
    # Create Docker network
    docker network create monitoring-network 2>/dev/null || true
    
    # Start monitoring stack
    print_status "Starting monitoring services..."
    
    cd infrastructure/monitoring
    
    # Start infrastructure services first
    docker-compose -f docker-compose.monitoring.yml up -d \
        prometheus \
        alertmanager \
        grafana \
        node-exporter \
        cadvisor
    
    # Wait for Prometheus to be ready
    print_status "Waiting for Prometheus to be ready..."
    timeout 60 bash -c 'until curl -s http://localhost:9090/-/ready; do sleep 2; done'
    
    # Start Elasticsearch cluster
    print_status "Starting Elasticsearch cluster..."
    docker-compose -f docker-compose.monitoring.yml up -d \
        elasticsearch-1 \
        elasticsearch-2 \
        elasticsearch-3
    
    # Wait for Elasticsearch to be ready
    print_status "Waiting for Elasticsearch to be ready..."
    timeout 120 bash -c 'until curl -s http://localhost:9200/_cluster/health; do sleep 5; done'
    
    # Start ELK stack
    print_status "Starting ELK stack..."
    docker-compose -f docker-compose.monitoring.yml up -d \
        logstash \
        kibana
    
    # Start Jaeger
    print_status "Starting Jaeger tracing..."
    docker-compose -f docker-compose.monitoring.yml up -d \
        jaeger-collector \
        jaeger-agent \
        jaeger-query
    
    # Start additional exporters
    print_status "Starting additional exporters..."
    docker-compose -f docker-compose.monitoring.yml up -d \
        postgres-exporter \
        redis-exporter \
        blackbox-exporter \
        business-metrics-exporter
    
    # Start Thanos for long-term storage
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Starting Thanos for long-term storage..."
        docker-compose -f docker-compose.monitoring.yml up -d \
            thanos-sidecar \
            thanos-store \
            thanos-query
    fi
    
    cd ../..
    
    print_status "Docker monitoring stack started successfully"
}

# Function to setup Kubernetes monitoring stack
setup_kubernetes_monitoring() {
    print_header "Setting up Kubernetes Monitoring Stack"
    
    # Create monitoring namespace
    kubectl create namespace $MONITORING_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    if [ "$HELM_AVAILABLE" = true ]; then
        setup_helm_monitoring
    else
        setup_manual_kubernetes_monitoring
    fi
}

# Function to setup monitoring with Helm
setup_helm_monitoring() {
    print_status "Setting up monitoring with Helm charts..."
    
    # Add Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add elastic https://helm.elastic.co
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    
    # Install Prometheus stack
    print_status "Installing Prometheus stack..."
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace $MONITORING_NAMESPACE \
        --set grafana.adminPassword=$GRAFANA_ADMIN_PASSWORD \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi
    
    # Install Elasticsearch
    print_status "Installing Elasticsearch..."
    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace $MONITORING_NAMESPACE \
        --set replicas=3 \
        --set volumeClaimTemplate.resources.requests.storage=30Gi \
        --set esConfig."elasticsearch.yml"="cluster.name: ecommerce-logs\nnetwork.host: 0.0.0.0"
    
    # Install Kibana
    print_status "Installing Kibana..."
    helm upgrade --install kibana elastic/kibana \
        --namespace $MONITORING_NAMESPACE \
        --set elasticsearchHosts="http://elasticsearch-master:9200"
    
    # Install Logstash
    print_status "Installing Logstash..."
    helm upgrade --install logstash elastic/logstash \
        --namespace $MONITORING_NAMESPACE \
        --set replicas=2 \
        --set logstashConfig."logstash.yml"="http.host: 0.0.0.0\npath.config: /usr/share/logstash/pipeline"
    
    # Install Jaeger
    print_status "Installing Jaeger..."
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace $MONITORING_NAMESPACE \
        --set storage.type=elasticsearch \
        --set storage.elasticsearch.host=elasticsearch-master \
        --set storage.elasticsearch.port=9200
    
    print_status "Helm-based monitoring stack installed successfully"
}

# Function to setup manual Kubernetes monitoring
setup_manual_kubernetes_monitoring() {
    print_status "Setting up monitoring with Kubernetes manifests..."
    
    # Apply Kubernetes manifests
    kubectl apply -f infrastructure/kubernetes/monitoring/ -n $MONITORING_NAMESPACE
    
    print_status "Manual Kubernetes monitoring stack deployed successfully"
}

# Function to configure alerting
configure_alerting() {
    print_header "Configuring Alerting"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        print_status "Configuring Slack notifications..."
        # Update Alertmanager configuration with Slack webhook
        sed -i "s|YOUR/SLACK/WEBHOOK|$SLACK_WEBHOOK_URL|g" infrastructure/monitoring/alertmanager/alertmanager.yml
    fi
    
    if [ -n "$PAGERDUTY_KEY" ]; then
        print_status "Configuring PagerDuty notifications..."
        # Update Alertmanager configuration with PagerDuty key
        sed -i "s|your-pagerduty-integration-key|$PAGERDUTY_KEY|g" infrastructure/monitoring/alertmanager/alertmanager.yml
    fi
    
    print_status "Alerting configuration completed"
}

# Function to import Grafana dashboards
import_dashboards() {
    print_header "Importing Grafana Dashboards"
    
    # Wait for Grafana to be ready
    print_status "Waiting for Grafana to be ready..."
    timeout 120 bash -c 'until curl -s http://admin:admin123@localhost:3000/api/health; do sleep 5; done'
    
    # Import dashboards
    local dashboard_files=(
        "infrastructure/monitoring/grafana/dashboards/ecommerce-overview.json"
        "infrastructure/monitoring/grafana/dashboards/infrastructure-monitoring.json"
        "infrastructure/monitoring/grafana/dashboards/business-metrics.json"
        "infrastructure/monitoring/grafana/dashboards/security-monitoring.json"
    )
    
    for dashboard_file in "${dashboard_files[@]}"; do
        if [ -f "$dashboard_file" ]; then
            print_status "Importing dashboard: $(basename $dashboard_file)"
            curl -X POST \
                -H "Content-Type: application/json" \
                -d @"$dashboard_file" \
                http://admin:admin123@localhost:3000/api/dashboards/db
        fi
    done
    
    print_status "Grafana dashboards imported successfully"
}

# Function to setup log forwarding
setup_log_forwarding() {
    print_header "Setting up Log Forwarding"
    
    # Install Filebeat for log forwarding
    if [ "$KUBECTL_AVAILABLE" = true ]; then
        print_status "Installing Filebeat DaemonSet..."
        kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: $MONITORING_NAMESPACE
spec:
  selector:
    matchLabels:
      name: filebeat
  template:
    metadata:
      labels:
        name: filebeat
    spec:
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:8.8.0
        env:
        - name: ELASTICSEARCH_HOST
          value: "elasticsearch-1"
        - name: ELASTICSEARCH_PORT
          value: "9200"
        - name: LOGSTASH_HOST
          value: "logstash"
        - name: LOGSTASH_PORT
          value: "5044"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
EOF
    else
        print_status "Setting up Filebeat with Docker..."
        docker run -d \
            --name filebeat \
            --network monitoring-network \
            -v /var/log:/var/log:ro \
            -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
            -e ELASTICSEARCH_HOST=elasticsearch-1 \
            -e LOGSTASH_HOST=logstash \
            docker.elastic.co/beats/filebeat:8.8.0
    fi
    
    print_status "Log forwarding setup completed"
}

# Function to verify monitoring stack
verify_monitoring_stack() {
    print_header "Verifying Monitoring Stack"
    
    local services=(
        "Prometheus:http://localhost:9090/-/healthy"
        "Grafana:http://localhost:3000/api/health"
        "Alertmanager:http://localhost:9093/-/healthy"
        "Elasticsearch:http://localhost:9200/_cluster/health"
        "Kibana:http://localhost:5601/api/status"
        "Jaeger:http://localhost:16686/api/services"
    )
    
    for service_info in "${services[@]}"; do
        local service_name=$(echo $service_info | cut -d: -f1)
        local service_url=$(echo $service_info | cut -d: -f2-)
        
        print_status "Checking $service_name..."
        
        if curl -s "$service_url" > /dev/null; then
            print_status "✅ $service_name is healthy"
        else
            print_warning "⚠️ $service_name is not responding"
        fi
    done
    
    print_status "Monitoring stack verification completed"
}

# Function to display access information
display_access_info() {
    print_header "Monitoring Stack Access Information"
    
    echo ""
    echo "🔍 MONITORING SERVICES:"
    echo "  Prometheus:     http://localhost:9090"
    echo "  Grafana:        http://localhost:3000 (admin/admin123)"
    echo "  Alertmanager:   http://localhost:9093"
    echo ""
    echo "📊 LOGGING SERVICES:"
    echo "  Elasticsearch:  http://localhost:9200"
    echo "  Kibana:         http://localhost:5601"
    echo ""
    echo "🔍 TRACING SERVICES:"
    echo "  Jaeger UI:      http://localhost:16686"
    echo ""
    echo "📈 EXPORTERS:"
    echo "  Node Exporter:  http://localhost:9100"
    echo "  cAdvisor:       http://localhost:8080"
    echo "  Business Metrics: http://localhost:8080/metrics"
    echo ""
    echo "🔧 MANAGEMENT:"
    echo "  Thanos Query:   http://localhost:10904 (Production only)"
    echo ""
    
    if [ "$KUBECTL_AVAILABLE" = true ]; then
        echo "🎛️ KUBERNETES ACCESS:"
        echo "  kubectl get pods -n $MONITORING_NAMESPACE"
        echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-server 9090:80"
        echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/grafana 3000:80"
        echo ""
    fi
    
    echo "📚 DOCUMENTATION:"
    echo "  Setup Guide:    ./docs/monitoring-setup.md"
    echo "  Troubleshooting: ./docs/monitoring-troubleshooting.md"
    echo "  Dashboard Guide: ./docs/grafana-dashboards.md"
    echo ""
}

# Function to create monitoring documentation
create_documentation() {
    print_header "Creating Monitoring Documentation"
    
    mkdir -p docs
    
    # Create setup guide
    cat > docs/monitoring-setup.md << 'EOF'
# Monitoring Setup Guide

## Overview
This guide covers the complete monitoring and observability setup for the e-commerce platform.

## Components
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization
- **Jaeger**: Distributed tracing
- **Alertmanager**: Alert routing and management

## Quick Start
```bash
./scripts/monitoring-setup.sh development
```

## Manual Setup
1. Start infrastructure services
2. Configure data sources
3. Import dashboards
4. Setup alerting rules
5. Configure log forwarding

## Troubleshooting
- Check service health endpoints
- Verify network connectivity
- Review configuration files
- Check resource usage
EOF

    print_status "Documentation created in docs/ directory"
}

# Main execution function
main() {
    print_header "E-commerce Platform Monitoring Setup"
    print_status "Environment: $ENVIRONMENT"
    
    # Execute setup steps
    check_prerequisites
    create_directories
    generate_configs
    configure_alerting
    
    if [ "$KUBECTL_AVAILABLE" = true ] && [ "$ENVIRONMENT" = "production" ]; then
        setup_kubernetes_monitoring
    else
        setup_docker_monitoring
    fi
    
    setup_log_forwarding
    import_dashboards
    verify_monitoring_stack
    create_documentation
    display_access_info
    
    print_status "✅ Monitoring setup completed successfully!"
    print_status "🚀 Your monitoring stack is ready to use"
}

# Script usage
usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development  Setup for local development (default)"
    echo "  staging      Setup for staging environment"
    echo "  production   Setup for production environment"
    echo ""
    echo "Environment Variables:"
    echo "  GRAFANA_ADMIN_PASSWORD  Grafana admin password (default: admin123)"
    echo "  SLACK_WEBHOOK_URL       Slack webhook for alerts"
    echo "  PAGERDUTY_KEY          PagerDuty integration key"
    echo "  AWS_ACCESS_KEY_ID      AWS access key for Thanos storage"
    echo "  AWS_SECRET_ACCESS_KEY  AWS secret key for Thanos storage"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  GRAFANA_ADMIN_PASSWORD=secure123 $0 production"
    echo "  SLACK_WEBHOOK_URL=https://hooks.slack.com/... $0 staging"
}

# Handle command line arguments
case "${1:-}" in
    "development"|"staging"|"production"|"")
        main
        ;;
    "--help"|"-h")
        usage
        exit 0
        ;;
    *)
        print_error "Invalid environment: $1"
        usage
        exit 1
        ;;
esac

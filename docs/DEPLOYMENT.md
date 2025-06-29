# 🚀 Production Deployment Guide

## 📋 Overview

This guide covers the complete production deployment of the E-commerce Microservices Platform on Kubernetes with full security, monitoring, and performance optimizations.

## 🏗️ Architecture Summary

### Production Stack
- **Frontend**: Next.js applications with CDN
- **Backend**: 13 microservices (Node.js, .NET, Go)
- **Databases**: PostgreSQL cluster, Redis cluster, MongoDB replica set, Elasticsearch
- **Message Queue**: Kafka cluster with Zookeeper
- **Security**: Vault, Keycloak, cert-manager, Falco
- **Monitoring**: Prometheus, Grafana, Jaeger, ELK Stack
- **CI/CD**: Jenkins, ArgoCD
- **Infrastructure**: Kubernetes with NGINX Ingress

### Performance Optimizations
- **Caching**: Redis cluster with 6 nodes
- **CDN**: Cloudflare with edge computing
- **Auto-scaling**: HPA for all services
- **Load Balancing**: Multi-region deployment
- **Database**: Read replicas and connection pooling

### Security Features
- **SSL/TLS**: Let's Encrypt certificates with auto-renewal
- **Network Policies**: Strict ingress/egress rules
- **Pod Security**: Restricted security contexts
- **Runtime Security**: Falco monitoring
- **Secrets Management**: HashiCorp Vault
- **Identity Management**: Keycloak SSO

## 🛠️ Prerequisites

### Required Tools
```bash
# Kubernetes tools
kubectl >= 1.28
helm >= 3.12
kustomize >= 5.0

# CI/CD tools
argocd >= 2.8
jenkins >= 2.400

# Security tools
trivy >= 0.45
snyk >= 1.1200
```

### Infrastructure Requirements
```yaml
Kubernetes Cluster:
  - Nodes: 6+ (3 masters, 3+ workers)
  - CPU: 32+ cores total
  - Memory: 128GB+ total
  - Storage: 1TB+ SSD
  - Network: 10Gbps+

External Services:
  - Domain name with DNS control
  - SSL certificates (Let's Encrypt)
  - Container registry
  - Monitoring storage
```

## 🚀 Quick Deployment

### One-Command Deployment
```bash
# Deploy everything to production
./scripts/deploy-production.sh v1.0.0
```

### Step-by-Step Deployment
```bash
# 1. Deploy infrastructure
kubectl apply -f k8s/infrastructure/

# 2. Deploy security
kubectl apply -f k8s/security/

# 3. Deploy monitoring
kubectl apply -f k8s/monitoring/

# 4. Deploy applications
kubectl apply -k k8s/overlays/prod

# 5. Setup ingress
kubectl apply -f k8s/ingress/
```

## 🔧 Detailed Deployment Steps

### 1. Infrastructure Setup

#### Database Deployment
```bash
# PostgreSQL cluster
helm install postgresql bitnami/postgresql \
  --namespace ecommerce-prod \
  --set auth.postgresPassword=secure-password \
  --set primary.persistence.size=100Gi \
  --set readReplicas.replicaCount=2

# Redis cluster
kubectl apply -f k8s/base/redis/redis-cluster.yaml

# MongoDB replica set
helm install mongodb bitnami/mongodb \
  --namespace ecommerce-prod \
  --set auth.rootPassword=secure-password \
  --set replicaSet.enabled=true \
  --set replicaSet.replicas.secondary=2

# Elasticsearch cluster
helm install elasticsearch elastic/elasticsearch \
  --namespace ecommerce-prod \
  --set replicas=3 \
  --set volumeClaimTemplate.resources.requests.storage=30Gi
```

#### Message Queue Deployment
```bash
# Kafka cluster
helm install kafka bitnami/kafka \
  --namespace ecommerce-prod \
  --set replicaCount=3 \
  --set persistence.size=20Gi \
  --set zookeeper.replicaCount=3
```

### 2. Security Setup

#### Certificate Management
```bash
# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Apply certificate issuers
kubectl apply -f k8s/security/cert-manager.yaml
```

#### Security Policies
```bash
# Network policies
kubectl apply -f k8s/security/network-policies.yaml

# Pod security policies
kubectl apply -f k8s/security/pod-security-policies.yaml

# Falco runtime security
helm install falco falcosecurity/falco \
  --namespace falco-system \
  --create-namespace \
  --set falco.grpc.enabled=true
```

#### Secrets Management
```bash
# Deploy Vault
helm install vault hashicorp/vault \
  --namespace vault-system \
  --create-namespace \
  --set server.ha.enabled=true \
  --set server.ha.replicas=3

# Deploy Keycloak
helm install keycloak bitnami/keycloak \
  --namespace keycloak-system \
  --create-namespace \
  --set auth.adminUser=admin \
  --set auth.adminPassword=secure-password
```

### 3. Monitoring Stack

#### Prometheus & Grafana
```bash
# Deploy Prometheus Operator
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.persistence.enabled=true
```

#### Distributed Tracing
```bash
# Deploy Jaeger
helm install jaeger jaegertracing/jaeger \
  --namespace monitoring \
  --set provisionDataStore.elasticsearch=true
```

#### Log Management
```bash
# Deploy Kibana
helm install kibana elastic/kibana \
  --namespace monitoring
```

### 4. Application Deployment

#### Microservices
```bash
# Update image tags
find k8s/overlays/prod -name "kustomization.yaml" -exec sed -i "s|newTag: .*|newTag: v1.0.0|g" {} \;

# Deploy all services
kubectl apply -k k8s/overlays/prod

# Wait for deployment
kubectl wait --for=condition=available deployment --all -n ecommerce-prod --timeout=600s
```

#### Frontend Applications
```bash
# Customer platform
kubectl apply -f k8s/base/customer-platform/

# Admin dashboard
kubectl apply -f k8s/base/admin-dashboard/
```

### 5. Ingress & Load Balancing

#### NGINX Ingress Controller
```bash
# Deploy ingress controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=3

# Apply ingress rules
kubectl apply -f k8s/base/ingress/
```

#### CDN Configuration
```bash
# Configure Cloudflare (manual step)
# Apply settings from infrastructure/cdn/cloudflare-config.yaml
```

### 6. CI/CD Setup

#### Jenkins
```bash
# Deploy Jenkins
helm install jenkins jenkins/jenkins \
  --namespace jenkins \
  --create-namespace \
  --set controller.adminPassword=secure-password

# Configure pipelines using Jenkinsfile
```

#### ArgoCD
```bash
# Deploy ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy applications
kubectl apply -f infrastructure/argocd/applications/
```

## 📊 Performance Tuning

### Database Optimization
```yaml
PostgreSQL:
  - Connection pooling: PgBouncer
  - Read replicas: 2 replicas
  - Backup: Daily automated backups
  - Monitoring: pg_stat_statements

Redis:
  - Cluster mode: 6 nodes (3 masters, 3 replicas)
  - Memory policy: allkeys-lru
  - Persistence: AOF + RDB
  - Monitoring: Redis exporter

MongoDB:
  - Replica set: 3 nodes
  - Sharding: Enabled for large collections
  - Indexes: Optimized for queries
  - Monitoring: MongoDB exporter
```

### Application Optimization
```yaml
Auto-scaling:
  - HPA: CPU and memory based
  - VPA: Vertical pod autoscaler
  - Cluster autoscaler: Node scaling

Resource Limits:
  - CPU requests: 250m-500m
  - Memory requests: 256Mi-512Mi
  - CPU limits: 500m-1000m
  - Memory limits: 512Mi-1Gi

Caching Strategy:
  - Application cache: Redis
  - CDN cache: Cloudflare
  - Database cache: Query result caching
  - API cache: Response caching
```

## 🔐 Security Configuration

### Network Security
```yaml
Network Policies:
  - Default deny all
  - Allow specific ingress/egress
  - Namespace isolation
  - Database access restrictions

Pod Security:
  - Non-root containers
  - Read-only root filesystem
  - No privileged containers
  - Security contexts enforced
```

### Runtime Security
```yaml
Falco Rules:
  - Unauthorized process detection
  - File system monitoring
  - Network anomaly detection
  - Container drift detection

Security Scanning:
  - Container image scanning: Trivy
  - Dependency scanning: Snyk
  - Code analysis: SonarQube
  - Infrastructure scanning: Checkov
```

## 📈 Monitoring & Alerting

### Metrics Collection
```yaml
Prometheus Targets:
  - Application metrics: /metrics endpoints
  - Infrastructure metrics: Node exporter
  - Database metrics: Database exporters
  - Kubernetes metrics: kube-state-metrics

Custom Metrics:
  - Business metrics: Order count, revenue
  - Performance metrics: Response time, throughput
  - Error metrics: Error rate, failure count
  - Security metrics: Failed logins, anomalies
```

### Alerting Rules
```yaml
Critical Alerts:
  - Service down: > 5 minutes
  - High error rate: > 5%
  - Database connection issues
  - Security incidents

Warning Alerts:
  - High response time: > 2 seconds
  - High CPU usage: > 80%
  - High memory usage: > 85%
  - Disk space low: < 20%
```

### Dashboards
```yaml
Grafana Dashboards:
  - System overview
  - Application performance
  - Database performance
  - Business metrics
  - Security monitoring
```

## 🔄 CI/CD Pipeline

### Jenkins Pipeline
```yaml
Stages:
  1. Code checkout
  2. Security scanning (SAST, SCA)
  3. Unit tests
  4. Build & push images
  5. Integration tests
  6. Deploy to staging
  7. E2E tests
  8. Deploy to production
  9. Smoke tests
  10. Performance tests
```

### ArgoCD GitOps
```yaml
Applications:
  - ecommerce-dev: Auto-sync enabled
  - ecommerce-staging: Auto-sync enabled
  - ecommerce-prod: Manual sync (approval required)

Sync Policies:
  - Prune: Remove unused resources
  - Self-heal: Auto-fix drift
  - Retry: Automatic retry on failure
```

## 🚨 Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod status
kubectl get pods -n ecommerce-prod

# Check pod logs
kubectl logs -f deployment/api-gateway -n ecommerce-prod

# Check events
kubectl get events -n ecommerce-prod --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Check database pods
kubectl get pods -l app=postgresql -n ecommerce-prod

# Test database connection
kubectl exec -it postgresql-0 -n ecommerce-prod -- psql -U postgres

# Check database logs
kubectl logs postgresql-0 -n ecommerce-prod
```

#### Network Issues
```bash
# Check network policies
kubectl get networkpolicies -n ecommerce-prod

# Test service connectivity
kubectl exec -it api-gateway-xxx -n ecommerce-prod -- curl user-service:3002/health

# Check ingress status
kubectl get ingress -n ecommerce-prod
```

### Performance Issues
```bash
# Check resource usage
kubectl top pods -n ecommerce-prod
kubectl top nodes

# Check HPA status
kubectl get hpa -n ecommerce-prod

# Check metrics
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring
```

## 📋 Maintenance

### Regular Tasks
```yaml
Daily:
  - Check system health
  - Review alerts
  - Monitor performance metrics
  - Check backup status

Weekly:
  - Update security patches
  - Review resource usage
  - Clean up old resources
  - Performance optimization

Monthly:
  - Security audit
  - Capacity planning
  - Disaster recovery testing
  - Documentation updates
```

### Backup & Recovery
```yaml
Database Backups:
  - PostgreSQL: Daily automated backups
  - MongoDB: Replica set with backups
  - Redis: AOF + RDB snapshots

Application Backups:
  - Configuration: Git repository
  - Secrets: Vault backups
  - Persistent volumes: Snapshot backups

Recovery Procedures:
  - RTO: 4 hours
  - RPO: 1 hour
  - Automated failover: Enabled
  - Manual recovery: Documented
```

## 🎯 Success Metrics

### Performance Targets
```yaml
Availability: 99.9% uptime
Response Time: < 200ms (95th percentile)
Throughput: 10,000+ requests/second
Error Rate: < 0.1%
```

### Business Metrics
```yaml
Order Processing: < 30 seconds
Payment Processing: < 10 seconds
Search Response: < 100ms
Page Load Time: < 2 seconds
```

## 📞 Support

### Emergency Contacts
- **On-call Engineer**: +1-xxx-xxx-xxxx
- **DevOps Team**: devops@ecommerce.com
- **Security Team**: security@ecommerce.com

### Documentation
- **Runbooks**: https://runbooks.ecommerce.com
- **API Docs**: https://api.ecommerce.com/docs
- **Monitoring**: https://grafana.ecommerce.com

### Escalation Process
1. **Level 1**: On-call engineer (15 minutes)
2. **Level 2**: Senior engineer (30 minutes)
3. **Level 3**: Engineering manager (1 hour)
4. **Level 4**: CTO (2 hours)

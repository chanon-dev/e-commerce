# 🚀 CI/CD Pipeline for E-Commerce Microservices

This directory contains the complete CI/CD pipeline configuration for the e-commerce microservices platform using Jenkins and ArgoCD.

## 📋 Overview

The CI/CD pipeline implements GitOps practices with:
- **Jenkins**: Continuous Integration (CI) - Build, test, and push container images
- **ArgoCD**: Continuous Deployment (CD) - Deploy applications to Kubernetes clusters
- **Multi-environment support**: Dev, Staging, Production
- **Security scanning**: Container and code security analysis
- **Automated testing**: Unit, integration, and end-to-end tests

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │     Jenkins     │    │     ArgoCD      │
│                 │    │                 │    │                 │
│ Git Push        │───▶│ 1. Build        │───▶│ 1. Sync         │
│                 │    │ 2. Test         │    │ 2. Deploy       │
│                 │    │ 3. Security     │    │ 3. Monitor      │
│                 │    │ 4. Push Images  │    │                 │
│                 │    │ 5. Update K8s   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Container       │    │ Kubernetes      │
                       │ Registry        │    │ Cluster         │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Components

### Jenkins Pipeline
- **Multi-branch pipeline** supporting all 12 microservices + 2 frontend apps
- **Parallel builds** for different technology stacks (NestJS, .NET, Go, Next.js)
- **Change detection** to build only modified services
- **Security scanning** with Trivy and SonarQube
- **Automated testing** with comprehensive test suites
- **Image building and pushing** to container registry
- **Kubernetes manifest updates** with new image tags

### ArgoCD Applications
- **GitOps deployment** with automatic synchronization
- **Multi-environment support** (dev, staging, prod)
- **Application health monitoring** and self-healing
- **Rollback capabilities** for failed deployments
- **RBAC integration** with Keycloak for access control

## 📁 Directory Structure

```
ci-cd/
├── jenkins/
│   ├── Jenkinsfile                 # Main pipeline definition
│   └── jenkins-deployment.yaml     # Jenkins Kubernetes deployment
├── argocd/
│   ├── argocd-deployment.yaml      # ArgoCD Kubernetes deployment
│   └── applications/
│       └── ecommerce-apps.yaml     # ArgoCD application definitions
├── scripts/
│   └── deploy.sh                   # Automated deployment script
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** with ingress controller
2. **Helm 3.x** installed
3. **kubectl** configured
4. **Docker** for building images
5. **Container registry** access

### Environment Variables

Set the following environment variables before deployment:

```bash
# Container Registry
export DOCKER_REGISTRY_USER="your-registry-user"
export DOCKER_REGISTRY_PASS="your-registry-password"

# Git Repository
export GITHUB_USERNAME="your-github-username"
export GITHUB_TOKEN="your-github-token"

# Security
export VAULT_TOKEN="your-vault-token"
export KEYCLOAK_CLIENT_SECRET="your-keycloak-secret"

# Notifications (Optional)
export SLACK_TOKEN="your-slack-token"
```

### Automated Deployment

Run the automated deployment script:

```bash
# Make script executable
chmod +x ci-cd/scripts/deploy.sh

# Deploy everything
./ci-cd/scripts/deploy.sh

# Deploy with options
./ci-cd/scripts/deploy.sh --skip-monitoring

# Get help
./ci-cd/scripts/deploy.sh --help
```

### Manual Deployment

1. **Deploy Jenkins**:
```bash
kubectl apply -f ci-cd/jenkins/jenkins-deployment.yaml
```

2. **Deploy ArgoCD**:
```bash
kubectl apply -f ci-cd/argocd/argocd-deployment.yaml
```

3. **Deploy Applications**:
```bash
kubectl apply -f ci-cd/argocd/applications/ecommerce-apps.yaml
```

## 🔧 Configuration

### Jenkins Configuration

Jenkins is configured with:
- **Configuration as Code (JCasC)** for automated setup
- **Kubernetes agents** for scalable builds
- **Multi-technology support** (Node.js, .NET, Go, Docker)
- **Security scanning** integration
- **Slack notifications** for build status

### ArgoCD Configuration

ArgoCD is configured with:
- **OIDC integration** with Keycloak
- **RBAC policies** for role-based access
- **Multi-environment** application management
- **Automated sync** with self-healing
- **Health checks** and monitoring

## 🔐 Security

### Pipeline Security
- **Container image scanning** with Trivy
- **Code quality analysis** with SonarQube
- **Secrets management** with HashiCorp Vault
- **RBAC** for pipeline access control

### Deployment Security
- **GitOps principles** for audit trail
- **Signed commits** verification
- **Network policies** for service isolation
- **TLS encryption** for all communications

## 📊 Monitoring

### Jenkins Monitoring
- **Build metrics** exported to Prometheus
- **Pipeline duration** and success rates
- **Agent utilization** monitoring
- **Build queue** analysis

### ArgoCD Monitoring
- **Application health** status
- **Sync status** and drift detection
- **Deployment metrics** and history
- **Resource utilization** tracking

## 🌍 Multi-Environment Support

### Environment Configuration

Each environment has its own:
- **Namespace**: `ecommerce-{env}`
- **Configuration**: `values-{env}.yaml`
- **Secrets**: Environment-specific secrets
- **Resources**: Scaled based on environment needs

### Promotion Strategy

```
Development ──▶ Staging ──▶ Production
     │              │            │
     │              │            │
Auto-deploy    Manual approval  Manual approval
     │              │            │
     ▼              ▼            ▼
Feature testing  Integration   Production
                 testing       deployment
```

## 🔄 Workflow

### Development Workflow

1. **Developer pushes code** to feature branch
2. **Jenkins detects changes** and triggers build
3. **Parallel builds** for affected services
4. **Security scanning** and testing
5. **Image building** and registry push
6. **Manifest updates** in Git repository
7. **ArgoCD syncs** changes to dev environment

### Release Workflow

1. **Merge to main branch** triggers production pipeline
2. **Full test suite** execution
3. **Security compliance** checks
4. **Manual approval** for staging deployment
5. **Staging validation** and testing
6. **Manual approval** for production deployment
7. **Production deployment** with monitoring

## 🛠️ Troubleshooting

### Common Issues

1. **Build failures**:
   - Check Jenkins logs: `kubectl logs -n jenkins deployment/jenkins`
   - Verify agent connectivity
   - Check resource limits

2. **Deployment failures**:
   - Check ArgoCD application status
   - Verify Kubernetes resources
   - Check image availability

3. **Sync issues**:
   - Verify Git repository access
   - Check ArgoCD repository credentials
   - Validate manifest syntax

### Debug Commands

```bash
# Check Jenkins status
kubectl get pods -n jenkins
kubectl logs -n jenkins deployment/jenkins

# Check ArgoCD status
kubectl get pods -n argocd
argocd app list
argocd app get <app-name>

# Check application status
kubectl get applications -n argocd
kubectl describe application <app-name> -n argocd
```

## 📚 Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [GitOps Principles](https://www.gitops.tech/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the pipeline
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support with the CI/CD pipeline:
1. Check the troubleshooting section
2. Review Jenkins and ArgoCD logs
3. Create an issue in the repository
4. Contact the DevOps team

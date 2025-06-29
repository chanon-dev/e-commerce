# 🚀 Jenkins Pipeline Setup Guide

## 📋 **Pipeline Overview**

### **🎯 Features:**
- ✅ **Multi-component deployment** (Frontend, Backend, All)
- ✅ **Multi-environment support** (Dev, Staging, Prod)
- ✅ **Parallel execution** for faster builds
- ✅ **Comprehensive testing** (Unit, Integration, E2E)
- ✅ **Security scanning** and code quality checks
- ✅ **Docker image building** and registry push
- ✅ **Kubernetes deployment** with health checks
- ✅ **Rollback capabilities** for production
- ✅ **Slack notifications** for team updates

## 🔧 **Setup Instructions**

### **Step 1: Access Jenkins**
```
URL: http://54.169.232.143/
Username: admin
Password: admin123!
```

### **Step 2: Install Required Plugins**
Go to **Manage Jenkins** → **Manage Plugins** → **Available**

Install these plugins:
- ✅ **Pipeline** (Pipeline Suite)
- ✅ **Docker Pipeline**
- ✅ **Kubernetes**
- ✅ **Git**
- ✅ **Slack Notification**
- ✅ **HTML Publisher**
- ✅ **Test Results Analyzer**
- ✅ **SonarQube Scanner**
- ✅ **Blue Ocean** (optional, for better UI)

### **Step 3: Configure Credentials**
Go to **Manage Jenkins** → **Manage Credentials** → **Global**

Add these credentials:

#### **Docker Registry:**
- **Kind**: Username with password
- **ID**: `docker-registry-credentials`
- **Username**: Your Docker registry username
- **Password**: Your Docker registry password

#### **Kubernetes Config:**
- **Kind**: Secret file
- **ID**: `kubeconfig-credentials`
- **File**: Upload your kubeconfig file

#### **Git Credentials:**
- **Kind**: Username with password (or SSH key)
- **ID**: `git-credentials`
- **Username/Password**: Your Git credentials

#### **Slack Webhook:**
- **Kind**: Secret text
- **ID**: `slack-webhook`
- **Secret**: Your Slack webhook URL

### **Step 4: Create Pipeline Job**

#### **4.1 Create New Job:**
1. Click **"New Item"**
2. Enter name: `E-commerce-Deployment-Pipeline`
3. Select **"Pipeline"**
4. Click **"OK"**

#### **4.2 Configure Pipeline:**

**General Settings:**
- ✅ Check **"This project is parameterized"**
- ✅ Check **"GitHub project"** (if using GitHub)

**Build Triggers:**
- ✅ **GitHub hook trigger** for GITScm polling
- ✅ **Poll SCM**: `H/5 * * * *` (every 5 minutes)

**Pipeline Configuration:**
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: Your Git repository URL
- **Credentials**: Select `git-credentials`
- **Branch**: `*/main` or `*/master`
- **Script Path**: `ci-cd/jenkins/pipelines/ecommerce-deployment-pipeline.groovy`

### **Step 5: Environment Configuration**

Update the pipeline script with your specific values:

```groovy
environment {
    // Update these values
    DOCKER_REGISTRY = 'your-docker-registry.com'
    SLACK_CHANNEL = '#your-deployments-channel'
    
    // Kubernetes namespaces
    NAMESPACE_DEV = 'ecommerce-dev'
    NAMESPACE_STAGING = 'ecommerce-staging'
    NAMESPACE_PROD = 'ecommerce-prod'
}
```

## 🚀 **Running the Pipeline**

### **Manual Execution:**
1. Go to your pipeline job
2. Click **"Build with Parameters"**
3. Select options:
   - **DEPLOYMENT_TARGET**: dev/staging/prod
   - **COMPONENT**: all/frontend/backend/microservices
   - **SKIP_TESTS**: true/false
   - **FORCE_DEPLOY**: true/false
4. Click **"Build"**

### **Automatic Execution:**
- **Git Push**: Automatically triggers on code push
- **Scheduled**: Runs based on cron schedule
- **Webhook**: GitHub/GitLab webhook triggers

## 📊 **Pipeline Stages**

### **🔍 Stage Breakdown:**

| Stage | Duration | Purpose |
|-------|----------|---------|
| **Pipeline Start** | 10s | Initialize and notify |
| **Checkout Code** | 30s | Get latest source code |
| **Code Quality & Security** | 2-5min | SonarQube, ESLint, Security scan |
| **Run Tests** | 5-15min | Unit, Integration, E2E tests |
| **Build Docker Images** | 3-10min | Build all container images |
| **Push Images** | 2-5min | Push to Docker registry |
| **Deploy to Kubernetes** | 2-8min | Deploy and wait for rollout |
| **Post-Deployment Tests** | 1-3min | Health checks, smoke tests |
| **Performance Tests** | 5-15min | Load testing (staging only) |

### **⏱️ Total Time:**
- **Development**: ~15-25 minutes
- **Staging**: ~25-40 minutes (with performance tests)
- **Production**: ~20-30 minutes

## 🎯 **Best Practices Implemented**

### **🔒 Security:**
- ✅ **Credential management** via Jenkins credentials
- ✅ **Security scanning** of dependencies and images
- ✅ **Least privilege** access to Kubernetes
- ✅ **Secret injection** at runtime

### **🧪 Testing:**
- ✅ **Multi-level testing** (Unit → Integration → E2E)
- ✅ **Parallel test execution** for speed
- ✅ **Test result publishing** and reporting
- ✅ **Coverage reporting** for code quality

### **🚀 Deployment:**
- ✅ **Blue-green deployment** capability
- ✅ **Rolling updates** with health checks
- ✅ **Automatic rollback** on failure
- ✅ **Environment-specific** configurations

### **📊 Monitoring:**
- ✅ **Build notifications** via Slack
- ✅ **Deployment status** tracking
- ✅ **Performance monitoring** integration
- ✅ **Log aggregation** and archiving

### **🔄 CI/CD:**
- ✅ **GitFlow integration** with branch strategies
- ✅ **Artifact versioning** with build numbers
- ✅ **Dependency caching** for faster builds
- ✅ **Pipeline as code** for version control

## 🎊 **Usage Examples**

### **Deploy Everything to Development:**
```
DEPLOYMENT_TARGET: dev
COMPONENT: all
SKIP_TESTS: false
FORCE_DEPLOY: false
```

### **Deploy Only Frontend to Staging:**
```
DEPLOYMENT_TARGET: staging
COMPONENT: frontend
SKIP_TESTS: false
FORCE_DEPLOY: false
```

### **Emergency Production Deploy:**
```
DEPLOYMENT_TARGET: prod
COMPONENT: all
SKIP_TESTS: true
FORCE_DEPLOY: true
```

### **Deploy Specific Microservices:**
```
DEPLOYMENT_TARGET: dev
COMPONENT: microservices
SKIP_TESTS: false
FORCE_DEPLOY: false
```

---

## 🎉 **Ready to Deploy!**

**Your Jenkins pipeline is now configured with enterprise-grade CI/CD capabilities!**

**Features include parallel execution, comprehensive testing, security scanning, and automated deployments with rollback capabilities!** 🚀✨

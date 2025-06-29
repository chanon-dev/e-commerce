# 🎯 Jenkins UI Setup Checklist

## 🔑 **1. Access Jenkins**
```
URL: http://54.169.232.143/
Username: admin
Password: admin123!
```

## 🔧 **2. Required Plugins Installation**

### **Go to: Manage Jenkins → Manage Plugins → Available**

#### **Essential Plugins:**
- [ ] **Pipeline** (Pipeline Suite)
- [ ] **Docker Pipeline**
- [ ] **Kubernetes**
- [ ] **Git**
- [ ] **GitHub**
- [ ] **Multibranch Scan Webhook Trigger**
- [ ] **Pipeline: Stage View**
- [ ] **Blue Ocean** (Better UI)

#### **Testing & Quality:**
- [ ] **HTML Publisher**
- [ ] **Test Results Analyzer**
- [ ] **JUnit**
- [ ] **SonarQube Scanner**
- [ ] **Code Coverage API**

#### **Notifications:**
- [ ] **Slack Notification**
- [ ] **Email Extension**
- [ ] **Build Timeout**

#### **Security:**
- [ ] **OWASP Markup Formatter**
- [ ] **Credentials Binding**
- [ ] **Role-based Authorization Strategy**

## 🔐 **3. Credentials Configuration**

### **Go to: Manage Jenkins → Manage Credentials → Global**

#### **Required Credentials:**

1. **Docker Registry**
   - **Kind**: Username with password
   - **ID**: `docker-registry-credentials`
   - **Username**: Your Docker Hub/ECR username
   - **Password**: Your Docker registry password/token

2. **GitHub/Git Access**
   - **Kind**: Username with password (or SSH key)
   - **ID**: `git-credentials`
   - **Username**: Your GitHub username
   - **Password**: Personal Access Token

3. **Kubernetes Config**
   - **Kind**: Secret file
   - **ID**: `kubeconfig-credentials`
   - **File**: Upload your kubeconfig file

4. **AWS Credentials** (if using ECR/EKS)
   - **Kind**: AWS Credentials
   - **ID**: `aws-credentials`
   - **Access Key ID**: Your AWS Access Key
   - **Secret Access Key**: Your AWS Secret Key

5. **Slack Webhook**
   - **Kind**: Secret text
   - **ID**: `slack-webhook`
   - **Secret**: Your Slack webhook URL

6. **SonarQube Token**
   - **Kind**: Secret text
   - **ID**: `sonarqube-token`
   - **Secret**: Your SonarQube authentication token

## 🛠️ **4. Global Tool Configuration**

### **Go to: Manage Jenkins → Global Tool Configuration**

#### **Configure These Tools:**

1. **Git**
   - Name: `Default`
   - Path to Git executable: `/usr/bin/git`

2. **Docker**
   - Name: `docker`
   - Installation root: `/usr/bin/docker`

3. **Node.js** (for frontend builds)
   - Name: `NodeJS-18`
   - Version: `18.x`
   - Global npm packages: `npm@latest`

4. **SonarQube Scanner**
   - Name: `SonarQube Scanner`
   - Install automatically: ✅
   - Version: Latest

## 🌐 **5. System Configuration**

### **Go to: Manage Jenkins → Configure System**

#### **GitHub Configuration:**
- **GitHub Servers**: Add GitHub server
- **API URL**: `https://api.github.com`
- **Credentials**: Select `git-credentials`
- **Test connection**: ✅

#### **Docker Configuration:**
- **Docker Builder**: Configure Docker daemon
- **Registry URL**: Your Docker registry URL
- **Registry credentials**: `docker-registry-credentials`

#### **Kubernetes Configuration:**
- **Kubernetes URL**: Your cluster endpoint
- **Kubernetes Namespace**: `jenkins`
- **Credentials**: `kubeconfig-credentials`
- **Test connection**: ✅

#### **Slack Configuration:**
- **Base URL**: `https://hooks.slack.com/services/`
- **Team Subdomain**: Your Slack workspace
- **Integration Token**: Use `slack-webhook` credential
- **Channel**: `#deployments`

## 🚀 **6. Create Pipeline Jobs**

### **6.1 Main Deployment Pipeline**

1. **New Item** → **Pipeline**
2. **Name**: `E-commerce-Deployment-Pipeline`
3. **Configuration**:
   - **Build Triggers**: 
     - ✅ GitHub hook trigger for GITScm polling
     - ✅ Poll SCM: `H/5 * * * *`
   - **Pipeline**:
     - **Definition**: Pipeline script from SCM
     - **SCM**: Git
     - **Repository URL**: `git@github.com:chanon-dev/e-commerce.git`
     - **Credentials**: `git-credentials`
     - **Branch Specifier**: `*/main`
     - **Script Path**: `ci-cd/jenkins/pipelines/ecommerce-deployment-pipeline.groovy`

### **6.2 Multi-branch Pipeline**

1. **New Item** → **Multibranch Pipeline**
2. **Name**: `E-commerce-Multibranch-Pipeline`
3. **Branch Sources**:
   - **Add source**: Git
   - **Project Repository**: `git@github.com:chanon-dev/e-commerce.git`
   - **Credentials**: `git-credentials`
4. **Build Configuration**:
   - **Mode**: by Jenkinsfile
   - **Script Path**: `ci-cd/jenkins/Jenkinsfile`
5. **Scan Multibranch Pipeline Triggers**:
   - ✅ Periodically if not otherwise run: `1 hour`
   - ✅ Scan by webhook

## 📊 **7. Dashboard Setup**

### **Install Blue Ocean Plugin**
1. **Manage Jenkins** → **Manage Plugins**
2. **Available** → Search "Blue Ocean"
3. **Install without restart**

### **Configure Views**
1. **New View** → **Pipeline View**
2. **Name**: `E-commerce Pipelines`
3. **Add jobs**: Select your pipeline jobs

## 🔔 **8. Notification Setup**

### **Slack Integration**
1. Create Slack App in your workspace
2. Add Incoming Webhooks
3. Copy webhook URL to Jenkins credentials
4. Test notification in pipeline

### **Email Notifications**
1. **Manage Jenkins** → **Configure System**
2. **E-mail Notification**:
   - **SMTP server**: Your SMTP server
   - **Default user e-mail suffix**: `@yourdomain.com`
   - **Use SMTP Authentication**: ✅
   - **Username/Password**: Your email credentials

## 🛡️ **9. Security Configuration**

### **Configure Global Security**
1. **Manage Jenkins** → **Configure Global Security**
2. **Security Realm**: Jenkins' own user database
3. **Authorization**: Role-Based Strategy
4. **Create roles**:
   - **Admin**: Full access
   - **Developer**: Build, read access
   - **Viewer**: Read-only access

### **CSRF Protection**
- ✅ Enable CSRF Protection
- ✅ Default Crumb Issuer

## ✅ **10. Verification Checklist**

### **Test Each Component:**
- [ ] Login with admin credentials
- [ ] All required plugins installed
- [ ] All credentials configured and tested
- [ ] Git connection working
- [ ] Docker registry accessible
- [ ] Kubernetes cluster reachable
- [ ] Slack notifications working
- [ ] Pipeline job created successfully
- [ ] Multi-branch pipeline scanning
- [ ] Blue Ocean dashboard accessible

### **Run Test Build:**
- [ ] Trigger manual build
- [ ] Check build logs
- [ ] Verify all stages pass
- [ ] Confirm notifications sent
- [ ] Validate deployment success

## 🎯 **Quick Setup Commands**

### **Auto-install Plugins via CLI:**
```bash
# Connect to Jenkins container
kubectl exec -it <jenkins-pod> -- bash

# Install plugins
jenkins-plugin-cli --plugins \
  pipeline-stage-view \
  docker-workflow \
  kubernetes \
  git \
  github \
  blueocean \
  slack \
  sonar \
  html-publisher \
  junit
```

### **Import Jobs via CLI:**
```bash
# Copy job configurations
kubectl cp ci-cd/jenkins/jobs/ <jenkins-pod>:/var/jenkins_home/jobs/

# Restart Jenkins
kubectl rollout restart deployment/jenkins
```

---

## 🎉 **Setup Complete!**

**Your Jenkins is now fully configured for enterprise-grade CI/CD!**

**Ready to deploy your e-commerce microservices with automated testing, security scanning, and multi-environment support!** 🚀✨

# 🚀 Jenkins CI/CD Setup

## 📁 **Active Files:**

### **🔧 Deployment Files:**
- `jenkins-deployment.yaml` - Main Jenkins deployment with admin user
- `jenkins-admin-user-config.yaml` - ConfigMap for admin user creation

### **📋 Pipeline Files:**
- `Jenkinsfile` - Main CI/CD pipeline for microservices
- `pipelines/` - Additional pipeline configurations
- `jobs/` - Job configurations

### **📖 Documentation:**
- `JENKINS_LOGIN_READY.md` - Login credentials and access guide

## 🌐 **Access Information:**

### **URLs:**
```
Primary: http://a714e1ed96c404bdd9dbba8f56ebb6e6-5d59fd69d26512b4.elb.ap-southeast-1.amazonaws.com/
Direct:  http://54.169.232.143/
```

### **Login:**
```
Username: admin
Password: admin123!
```

## 🚀 **Deployment Commands:**

### **Deploy Jenkins:**
```bash
kubectl apply -f jenkins-admin-user-config.yaml
kubectl apply -f jenkins-deployment.yaml
```

### **Check Status:**
```bash
kubectl get pods -n jenkins -l app=jenkins-stable
kubectl get svc jenkins-stable -n jenkins
```

### **Access Logs:**
```bash
kubectl logs -n jenkins deployment/jenkins-stable -f
```

## ✅ **Current Status:**
- ✅ **Jenkins Running**: Fully operational
- ✅ **Public Access**: Available from anywhere
- ✅ **Admin User**: Ready to use
- ✅ **CI/CD Ready**: Ready for pipeline creation

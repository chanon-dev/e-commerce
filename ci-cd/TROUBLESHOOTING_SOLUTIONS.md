# 🔧 CI/CD Troubleshooting & Solutions

## 📋 Quick Reference Guide

This document provides detailed solutions for common issues encountered during Jenkins and ArgoCD deployment on AWS EKS.

---

## 🚨 **Critical Issues & Solutions**

### 1. **EKS Cluster Resource Exhaustion**

#### **Symptoms:**
```
Events:
  Warning  FailedScheduling  pod/jenkins-xxx  0/2 nodes are available: 
  1 Insufficient cpu, 1 Too many pods, 2 Insufficient memory
```

#### **Diagnosis Commands:**
```bash
# Check node capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Check pod distribution
kubectl get pods --all-namespaces -o wide | awk '{print $8}' | sort | uniq -c

# Check resource requests
kubectl top nodes  # if metrics-server available
```

#### **Solution Steps:**
```bash
# 1. Scale EKS node group
aws eks update-nodegroup-config \
  --cluster-name ecommerce-dev-cluster \
  --nodegroup-name ecommerce-dev-cluster-node-group \
  --scaling-config minSize=2,maxSize=5,desiredSize=3

# 2. Wait for scaling completion
aws eks describe-update \
  --name ecommerce-dev-cluster \
  --nodegroup-name ecommerce-dev-cluster-node-group \
  --update-id <update-id>

# 3. Verify new nodes
kubectl get nodes
```

#### **Prevention:**
- Monitor cluster resource utilization regularly
- Set up cluster autoscaler for automatic scaling
- Use resource requests and limits appropriately

---

### 2. **EBS Volume Provisioning Failure**

#### **Symptoms:**
```
Events:
  Warning  ProvisioningFailed  persistentvolumeclaim/jenkins-pvc  
  failed to provision volume: UnauthorizedOperation: 
  User is not authorized to perform: ec2:CreateVolume
```

#### **Diagnosis Commands:**
```bash
# Check PVC status
kubectl get pvc -n jenkins
kubectl describe pvc jenkins-pvc -n jenkins

# Check events
kubectl get events -n jenkins --sort-by='.lastTimestamp'

# Check node group role policies
aws iam list-attached-role-policies --role-name ecommerce-dev-cluster-node-group-role
```

#### **Solution Steps:**
```bash
# 1. Attach EBS CSI policy to node group role
aws iam attach-role-policy \
  --role-name ecommerce-dev-cluster-node-group-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy

# 2. Delete and recreate PVC (if stuck)
kubectl delete pvc jenkins-pvc -n jenkins
kubectl patch pvc jenkins-pvc -n jenkins -p '{"metadata":{"finalizers":null}}'

# 3. Redeploy Jenkins
kubectl delete deployment jenkins -n jenkins
kubectl apply -f ci-cd/jenkins/jenkins-deployment.yaml

# 4. Verify PVC binding
kubectl get pvc -n jenkins -w
```

#### **Verification:**
```bash
# Check if PVC is bound
kubectl get pvc -n jenkins
# Should show: STATUS = Bound

# Check volume details
kubectl describe pv $(kubectl get pvc jenkins-pvc -n jenkins -o jsonpath='{.spec.volumeName}')
```

---

### 3. **LoadBalancer Quota Exceeded**

#### **Symptoms:**
```
Events:
  Warning  SyncLoadBalancerFailed  service/jenkins  
  Error syncing load balancer: TooManyLoadBalancers: 
  Exceeded quota of account 491317066825
```

#### **Diagnosis Commands:**
```bash
# Check current LoadBalancers
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,State.Code]'

# Check service events
kubectl describe svc jenkins -n jenkins

# Check AWS quotas
aws service-quotas get-service-quota \
  --service-code elasticloadbalancing \
  --quota-code L-53EA6B1F
```

#### **Solution Steps:**
```bash
# Option 1: Use existing NGINX Ingress (Recommended)
# 1. Revert service to NodePort
kubectl patch svc jenkins -n jenkins -p '{"spec":{"type":"NodePort"}}'

# 2. Create Ingress resource
kubectl apply -f ci-cd/jenkins/jenkins-ingress.yaml

# 3. Verify Ingress
kubectl get ingress -n jenkins

# Option 2: Request quota increase
aws service-quotas request-service-quota-increase \
  --service-code elasticloadbalancing \
  --quota-code L-53EA6B1F \
  --desired-value 50
```

#### **Alternative Solutions:**
```bash
# Use existing LoadBalancer with path-based routing
# Check existing LoadBalancers
kubectl get svc --all-namespaces | grep LoadBalancer

# Share NGINX Ingress Controller LoadBalancer
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

---

### 4. **External Access Issues**

#### **Symptoms:**
- Port-forward works locally but not externally
- NodePort services not accessible from outside
- Connection timeouts from external clients

#### **Diagnosis Commands:**
```bash
# Check node external IPs
kubectl get nodes -o wide

# Check security groups
aws ec2 describe-security-groups --group-ids sg-030a903a3be6c8d96

# Check VPC and subnets
aws ec2 describe-subnets --subnet-ids subnet-0dcf8e4fc2d7fcbe7

# Test internal connectivity
kubectl exec -it <pod-name> -- curl http://jenkins.jenkins.svc.cluster.local:8080
```

#### **Root Cause Analysis:**
```bash
# EKS nodes in private subnets
aws ec2 describe-instances --instance-ids i-03df92eca5b45c290 \
  --query 'Reservations[*].Instances[*].[InstanceId,PublicIpAddress,PrivateIpAddress]'

# Check route tables
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-025d356c717a0f058"
```

#### **Solution Steps:**
```bash
# 1. Install/verify NGINX Ingress Controller
kubectl get pods -n ingress-nginx

# 2. Check NGINX LoadBalancer
kubectl get svc -n ingress-nginx ingress-nginx-controller

# 3. Create proper Ingress rules
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jenkins-ingress
  namespace: jenkins
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: /jenkins
        pathType: Prefix
        backend:
          service:
            name: jenkins
            port:
              number: 8080

# 4. Apply and test
kubectl apply -f jenkins-ingress.yaml
curl -s -o /dev/null -w "%{http_code}" http://<ELB-URL>/jenkins/
```

---

## 🔍 **Diagnostic Commands Reference**

### **Cluster Health**
```bash
# Overall cluster status
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces

# Resource utilization
kubectl top nodes
kubectl top pods --all-namespaces

# Events across cluster
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

### **Jenkins Specific**
```bash
# Jenkins pod status
kubectl get pods -n jenkins -o wide
kubectl describe pod -n jenkins -l app=jenkins

# Jenkins logs
kubectl logs -n jenkins deployment/jenkins --tail=50 -f

# Jenkins service and ingress
kubectl get svc,ingress -n jenkins
kubectl describe ingress jenkins-ingress -n jenkins

# Jenkins PVC status
kubectl get pvc -n jenkins
kubectl describe pvc jenkins-pvc -n jenkins
```

### **ArgoCD Specific**
```bash
# ArgoCD pods
kubectl get pods -n argocd
kubectl logs -n argocd deployment/argocd-server --tail=50

# ArgoCD applications
kubectl get applications -n argocd
kubectl describe application <app-name> -n argocd

# ArgoCD configuration
kubectl get configmap -n argocd argocd-cm -o yaml
```

### **Network Troubleshooting**
```bash
# DNS resolution
kubectl exec -it <pod-name> -- nslookup jenkins.jenkins.svc.cluster.local

# Service connectivity
kubectl exec -it <pod-name> -- curl -v http://jenkins.jenkins.svc.cluster.local:8080

# Ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=50

# LoadBalancer status
kubectl get svc -n ingress-nginx ingress-nginx-controller -o yaml
```

---

## 🛠️ **Recovery Procedures**

### **Jenkins Recovery**
```bash
# Complete Jenkins restart
kubectl delete deployment jenkins -n jenkins
kubectl delete pvc jenkins-pvc -n jenkins  # Only if needed
kubectl apply -f ci-cd/jenkins/jenkins-deployment.yaml

# Preserve data restart
kubectl rollout restart deployment/jenkins -n jenkins
kubectl rollout status deployment/jenkins -n jenkins
```

### **ArgoCD Recovery**
```bash
# Restart ArgoCD server
kubectl rollout restart deployment/argocd-server -n argocd

# Reset ArgoCD admin password
kubectl -n argocd patch secret argocd-secret \
  -p '{"stringData": {"admin.password": "$2a$10$rRyBsGSHK6.uc8fntPwVIuLVHgsAhAX7TcdrqW/RADU0uh7CaChLa","admin.passwordMtime": "'$(date +%FT%T%Z)'"}}'

# Sync all applications
argocd app sync --all --auth-token <token>
```

### **Ingress Recovery**
```bash
# Restart NGINX Ingress Controller
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx

# Recreate Ingress rules
kubectl delete ingress jenkins-ingress -n jenkins
kubectl apply -f ci-cd/jenkins/jenkins-ingress.yaml

# Check LoadBalancer health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

---

## 📊 **Monitoring & Alerting**

### **Key Metrics to Monitor**
```bash
# Pod resource usage
kubectl top pods -n jenkins
kubectl top pods -n argocd

# PVC usage
kubectl exec -n jenkins deployment/jenkins -- df -h /var/jenkins_home

# Service response times
curl -w "@curl-format.txt" -o /dev/null -s http://<jenkins-url>/api/json
```

### **Health Check Scripts**
```bash
#!/bin/bash
# jenkins-health-check.sh

JENKINS_URL="http://abd48968ebd0948bb9cf824095246aca-1531031d6ceb21bd.elb.ap-southeast-1.amazonaws.com/jenkins"

# Check Jenkins API
response=$(curl -s -o /dev/null -w "%{http_code}" "$JENKINS_URL/api/json")
if [ "$response" -eq 200 ]; then
    echo "✅ Jenkins is healthy"
else
    echo "❌ Jenkins health check failed: HTTP $response"
    kubectl logs -n jenkins deployment/jenkins --tail=10
fi

# Check ArgoCD
kubectl get pods -n argocd | grep -v Running && echo "❌ ArgoCD pods not running" || echo "✅ ArgoCD is healthy"
```

---

## 🔐 **Security Troubleshooting**

### **RBAC Issues**
```bash
# Check Jenkins service account permissions
kubectl auth can-i --list --as=system:serviceaccount:jenkins:jenkins

# Check ArgoCD permissions
kubectl auth can-i create deployments --as=system:serviceaccount:argocd:argocd-server

# Debug RBAC
kubectl describe clusterrolebinding jenkins
kubectl describe rolebinding -n jenkins
```

### **Secret Management**
```bash
# Check Jenkins secrets
kubectl get secrets -n jenkins
kubectl describe secret jenkins-secrets -n jenkins

# Check ArgoCD secrets
kubectl get secrets -n argocd
kubectl describe secret argocd-initial-admin-secret -n argocd
```

---

## 📞 **Emergency Contacts & Escalation**

### **Immediate Actions for Critical Issues**
1. **Service Down**: Check pod status and logs
2. **Data Loss Risk**: Verify PVC and backup status
3. **Security Breach**: Rotate secrets and check access logs
4. **Performance Issues**: Check resource utilization and scaling

### **Escalation Matrix**
- **Level 1**: Restart services, check basic connectivity
- **Level 2**: Investigate logs, check AWS resources
- **Level 3**: Contact AWS support, review architecture

---

## 📚 **Additional Resources**

### **Official Documentation**
- [Jenkins on Kubernetes](https://www.jenkins.io/doc/book/installing/kubernetes/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [AWS EKS Troubleshooting](https://docs.aws.amazon.com/eks/latest/userguide/troubleshooting.html)

### **Community Resources**
- [Jenkins Community Forums](https://community.jenkins.io/)
- [ArgoCD GitHub Issues](https://github.com/argoproj/argo-cd/issues)
- [Kubernetes Slack](https://kubernetes.slack.com/)

---

*This troubleshooting guide is based on real deployment experiences and should be updated as new issues are encountered and resolved.*

# 🚀 คู่มือการ Deploy E-Commerce Platform ไปยัง Kubernetes

## 📋 ภาพรวม

คู่มือนี้จะแนะนำการ deploy frontend และ backend services ทั้งหมดของ E-Commerce Platform ไปยัง Kubernetes cluster แบบ step by step เป็นภาษาไทย

## 🏗️ สถาปัตยกรรมที่จะ Deploy

### 🌐 Frontend Applications
- **Customer Platform** (Next.js) - พอร์ต 3000
- **Admin Dashboard** (Next.js) - พอร์ต 3100

### 🔧 Backend Services
- **API Gateway** (NestJS) - พอร์ต 8080
- **Auth Service** (NestJS) - พอร์ต 3001
- **User Service** (.NET) - พอร์ต 3002
- **Product Service** (Go) - พอร์ต 3003
- **Order Service** (.NET) - พอร์ต 3004
- **Payment Service** (Go) - พอร์ต 3005
- **Cart Service** (NestJS) - พอร์ต 3006
- **Inventory Service** (Go) - พอร์ต 3007
- **Shipping Service** (NestJS) - พอร์ต 3008
- **Promotion Service** (.NET) - พอร์ต 3009
- **Review Service** (NestJS) - พอร์ต 3010
- **Notification Service** (Go) - พอร์ต 3011
- **Admin Service** (NestJS) - พอร์ต 3012

## 📋 ข้อกำหนดเบื้องต้น

### 🛠️ เครื่องมือที่ต้องมี
```bash
# ตรวจสอบ kubectl
kubectl version --client

# ตรวจสอบ Docker
docker --version

# ตรวจสอบการเชื่อมต่อ Kubernetes cluster
kubectl cluster-info
```

### 🔐 Secrets ที่ต้องเตรียม
- Database connection strings
- Redis connection URL
- JWT secrets
- API keys (Stripe, PayPal, etc.)
- Docker registry credentials

## 🚀 วิธีการ Deploy แบบ Manual

### ขั้นตอนที่ 1: เตรียม Environment

```bash
# 1. Clone repository
git clone git@github.com:chanon-dev/e-commerce.git
cd ecommerce

# 2. ตรวจสอบ Kubernetes cluster
kubectl get nodes

# 3. ตรวจสอบ namespace
kubectl get namespaces
```

### ขั้นตอนที่ 2: สร้าง Namespace

```bash
# สร้าง namespace สำหรับ e-commerce
kubectl apply -f k8s/namespace.yaml

# ตรวจสอบ namespace
kubectl get namespace ecommerce
```

### ขั้นตอนที่ 3: Deploy Secrets และ ConfigMaps

```bash
# Deploy secrets ทั้งหมด
kubectl apply -f k8s/secrets/

# Deploy configmaps
kubectl apply -f k8s/configmaps/

# ตรวจสอบ secrets และ configmaps
kubectl get secrets -n ecommerce
kubectl get configmaps -n ecommerce
```

### ขั้นตอนที่ 4: Deploy Frontend Services

#### 4.1 Deploy Customer Platform

```bash
# Deploy customer platform
kubectl apply -f k8s/deployments/frontend/customer-platform-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=customer-platform

# ตรวจสอบ logs
kubectl logs -n ecommerce -l app=customer-platform
```

#### 4.2 Deploy Admin Dashboard

```bash
# Deploy admin dashboard
kubectl apply -f k8s/deployments/frontend/admin-dashboard-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=admin-dashboard

# ตรวจสอบ service
kubectl get svc -n ecommerce admin-dashboard
```

### ขั้นตอนที่ 5: Deploy Backend Services

#### 5.1 Deploy API Gateway

```bash
# Deploy API Gateway
kubectl apply -f k8s/deployments/backend/api-gateway-deployment.yaml

# รอให้ deployment พร้อม
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n ecommerce

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=api-gateway
```

#### 5.2 Deploy Auth Service

```bash
# Deploy Auth Service
kubectl apply -f k8s/deployments/backend/auth-service-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=auth-service

# ตรวจสอบ logs
kubectl logs -n ecommerce -l app=auth-service --tail=50
```

#### 5.3 Deploy User Service

```bash
# Deploy User Service (.NET)
kubectl apply -f k8s/deployments/backend/user-service-deployment.yaml

# รอให้ deployment พร้อม
kubectl wait --for=condition=available --timeout=300s deployment/user-service -n ecommerce

# ตรวจสอบสถานะ
kubectl describe deployment user-service -n ecommerce
```

#### 5.4 Deploy Product Service

```bash
# Deploy Product Service (Go)
kubectl apply -f k8s/deployments/backend/product-service-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=product-service

# ทดสอบ health check
kubectl exec -n ecommerce -it $(kubectl get pod -n ecommerce -l app=product-service -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3003/health
```

#### 5.5 Deploy Order Service

```bash
# Deploy Order Service (.NET)
kubectl apply -f k8s/deployments/backend/order-service-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=order-service

# ตรวจสอบ resource usage
kubectl top pods -n ecommerce -l app=order-service
```

#### 5.6 Deploy Payment Service

```bash
# Deploy Payment Service (Go)
kubectl apply -f k8s/deployments/backend/payment-service-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=payment-service

# ตรวจสอบ environment variables
kubectl exec -n ecommerce -it $(kubectl get pod -n ecommerce -l app=payment-service -o jsonpath='{.items[0].metadata.name}') -- env | grep -E "(PORT|DATABASE)"
```

#### 5.7 Deploy Cart Service

```bash
# Deploy Cart Service (NestJS)
kubectl apply -f k8s/deployments/backend/cart-service-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=cart-service

# ตรวจสอบ service endpoints
kubectl get endpoints -n ecommerce cart-service
```

### ขั้นตอนที่ 6: Deploy Additional Services

```bash
# Deploy services ที่เหลือทั้งหมด
kubectl apply -f k8s/deployments/services/all-services-deployment.yaml

# ตรวจสอบสถานะทั้งหมด
kubectl get deployments -n ecommerce

# รอให้ทุก deployment พร้อม
kubectl wait --for=condition=available --timeout=300s deployment --all -n ecommerce
```

### ขั้นตอนที่ 7: ตรวจสอบการ Deploy

```bash
# ตรวจสอบ pods ทั้งหมด
kubectl get pods -n ecommerce -o wide

# ตรวจสอบ services
kubectl get svc -n ecommerce

# ตรวจสอบ ingress
kubectl get ingress -n ecommerce

# ตรวจสอบ resource usage
kubectl top pods -n ecommerce
```

## 🤖 วิธีการ Deploy แบบอัตโนมัติ

### ใช้ Script Deploy

```bash
# Deploy ทั้งหมด (frontend + backend)
./scripts/deploy-k8s.sh all

# Deploy เฉพาะ frontend
./scripts/deploy-k8s.sh frontend

# Deploy เฉพาะ backend
./scripts/deploy-k8s.sh backend

# ตรวจสอบสถานะ
./scripts/deploy-k8s.sh status

# ลบ deployments ทั้งหมด
./scripts/deploy-k8s.sh cleanup
```

### ตัวอย่างการใช้งาน Script

```bash
# 1. Deploy ทั้งหมด
$ ./scripts/deploy-k8s.sh all
=== เริ่มต้น Deploy E-Commerce Platform ===
[INFO] kubectl พร้อมใช้งาน
[INFO] เชื่อมต่อกับ Kubernetes cluster สำเร็จ
=== สร้าง Namespace ===
[INFO] Namespace 'ecommerce' ถูกสร้างแล้ว
=== Deploy Secrets และ ConfigMaps ===
[INFO] Secrets ถูก deploy แล้ว
[INFO] ConfigMaps ถูก deploy แล้ว
=== Deploy Frontend Services ===
[INFO] กำลัง deploy Customer Platform...
[INFO] กำลัง deploy Admin Dashboard...
[INFO] Frontend services ถูก deploy แล้ว
=== Deploy Backend Services ===
[INFO] กำลัง deploy API Gateway...
[INFO] กำลัง deploy Auth Service...
[INFO] กำลัง deploy User Service...
[INFO] กำลัง deploy Product Service...
[INFO] กำลัง deploy Order Service...
[INFO] กำลัง deploy Payment Service...
[INFO] กำลัง deploy Cart Service...
[INFO] Backend services ถูก deploy แล้ว
=== Deploy Additional Services ===
[INFO] กำลัง deploy Inventory, Shipping, Promotion, Review, Notification และ Admin Services...
[INFO] Additional services ถูก deploy แล้ว
=== รอให้ Deployments พร้อมใช้งาน ===
[INFO] ทุก Deployments พร้อมใช้งานแล้ว
=== Deploy สำเร็จ! ===
🎉 E-Commerce Platform ถูก deploy ไปยัง Kubernetes แล้ว!
Access URLs:
  Customer Platform: http://shop.ecommerce.local
  Admin Dashboard: http://admin.ecommerce.local
  API Gateway: http://api.ecommerce.local
```

## 🔍 การตรวจสอบและ Troubleshooting

### ตรวจสอบสถานะ Pods

```bash
# ดู pods ทั้งหมด
kubectl get pods -n ecommerce

# ดู pods ที่มีปัญหา
kubectl get pods -n ecommerce --field-selector=status.phase!=Running

# ดู logs ของ pod ที่มีปัญหา
kubectl logs -n ecommerce <pod-name> --previous

# ดู events
kubectl get events -n ecommerce --sort-by='.lastTimestamp'
```

### ตรวจสอบ Services และ Networking

```bash
# ตรวจสอบ services
kubectl get svc -n ecommerce

# ตรวจสอบ endpoints
kubectl get endpoints -n ecommerce

# ทดสอบการเชื่อมต่อระหว่าง services
kubectl exec -n ecommerce -it <pod-name> -- curl http://api-gateway:8080/health
```

### ตรวจสอบ Resource Usage

```bash
# ดู resource usage ของ pods
kubectl top pods -n ecommerce

# ดู resource usage ของ nodes
kubectl top nodes

# ดู resource limits และ requests
kubectl describe pods -n ecommerce | grep -A 5 -B 5 "Limits\|Requests"
```

## 🔧 การ Scale Services

### Scale Frontend Services

```bash
# Scale customer platform
kubectl scale deployment customer-platform --replicas=5 -n ecommerce

# Scale admin dashboard
kubectl scale deployment admin-dashboard --replicas=3 -n ecommerce

# ตรวจสอบการ scale
kubectl get deployment -n ecommerce
```

### Scale Backend Services

```bash
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=5 -n ecommerce

# Scale Product Service
kubectl scale deployment product-service --replicas=4 -n ecommerce

# Scale Order Service
kubectl scale deployment order-service --replicas=3 -n ecommerce

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce -l app=api-gateway
```

## 🔄 การ Update Services

### Rolling Update

```bash
# Update image ของ customer platform
kubectl set image deployment/customer-platform customer-platform=ecommerce/customer-platform:v2.0.0 -n ecommerce

# ตรวจสอบสถานะการ update
kubectl rollout status deployment/customer-platform -n ecommerce

# ดู history ของการ update
kubectl rollout history deployment/customer-platform -n ecommerce
```

### Rollback

```bash
# Rollback ไปยัง version ก่อนหน้า
kubectl rollout undo deployment/customer-platform -n ecommerce

# Rollback ไปยัง revision ที่ระบุ
kubectl rollout undo deployment/customer-platform --to-revision=2 -n ecommerce
```

## 🌐 การตั้งค่า Ingress และ DNS

### ตั้งค่า Local DNS (สำหรับ Testing)

```bash
# เพิ่มใน /etc/hosts (Linux/Mac) หรือ C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 shop.ecommerce.local
127.0.0.1 admin.ecommerce.local
127.0.0.1 api.ecommerce.local
```

### ตรวจสอบ Ingress

```bash
# ดู ingress rules
kubectl get ingress -n ecommerce

# ดู ingress details
kubectl describe ingress customer-platform-ingress -n ecommerce

# ตรวจสอบ ingress controller
kubectl get pods -n ingress-nginx
```

## 📊 Monitoring และ Logging

### ตรวจสอบ Logs

```bash
# ดู logs ของ service ทั้งหมด
kubectl logs -n ecommerce -l tier=frontend --tail=100

# ดู logs แบบ real-time
kubectl logs -n ecommerce -l app=api-gateway -f

# ดู logs ของหลาย pods
kubectl logs -n ecommerce -l tier=backend --tail=50 --prefix=true
```

### Health Checks

```bash
# ตรวจสอบ health ของ services
for service in api-gateway auth-service user-service product-service; do
  echo "Checking $service..."
  kubectl exec -n ecommerce -it $(kubectl get pod -n ecommerce -l app=$service -o jsonpath='{.items[0].metadata.name}') -- curl -s localhost:$(kubectl get svc -n ecommerce $service -o jsonpath='{.spec.ports[0].port}')/health || echo "Failed"
done
```

## 🔐 Security Best Practices

### Network Policies

```bash
# Apply network policies
kubectl apply -f k8s/security/network-policies.yaml

# ตรวจสอบ network policies
kubectl get networkpolicies -n ecommerce
```

### Pod Security

```bash
# Apply pod security policies
kubectl apply -f k8s/security/pod-security-policies.yaml

# ตรวจสอบ security context
kubectl get pods -n ecommerce -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext}{"\n"}{end}'
```

## 🚨 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: Pod ไม่สามารถ Start ได้

```bash
# ตรวจสอบ pod status
kubectl describe pod <pod-name> -n ecommerce

# ตรวจสอบ events
kubectl get events -n ecommerce --field-selector involvedObject.name=<pod-name>

# ตรวจสอบ resource limits
kubectl describe node <node-name>
```

### ปัญหา: Service ไม่สามารถเชื่อมต่อกันได้

```bash
# ตรวจสอบ service discovery
kubectl exec -n ecommerce -it <pod-name> -- nslookup <service-name>

# ตรวจสอบ endpoints
kubectl get endpoints -n ecommerce <service-name>

# ทดสอบการเชื่อมต่อ
kubectl exec -n ecommerce -it <pod-name> -- telnet <service-name> <port>
```

### ปัญหา: Database Connection

```bash
# ตรวจสอบ secrets
kubectl get secret -n ecommerce database-secrets -o yaml

# ทดสอบการเชื่อมต่อ database
kubectl exec -n ecommerce -it <pod-name> -- env | grep DATABASE
```

## 📈 Performance Tuning

### Resource Optimization

```bash
# ตรวจสอบ resource usage
kubectl top pods -n ecommerce --sort-by=cpu
kubectl top pods -n ecommerce --sort-by=memory

# Adjust resource limits
kubectl patch deployment <deployment-name> -n ecommerce -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container-name>","resources":{"limits":{"memory":"1Gi","cpu":"1000m"}}}]}}}}'
```

### Horizontal Pod Autoscaler

```bash
# สร้าง HPA สำหรับ API Gateway
kubectl autoscale deployment api-gateway --cpu-percent=70 --min=3 --max=10 -n ecommerce

# ตรวจสอบ HPA
kubectl get hpa -n ecommerce

# ดู HPA details
kubectl describe hpa api-gateway -n ecommerce
```

## 🎯 การทดสอบหลังจาก Deploy

### Smoke Tests

```bash
# ทดสอบ frontend
curl -I http://shop.ecommerce.local
curl -I http://admin.ecommerce.local

# ทดสอบ API Gateway
curl http://api.ecommerce.local/health

# ทดสอบ services
curl http://api.ecommerce.local/api/products
curl http://api.ecommerce.local/api/users/profile
```

### Load Testing

```bash
# ใช้ kubectl run สำหรับ load testing
kubectl run -i --tty load-test --image=busybox --rm --restart=Never -- sh

# ใน container
while true; do wget -q -O- http://api-gateway:8080/health; done
```

## 📚 เอกสารเพิ่มเติม

### คำสั่งที่มีประโยชน์

```bash
# ดู resource ทั้งหมดใน namespace
kubectl get all -n ecommerce

# Export configuration
kubectl get deployment customer-platform -n ecommerce -o yaml > customer-platform-backup.yaml

# Apply configuration จากไฟล์
kubectl apply -f customer-platform-backup.yaml

# Delete resources
kubectl delete -f k8s/deployments/frontend/customer-platform-deployment.yaml
```

### Useful Aliases

```bash
# เพิ่มใน ~/.bashrc หรือ ~/.zshrc
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployment'
alias kdp='kubectl describe pod'
alias kl='kubectl logs'
alias ke='kubectl exec -it'
```

## 🎉 สรุป

คู่มือนี้ครอบคลุมการ deploy E-Commerce Platform ทั้งหมดไปยัง Kubernetes ตั้งแต่การเตรียม environment, การ deploy services ทีละตัว, การใช้ script อัตโนมัติ, การตรวจสอบและแก้ไขปัญหา, รวมถึงการ optimize performance

### ✅ สิ่งที่ได้หลังจาก Deploy สำเร็จ:

- **Frontend Applications**: Customer Platform และ Admin Dashboard
- **Backend Services**: 12 microservices ที่ทำงานร่วมกัน
- **Load Balancing**: การกระจายโหลดอัตโนมัติ
- **Health Monitoring**: การตรวจสอบสุขภาพของ services
- **Scalability**: สามารถ scale services ตามความต้องการ
- **Security**: การรักษาความปลอดภัยด้วย secrets และ network policies

### 🚀 ขั้นตอนถัดไป:

1. ตั้งค่า monitoring ด้วย Prometheus และ Grafana
2. ตั้งค่า logging ด้วย ELK Stack
3. ตั้งค่า CI/CD pipeline ด้วย Jenkins
4. ตั้งค่า backup และ disaster recovery
5. Performance testing และ optimization

---

**🎯 Happy Deploying! ขอให้การ deploy สำเร็จลุล่วง! 🚀**

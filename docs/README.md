# 📚 E-Commerce Platform Documentation

## 📋 ภาพรวม

ยินดีต้อนรับสู่เอกสารประกอบของ E-Commerce Platform! เอกสารชุดนี้ครอบคลุมทุกด้านของระบบ ตั้งแต่การติดตั้ง การพัฒนา ไปจนถึงการ deploy และ maintain

---

## 📖 รายการเอกสาร

### 🚀 **Getting Started**
- **[README.md](../README.md)** - ภาพรวมโปรเจคและ quick start guide
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - คู่มือเริ่มต้นสำหรับนักพัฒนา

### 🏗️ **Architecture & Design**
- **[MICROSERVICES_ARCHITECTURE.md](../MICROSERVICES_ARCHITECTURE.md)** - สถาปัตยกรรม microservices
- **[API_SPECIFICATIONS.md](API_SPECIFICATIONS.md)** - รายละเอียด API ทั้งหมด
- **[DATABASE_SCHEMAS.md](DATABASE_SCHEMAS.md)** - โครงสร้างฐานข้อมูล
- **[API_DATABASE_INTEGRATION.md](API_DATABASE_INTEGRATION.md)** - การเชื่อมต่อ API และ Database

### 🚀 **Deployment & Operations**
- **[KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)** - คู่มือ deploy ไปยัง Kubernetes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - คู่มือ deployment ทั่วไป
- **[HEALTH_DASHBOARD_GUIDE.md](HEALTH_DASHBOARD_GUIDE.md)** - การใช้งาน Health Dashboard

### 🔧 **Development**
- **[branching-strategy.md](branching-strategy.md)** - Git branching strategy และ CI/CD
- **[API.md](API.md)** - API documentation และ usage examples

### 📊 **Monitoring & Maintenance**
- **[PUBLIC_LINKS.md](../PUBLIC_LINKS.md)** - รายการ public URLs ทั้งหมด

---

## 🎯 **Quick Navigation**

### 👨‍💻 **สำหรับ Developers**
```
1. อ่าน README.md เพื่อเข้าใจภาพรวม
2. ศึกษา MICROSERVICES_ARCHITECTURE.md
3. ดู API_SPECIFICATIONS.md สำหรับ API details
4. ตรวจสอบ DATABASE_SCHEMAS.md สำหรับ data structure
5. ใช้ branching-strategy.md สำหรับ Git workflow
```

### 🚀 **สำหรับ DevOps**
```
1. อ่าน KUBERNETES_DEPLOYMENT_GUIDE.md
2. ใช้ DEPLOYMENT.md สำหรับ deployment process
3. ตั้งค่า HEALTH_DASHBOARD_GUIDE.md สำหรับ monitoring
4. ตรวจสอบ PUBLIC_LINKS.md สำหรับ service URLs
```

### 👨‍💼 **สำหรับ Project Managers**
```
1. อ่าน README.md เพื่อเข้าใจ project scope
2. ดู MICROSERVICES_ARCHITECTURE.md สำหรับ technical overview
3. ตรวจสอบ PUBLIC_LINKS.md สำหรับ demo links
```

---

## 🏗️ **Architecture Overview**

### 🌐 **Frontend Applications**
- **Customer Platform** (Next.js) - หน้าเว็บลูกค้า
- **Admin Dashboard** (Next.js) - หน้าจัดการระบบ

### 🔧 **Backend Services**
- **API Gateway** (NestJS) - ประตูหลักของ API
- **Auth Service** (NestJS) - ระบบยืนยันตัวตน
- **User Service** (.NET) - จัดการข้อมูลผู้ใช้
- **Product Service** (Go) - จัดการสินค้า
- **Order Service** (.NET) - จัดการคำสั่งซื้อ
- **Payment Service** (Go) - ระบบชำระเงิน
- **Cart Service** (NestJS) - ตะกร้าสินค้า
- **Inventory Service** (Go) - จัดการสต็อก
- **Shipping Service** (NestJS) - ระบบจัดส่ง
- **Promotion Service** (.NET) - ระบบโปรโมชั่น
- **Review Service** (NestJS) - ระบบรีวิว
- **Notification Service** (Go) - ระบบแจ้งเตือน
- **Admin Service** (NestJS) - ระบบจัดการ

### 🗄️ **Databases**
- **PostgreSQL** - ฐานข้อมูลหลัก
- **MongoDB** - เก็บข้อมูล documents
- **Redis** - Cache และ sessions
- **Elasticsearch** - Search engine

### 🔐 **Security & Infrastructure**
- **Keycloak** - Identity & Access Management
- **HashiCorp Vault** - Secrets Management
- **Apache Kafka** - Message Queue
- **Prometheus + Grafana** - Monitoring
- **Jenkins** - CI/CD Pipeline

---

## 📊 **Service Status**

### ✅ **Production Ready**
- Customer Platform ✅
- API Gateway ✅
- Product Services ✅
- Keycloak ✅
- Vault ✅
- Kafka ✅

### 🟡 **In Development**
- Health Dashboard 🟡
- Full Backend Services 🟡
- Admin Dashboard 🟡

### 📈 **Metrics**
- **Total Services**: 16+
- **Technologies**: 4 (Next.js, .NET, Go, NestJS)
- **Databases**: 4 (PostgreSQL, MongoDB, Redis, Elasticsearch)
- **Public URLs**: 20+

---

## 🚀 **Quick Start Commands**

### 🐳 **Docker Development**
```bash
# Start infrastructure services
docker-compose -f docker-compose.infrastructure.yml up -d

# Start application services
docker-compose -f docker-compose.services.yml up -d

# Check status
docker-compose ps
```

### ☸️ **Kubernetes Deployment**
```bash
# Deploy all services
./scripts/deploy-k8s.sh all

# Deploy frontend only
./scripts/deploy-k8s.sh frontend

# Deploy backend only
./scripts/deploy-k8s.sh backend

# Check status
kubectl get pods -n ecommerce
```

### 🌿 **Git Workflow**
```bash
# Create feature branch
./scripts/branch-management.sh feature user-authentication

# Sync with develop
./scripts/branch-management.sh sync

# Finish feature
./scripts/branch-management.sh finish
```

---

## 🔗 **Important Links**

### 🌐 **Live Services**
- **Feature Frontend**: [http://aa228885c02654b6186c5d48ca7fbb46-1184786648.ap-southeast-1.elb.amazonaws.com](http://aa228885c02654b6186c5d48ca7fbb46-1184786648.ap-southeast-1.elb.amazonaws.com)
- **Kafka UI**: [http://a485634b8d5424b399168dca5f0901f2-907048287.ap-southeast-1.elb.amazonaws.com:8080](http://a485634b8d5424b399168dca5f0901f2-907048287.ap-southeast-1.elb.amazonaws.com:8080)
- **Keycloak**: [http://ae6d617fb33b345dd82d57364a7a7f5d-5812463.ap-southeast-1.elb.amazonaws.com:8080](http://ae6d617fb33b345dd82d57364a7a7f5d-5812463.ap-southeast-1.elb.amazonaws.com:8080)

### 📚 **Documentation**
- **GitHub Repository**: [https://github.com/chanon-dev/e-commerce](https://github.com/chanon-dev/e-commerce)
- **API Documentation**: [docs/API_SPECIFICATIONS.md](API_SPECIFICATIONS.md)
- **Database Schemas**: [docs/DATABASE_SCHEMAS.md](DATABASE_SCHEMAS.md)

---

## 🛠️ **Development Workflow**

### 1️⃣ **Setup Development Environment**
```bash
# Clone repository
git clone git@github.com:chanon-dev/e-commerce.git
cd ecommerce

# Install dependencies
npm install

# Start development services
./scripts/start-local.sh
```

### 2️⃣ **Create New Feature**
```bash
# Create feature branch
./scripts/branch-management.sh feature new-payment-method

# Make changes
# ... develop your feature ...

# Test changes
./scripts/test-all.sh

# Commit and push
git add .
git commit -m "Add new payment method"
git push origin feature/new-payment-method
```

### 3️⃣ **Deploy to Kubernetes**
```bash
# Deploy to development
./scripts/deploy-k8s.sh all

# Check deployment status
kubectl get pods -n ecommerce

# Access services
kubectl get svc -n ecommerce
```

---

## 🔍 **Troubleshooting**

### 🐛 **Common Issues**

#### Services Not Starting
```bash
# Check logs
kubectl logs -n ecommerce -l app=<service-name>

# Check resources
kubectl describe pod -n ecommerce <pod-name>

# Check events
kubectl get events -n ecommerce --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -n ecommerce -it <pod-name> -- curl http://postgres:5432

# Check secrets
kubectl get secrets -n ecommerce

# Verify configuration
kubectl get configmaps -n ecommerce
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n ecommerce

# Monitor metrics
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Check cache status
kubectl exec -n ecommerce -it <redis-pod> -- redis-cli info
```

---

## 📞 **Support & Contributing**

### 🤝 **How to Contribute**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### 📧 **Contact**
- **GitHub Issues**: [Create an issue](https://github.com/chanon-dev/e-commerce/issues)
- **Documentation Issues**: Update this README or create PR

### 📋 **Reporting Bugs**
When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Logs and error messages

---

## 📈 **Roadmap**

### 🎯 **Phase 1: Core Platform** ✅
- [x] Microservices Architecture
- [x] Basic Frontend Applications
- [x] Database Schemas
- [x] API Specifications
- [x] Kubernetes Deployment

### 🎯 **Phase 2: Advanced Features** 🟡
- [ ] Complete Health Dashboard
- [ ] Full Backend Implementation
- [ ] Advanced Monitoring
- [ ] Performance Optimization

### 🎯 **Phase 3: Production Ready** 📋
- [ ] Security Hardening
- [ ] Load Testing
- [ ] Disaster Recovery
- [ ] Documentation Complete

---

## 📊 **Project Statistics**

```
📁 Total Files: 200+
📄 Documentation: 15+ files
🔧 Services: 16 microservices
🌐 Public URLs: 20+ endpoints
💾 Databases: 4 types
🐳 Docker Images: 15+
☸️ Kubernetes Manifests: 50+
📝 Lines of Code: 10,000+
```

---

## 🎉 **Conclusion**

E-Commerce Platform เป็นระบบที่สมบูรณ์แบบสำหรับการพัฒนา e-commerce applications ด้วย microservices architecture ที่ทันสมัย พร้อมด้วยเอกสารประกอบที่ครบถ้วนและ production-ready deployment

**🚀 Happy Coding! 🎯**

---

**Last Updated**: $(date)  
**Version**: 1.0.0  
**Maintainer**: E-Commerce Development Team

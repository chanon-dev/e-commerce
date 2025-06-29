# 🌐 E-Commerce Platform - Public Access Links

## 📋 ภาพรวม

รายการ Public URLs สำหรับเข้าถึง E-Commerce Platform services ที่ deploy บน Kubernetes cluster

---

## 🌟 **หลัก E-Commerce Services**

### 🛒 **Customer Platform & Frontend**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Feature-based Frontend** | หน้าเว็บลูกค้าแบบ Feature-based | [http://aa228885c02654b6186c5d48ca7fbb46-1184786648.ap-southeast-1.elb.amazonaws.com](http://aa228885c02654b6186c5d48ca7fbb46-1184786648.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **Modern Frontend** | หน้าเว็บลูกค้าแบบ Modern | [http://a819795d902144abcaa394ace091ac52-1641229193.ap-southeast-1.elb.amazonaws.com](http://a819795d902144abcaa394ace091ac52-1641229193.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **E-commerce Web** | หน้าเว็บหลัก E-commerce | [http://a6e4d2b656a0c4bc6815953db98b0898-1372510800.ap-southeast-1.elb.amazonaws.com](http://a6e4d2b656a0c4bc6815953db98b0898-1372510800.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **Simple Web** | หน้าเว็บแบบง่าย | [http://a7a07163657f344fb85aac458a2ff084-1174559851.ap-southeast-1.elb.amazonaws.com](http://a7a07163657f344fb85aac458a2ff084-1174559851.ap-southeast-1.elb.amazonaws.com) | ✅ Online |

### 🔐 **Authentication & Login**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Login Page (Fixed)** | หน้า Login ที่แก้ไขแล้ว | [http://a036249071b7343758ec8d8278de6931-1170771124.ap-southeast-1.elb.amazonaws.com](http://a036249071b7343758ec8d8278de6931-1170771124.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **Login Page** | หน้า Login หลัก | [http://a47d16a82d1554e00b28925563bf519b-1627623854.ap-southeast-1.elb.amazonaws.com](http://a47d16a82d1554e00b28925563bf519b-1627623854.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **E-commerce Logout** | หน้า Logout | [http://a6481a6d4005d4fb2aa43e9eb57837a9-1665551472.ap-southeast-1.elb.amazonaws.com](http://a6481a6d4005d4fb2aa43e9eb57837a9-1665551472.ap-southeast-1.elb.amazonaws.com) | ✅ Online |

---

## 🔧 **Backend Services & APIs**

### 📦 **Product Services**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Product Service** | API จัดการสินค้าหลัก | [http://a2bd4923632ea4286b1435f186e2d9a5-1274902428.ap-southeast-1.elb.amazonaws.com](http://a2bd4923632ea4286b1435f186e2d9a5-1274902428.ap-southeast-1.elb.amazonaws.com) | ✅ Online |
| **Product Service Real** | API จัดการสินค้าแบบ Real | [http://abc84825dd8ab473eb360bc13385f50f-262596995.ap-southeast-1.elb.amazonaws.com:3001](http://abc84825dd8ab473eb360bc13385f50f-262596995.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |
| **Product Service Kafka** | API จัดการสินค้าพร้อม Kafka | [http://af7ae500034cd46f389454291c15b3d3-52056648.ap-southeast-1.elb.amazonaws.com:3001](http://af7ae500034cd46f389454291c15b3d3-52056648.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |
| **Product Service Real Kafka** | API จัดการสินค้า Real + Kafka | [http://ad4f7d029b8f7493ba5b86ad12a133b5-961163970.ap-southeast-1.elb.amazonaws.com:3001](http://ad4f7d029b8f7493ba5b86ad12a133b5-961163970.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |
| **Product Service Simple Kafka** | API จัดการสินค้าแบบง่าย + Kafka | [http://a619a8c44629e4341b3b1ae63efb5978-349316884.ap-southeast-1.elb.amazonaws.com:3001](http://a619a8c44629e4341b3b1ae63efb5978-349316884.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |
| **Simple Product API** | API สินค้าแบบง่าย | [http://ad01af46c39c84660a7f9fa074e12f4e-1900035719.ap-southeast-1.elb.amazonaws.com:3001](http://ad01af46c39c84660a7f9fa074e12f4e-1900035719.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |

### 🔄 **Event & Messaging Services**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Event Producer** | ผลิต Events สำหรับระบบ | [http://a82837613033d45a5b916ad91a7619e8-1388618219.ap-southeast-1.elb.amazonaws.com:3002](http://a82837613033d45a5b916ad91a7619e8-1388618219.ap-southeast-1.elb.amazonaws.com:3002) | ✅ Online |
| **Event Consumer** | รับ Events จากระบบ | [http://a65b7ab0592c34baaaab6df7942d32eb-384552744.ap-southeast-1.elb.amazonaws.com:3003](http://a65b7ab0592c34baaaab6df7942d32eb-384552744.ap-southeast-1.elb.amazonaws.com:3003) | ✅ Online |
| **Modern Backend** | Backend API แบบ Modern | [http://a05f185fafd924172a6f82c1ca2d10a0-2081762744.ap-southeast-1.elb.amazonaws.com:3001](http://a05f185fafd924172a6f82c1ca2d10a0-2081762744.ap-southeast-1.elb.amazonaws.com:3001) | ✅ Online |

---

## 🗄️ **Infrastructure Services**

### 🔐 **Security & Identity**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Keycloak** | Identity & Access Management | [http://ae6d617fb33b345dd82d57364a7a7f5d-5812463.ap-southeast-1.elb.amazonaws.com:8080](http://ae6d617fb33b345dd82d57364a7a7f5d-5812463.ap-southeast-1.elb.amazonaws.com:8080) | ✅ Online |
| **Vault** | Secrets Management | [http://a7592afb4b8994deebea8bbcd9f33b30-756003021.ap-southeast-1.elb.amazonaws.com:8200](http://a7592afb4b8994deebea8bbcd9f33b30-756003021.ap-southeast-1.elb.amazonaws.com:8200) | ✅ Online |

### 📊 **Message Queue & Monitoring**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Kafka** | Message Queue Service | [http://a8ad646f7819742ec9a97a28e411cd6a-593095924.ap-southeast-1.elb.amazonaws.com:9092](http://a8ad646f7819742ec9a97a28e411cd6a-593095924.ap-southeast-1.elb.amazonaws.com:9092) | ✅ Online |
| **Kafka UI** | Kafka Management Interface | [http://a485634b8d5424b399168dca5f0901f2-907048287.ap-southeast-1.elb.amazonaws.com:8080](http://a485634b8d5424b399168dca5f0901f2-907048287.ap-southeast-1.elb.amazonaws.com:8080) | ✅ Online |

---

## 🏥 **Health Dashboard & Monitoring**

### 📊 **Health Monitoring (กำลัง Deploy)**

| Service | Description | Public URL | Status |
|---------|-------------|------------|--------|
| **Health Dashboard** | ตรวจสอบสถานะ Services | ⏳ กำลัง Deploy | 🟡 Pending |
| **Health Dashboard Simple** | ตรวจสอบสถานะแบบง่าย | ⏳ กำลัง Deploy | 🟡 Pending |
| **Health Dashboard Ultra Light** | ตรวจสอบสถานะแบบเบา | ⏳ กำลัง Deploy | 🟡 Pending |

---

## 🚀 **วิธีการใช้งาน**

### 🌐 **การเข้าถึง Services:**

1. **คลิกลิงก์** ในตารางข้างต้นเพื่อเข้าถึง service ที่ต้องการ
2. **ตรวจสอบสถานะ** ผ่าน Health Dashboard (เมื่อพร้อมใช้งาน)
3. **ทดสอบ API** ผ่าน Product Services และ Backend APIs

### 🔐 **การ Login:**

- **Keycloak**: ใช้สำหรับ Single Sign-On (SSO)
- **Login Pages**: หน้า Login สำหรับ E-commerce Platform
- **Default Credentials**: ตรวจสอบใน documentation

### 📊 **การ Monitor:**

- **Kafka UI**: ตรวจสอบ message queues และ topics
- **Vault**: จัดการ secrets และ configurations
- **Health Dashboard**: ตรวจสอบสถานะ services ทั้งหมด

---

## ⚠️ **หมายเหตุสำคัญ**

### 🔒 **Security:**
- Links เหล่านี้เป็น **development/testing environment**
- **ไม่ควรใช้ในการผลิตจริง** โดยไม่มีการรักษาความปลอดภัย
- ควรตั้งค่า **authentication และ authorization** ก่อนใช้งานจริง

### 🌐 **Network:**
- Services ทำงานบน **AWS ELB (Elastic Load Balancer)**
- **Response time** อาจแตกต่างกันตามโหลดของระบบ
- บาง services อาจใช้เวลาในการ **warm up** เมื่อเข้าถึงครั้งแรก

### 🔄 **Availability:**
- Services อาจ **restart** หรือ **scale** ตามความต้องการ
- **LoadBalancer URLs** อาจเปลี่ยนแปลงเมื่อมีการ redeploy
- ตรวจสอบสถานะล่าสุดผ่าน `kubectl get svc -n ecommerce`

---

## 📞 **Support & Documentation**

### 📚 **เอกสารเพิ่มเติม:**
- [Kubernetes Deployment Guide](docs/KUBERNETES_DEPLOYMENT_GUIDE.md)
- [Health Dashboard Guide](docs/HEALTH_DASHBOARD_GUIDE.md)
- [Branching Strategy](docs/branching-strategy.md)

### 🛠️ **Commands สำหรับ Admin:**

```bash
# ตรวจสอบสถานะ services
kubectl get svc -n ecommerce | grep LoadBalancer

# ตรวจสอบ pods
kubectl get pods -n ecommerce

# ดู logs
kubectl logs -n ecommerce -l app=<service-name>

# Port forward สำหรับ testing
kubectl port-forward -n ecommerce svc/<service-name> <local-port>:<service-port>
```

---

## 🎯 **สรุป**

**E-Commerce Platform มี services ทั้งหมด 20+ services ที่พร้อมใช้งานผ่าน public URLs**

- ✅ **Frontend Applications**: 4 services
- ✅ **Backend APIs**: 7 services  
- ✅ **Infrastructure**: 4 services
- 🟡 **Health Dashboard**: 3 services (กำลัง deploy)

**🌟 แนะนำให้เริ่มต้นจาก Feature-based Frontend และ Product Services เพื่อทดสอบการทำงานของระบบ!**

---

**Last Updated:** $(date)  
**Environment:** Development/Testing  
**Cluster:** AWS EKS ap-southeast-1

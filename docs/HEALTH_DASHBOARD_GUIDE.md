# 🏥 คู่มือ Health Dashboard สำหรับ E-Commerce Platform

## 📋 ภาพรวม

Health Dashboard เป็นระบบตรวจสอบสถานะของ services ทั้งหมดในระบบ E-Commerce Platform แบบ real-time เพื่อให้ทีมพัฒนาและ DevOps สามารถติดตามสถานะการทำงานของระบบได้อย่างมีประสิทธิภาพ

## 🎯 วัตถุประสงค์

- **ตรวจสอบสถานะ Services**: ติดตามว่า services ไหนทำงานปกติ, มีปัญหา, หรือหยุดทำงาน
- **Real-time Monitoring**: อัพเดทสถานะแบบ real-time ทุก 30 วินาที
- **Visual Dashboard**: แสดงผลแบบกราฟิกที่เข้าใจง่าย
- **Response Time Tracking**: ติดตาม response time ของแต่ละ service
- **Alert System**: แจ้งเตือนเมื่อมี service ที่มีปัญหา

## 🏗️ สถาปัตยกรรม Health Dashboard

### 📊 Components

1. **Health Dashboard Frontend** - หน้าเว็บแสดงสถานะ
2. **Health Dashboard API** - API สำหรับตรวจสอบ services
3. **Service Health Checkers** - ตัวตรวจสอบสถานะแต่ละ service

### 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend API**: Node.js + Express
- **Container**: Docker + Kubernetes
- **Monitoring**: HTTP Health Checks
- **Styling**: Responsive CSS Grid + Flexbox

## 📋 Services ที่ตรวจสอบ

### 🌐 Frontend Applications (4 services)
- **Customer Platform** - หน้าเว็บลูกค้า (Port: 3000)
- **Customer Platform Light** - หน้าเว็บลูกค้า แบบเบา (Port: 80)
- **Admin Dashboard** - หน้าจัดการระบบ (Port: 3100)
- **Admin Dashboard Light** - หน้าจัดการระบบ แบบเบา (Port: 80)

### 🔧 Backend Services (10 services)
- **API Gateway** - ประตูหลักของ API (Port: 8080)
- **API Gateway Light** - ประตูหลักของ API แบบเบา (Port: 80)
- **Auth Service** - ระบบยืนยันตัวตน (Port: 3001)
- **User Service** - จัดการข้อมูลผู้ใช้ (Port: 3002)
- **Product Service** - จัดการสินค้า (Port: 3003)
- **Order Service** - จัดการคำสั่งซื้อ (Port: 3004)
- **Payment Service** - ระบบชำระเงิน (Port: 3005)
- **Cart Service** - ตะกร้าสินค้า (Port: 3006)
- **Inventory Service** - จัดการสต็อก (Port: 3007)
- **Shipping Service** - ระบบจัดส่ง (Port: 3008)
- **Promotion Service** - ระบบโปรโมชั่น (Port: 3009)
- **Review Service** - ระบบรีวิว (Port: 3010)
- **Notification Service** - ระบบแจ้งเตือน (Port: 3011)
- **Admin Service** - ระบบจัดการ (Port: 3012)

### 🗄️ Infrastructure Services (4 services)
- **Keycloak** - ระบบจัดการผู้ใช้ (Port: 8080)
- **Vault** - จัดการความลับ (Port: 8200)
- **Kafka** - Message Queue (Port: 9092)
- **Kafka UI** - Kafka Management (Port: 8080)

## 🚀 การ Deploy Health Dashboard

### วิธีที่ 1: Deploy แบบ Full Version

```bash
# Deploy Health Dashboard พร้อม API
kubectl apply -f k8s/deployments/monitoring/health-dashboard-deployment.yaml
kubectl apply -f k8s/deployments/monitoring/health-dashboard-api-deployment.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce | grep health-dashboard
kubectl get svc -n ecommerce | grep health-dashboard
```

### วิธีที่ 2: Deploy แบบ Simple Version

```bash
# Deploy Health Dashboard แบบง่าย
kubectl apply -f k8s/deployments/monitoring/health-dashboard-simple.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce | grep health-dashboard-simple
```

### วิธีที่ 3: Deploy แบบ Ultra Light Version

```bash
# Deploy Health Dashboard แบบเบาที่สุด
kubectl apply -f k8s/deployments/monitoring/health-dashboard-ultra-light.yaml

# ตรวจสอบสถานะ
kubectl get pods -n ecommerce | grep health-dashboard-ultra-light
```

## 🌐 การเข้าถึง Health Dashboard

### ผ่าน LoadBalancer

```bash
# ดู External IP ของ Health Dashboard
kubectl get svc -n ecommerce health-dashboard-ultra-light

# เข้าถึงผ่าน External IP
# http://<EXTERNAL-IP>/
```

### ผ่าน Port Forward

```bash
# Port forward สำหรับ testing
kubectl port-forward -n ecommerce svc/health-dashboard-ultra-light 8080:80

# เข้าถึงผ่าน localhost
# http://localhost:8080
```

### ผ่าน NodePort

```bash
# ดู NodePort
kubectl get svc -n ecommerce health-dashboard-ultra-light

# เข้าถึงผ่าน Node IP + NodePort
# http://<NODE-IP>:<NODE-PORT>
```

## 📊 การใช้งาน Health Dashboard

### 🎨 หน้าจอหลัก

Dashboard แสดงข้อมูลหลัก 4 ส่วน:

1. **Status Overview Cards**
   - Total Services: จำนวน services ทั้งหมด
   - Online Services: จำนวน services ที่ทำงานปกติ
   - Warning Services: จำนวน services ที่มีปัญหาเล็กน้อย
   - Offline Services: จำนวน services ที่หยุดทำงาน

2. **Service Categories**
   - Frontend Applications
   - Backend Services
   - Infrastructure Services
   - Monitoring Services

3. **Service Status Indicators**
   - 🟢 **Online**: Service ทำงานปกติ (response time < 1000ms)
   - 🟡 **Warning**: Service ตอบสนองช้า (response time > 1000ms)
   - 🔴 **Offline**: Service ไม่ตอบสนอง หรือ error

4. **Real-time Information**
   - Response time ของแต่ละ service
   - Last updated timestamp
   - Auto refresh ทุก 30 วินาที

### 🔄 การ Refresh ข้อมูล

- **Auto Refresh**: ระบบจะ refresh อัตโนมัติทุก 30 วินาที
- **Manual Refresh**: กดปุ่ม "🔄 Refresh" ที่มุมขวาล่าง
- **Page Reload**: กด F5 หรือ Ctrl+R

## 🔧 API Endpoints (สำหรับ Full Version)

### Health Check API

```bash
# ตรวจสอบสถานะ API
GET /health
Response: {"status": "ok", "timestamp": "2024-01-01T00:00:00.000Z"}

# ดูรายการ services ทั้งหมด
GET /api/services
Response: {
  "frontend": [...],
  "backend": [...],
  "infrastructure": [...]
}

# ตรวจสอบสถานะ services ทั้งหมด
GET /api/health/all
Response: {
  "summary": {
    "total": 16,
    "online": 12,
    "warning": 2,
    "offline": 2
  },
  "services": {...}
}

# ตรวจสอบสถานะตาม category
GET /api/health/frontend
GET /api/health/backend
GET /api/health/infrastructure

# ตรวจสอบสถานะ service เฉพาะ
GET /api/health/service/api-gateway
```

## 🛠️ การปรับแต่งและ Configuration

### การเพิ่ม Service ใหม่

แก้ไขไฟล์ ConfigMap:

```yaml
# เพิ่มใน k8s/deployments/monitoring/health-dashboard-deployment.yaml
services:
  backend:
    - name: 'New Service'
      url: 'new-service:3013'
      port: '3013'
      description: 'คำอธิบาย service ใหม่'
```

### การปรับ Refresh Interval

แก้ไขใน JavaScript:

```javascript
// เปลี่ยนจาก 30 วินาที เป็น 60 วินาที
setInterval(checkAllServices, 60000);
```

### การปรับ Resource Limits

```yaml
resources:
  requests:
    memory: "16Mi"
    cpu: "10m"
  limits:
    memory: "32Mi"
    cpu: "20m"
```

## 🔍 การ Troubleshooting

### ปัญหา: Dashboard ไม่แสดงผล

```bash
# ตรวจสอบ pod status
kubectl get pods -n ecommerce | grep health-dashboard

# ตรวจสอบ logs
kubectl logs -n ecommerce -l app=health-dashboard-ultra-light

# ตรวจสอบ service
kubectl get svc -n ecommerce | grep health-dashboard
```

### ปัญหา: Service แสดงสถานะผิด

```bash
# ตรวจสอบ service endpoint
kubectl get endpoints -n ecommerce <service-name>

# ทดสอบการเชื่อมต่อ
kubectl exec -n ecommerce -it <pod-name> -- curl http://<service-name>:<port>/health
```

### ปัญหา: Dashboard ไม่ Auto Refresh

- ตรวจสอบ JavaScript console ใน browser
- ตรวจสอบ network connectivity
- ลอง manual refresh

## 📈 การ Monitor และ Alerting

### การตั้งค่า Alerts

```bash
# สร้าง alert เมื่อ service offline
# (ต้องมี Prometheus + Alertmanager)

# ตัวอย่าง alert rule
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.instance }} is down"
```

### การ Export Metrics

```javascript
// เพิ่มใน Health Dashboard API
app.get('/metrics', (req, res) => {
  // Export metrics ในรูปแบบ Prometheus
  res.set('Content-Type', 'text/plain');
  res.send(`
    # HELP ecommerce_service_up Service availability
    # TYPE ecommerce_service_up gauge
    ecommerce_service_up{service="api-gateway"} 1
    ecommerce_service_up{service="auth-service"} 0
  `);
});
```

## 🎨 การปรับแต่ง UI

### การเปลี่ยนสี Theme

```css
/* เปลี่ยนสีหลัก */
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
}
```

### การเพิ่ม Animation

```css
/* เพิ่ม animation สำหรับ status indicator */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
  100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
}
```

## 📱 Responsive Design

Dashboard รองรับการแสดงผลบนอุปกรณ์ต่างๆ:

- **Desktop**: แสดงแบบ grid 3-4 columns
- **Tablet**: แสดงแบบ grid 2 columns
- **Mobile**: แสดงแบบ single column

## 🔐 Security Considerations

### การรักษาความปลอดภัย

1. **Network Policies**: จำกัดการเข้าถึงเฉพาะ pods ที่จำเป็น
2. **RBAC**: ตั้งค่า Role-Based Access Control
3. **TLS**: ใช้ HTTPS สำหรับการเข้าถึงจากภายนอก
4. **Authentication**: เพิ่ม authentication ถ้าจำเป็น

```yaml
# ตัวอย่าง Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: health-dashboard-netpol
spec:
  podSelector:
    matchLabels:
      app: health-dashboard-ultra-light
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: monitoring
```

## 📊 Performance Optimization

### การ Optimize Performance

1. **Caching**: Cache ผลลัพธ์ health check
2. **Batch Requests**: รวม health check requests
3. **Lazy Loading**: โหลดข้อมูลเมื่อจำเป็น
4. **Compression**: ใช้ gzip compression

```javascript
// ตัวอย่าง caching
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function getCachedHealthStatus(service) {
  const cacheKey = service.name;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await checkServiceHealth(service);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

## 🚀 การ Scale และ High Availability

### การ Scale Health Dashboard

```bash
# Scale up replicas
kubectl scale deployment health-dashboard-ultra-light --replicas=3 -n ecommerce

# ตั้งค่า HPA
kubectl autoscale deployment health-dashboard-ultra-light --cpu-percent=70 --min=1 --max=5 -n ecommerce
```

### การตั้งค่า High Availability

```yaml
# เพิ่ม anti-affinity
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - health-dashboard-ultra-light
              topologyKey: kubernetes.io/hostname
```

## 📋 Best Practices

### การใช้งานที่ดี

1. **Regular Monitoring**: ตรวจสอบ dashboard เป็นประจำ
2. **Alert Setup**: ตั้งค่า alert สำหรับ critical services
3. **Documentation**: บันทึกการเปลี่ยนแปลง services
4. **Testing**: ทดสอบ health checks เป็นประจำ
5. **Backup**: สำรองข้อมูล configuration

### การ Maintenance

```bash
# ตรวจสอบ resource usage
kubectl top pods -n ecommerce | grep health-dashboard

# ตรวจสอบ logs
kubectl logs -n ecommerce -l app=health-dashboard-ultra-light --tail=100

# อัพเดท configuration
kubectl apply -f k8s/deployments/monitoring/health-dashboard-ultra-light.yaml
```

## 🎯 สรุป

Health Dashboard เป็นเครื่องมือสำคัญสำหรับการติดตามสถานะของระบบ E-Commerce Platform ที่ช่วยให้ทีมสามารถ:

- **ตรวจสอบสถานะ** services ทั้งหมดในที่เดียว
- **ติดตาม performance** และ response time
- **รับแจ้งเตือน** เมื่อมีปัญหา
- **วิเคราะห์ trends** และ patterns
- **แก้ไขปัญหา** ได้อย่างรวดเร็ว

### 🔗 Links และ Resources

- **Dashboard URL**: จะได้รับหลังจาก deploy สำเร็จ
- **API Documentation**: `/api/` endpoints
- **Source Code**: `k8s/deployments/monitoring/`
- **Configuration**: ConfigMaps ใน Kubernetes

---

**🎉 Health Dashboard พร้อมใช้งานแล้ว! ติดตามสถานะระบบของคุณได้อย่างมีประสิทธิภาพ! 🚀**

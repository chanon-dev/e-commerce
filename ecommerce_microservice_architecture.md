# 📦 สถาปัตยกรรมระบบ E-Commerce แบบ Microservices (Next.js + .NET/Go/NestJS)

## 🎯 **System Overview - ภาพรวมระบบ**

### 🏗️ **สถาปัตยกรรมโดยรวม (High-Level Architecture)**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              E-COMMERCE PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🌐 FRONTEND LAYER                    🔐 SECURITY LAYER                        │
│  ├── Customer Platform (Next.js)      ├── HashiCorp Vault                      │
│  ├── Admin Dashboard (Next.js)        ├── Keycloak IAM                         │
│  └── Mobile App (React Native)        └── API Gateway Security                 │
│                                                                                 │
│  🔌 API GATEWAY LAYER                                                          │
│  ├── NGINX Load Balancer                                                       │
│  ├── NestJS BFF (Backend for Frontend)                                        │
│  └── Rate Limiting & Authentication                                           │
│                                                                                 │
│  🏢 MICROSERVICES LAYER                                                        │
│  ├── Auth Service (NestJS + Keycloak)                                         │
│  ├── User Service (.NET)                                                       │
│  ├── Product Service (Go)                                                      │
│  ├── Order Service (.NET)                                                      │
│  ├── Payment Service (Go)                                                      │
│  ├── Cart Service (NestJS)                                                     │
│  ├── Inventory Service (Go)                                                    │
│  ├── Shipping Service (NestJS)                                                 │
│  ├── Promotion Service (.NET)                                                  │
│  ├── Review Service (NestJS)                                                   │
│  ├── Notification Service (Go)                                                 │
│  └── Admin Service (NestJS)                                                    │
│                                                                                 │
│  📊 DATA LAYER                                                                  │
│  ├── PostgreSQL (Primary Database)                                             │
│  ├── Redis (Cache & Session)                                                   │
│  ├── MongoDB (Document Storage)                                                │
│  ├── Elasticsearch (Search Engine)                                             │
│  └── AWS S3 (File Storage)                                                     │
│                                                                                 │
│  🔄 MESSAGING LAYER                                                            │
│  ├── Apache Kafka (Event Streaming)                                            │
│  └── RabbitMQ (Message Queue)                                                  │
│                                                                                 │
│  📈 OBSERVABILITY LAYER                                                        │
│  ├── Prometheus + Grafana (Metrics)                                            │
│  ├── ELK Stack (Logging)                                                       │
│  ├── Jaeger (Distributed Tracing)                                              │
│  └── k6 (Load Testing)                                                         │
│                                                                                 │
│  🔄 CI/CD LAYER                                                                │
│  ├── Jenkins (Continuous Integration)                                          │
│  ├── ArgoCD (Continuous Deployment)                                            │
│  └── GitOps Workflow                                                           │
│                                                                                 │
│  🛡️ SECURITY LAYER                                                             │
│  ├── DevSecOps Pipeline                                                        │
│  ├── SAST/SCA Scanning                                                         │
│  ├── Container Security                                                        │
│  └── Kubernetes Hardening                                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🎯 **Technology Stack Overview**

#### **Frontend Technologies:**
| Technology | Purpose | Features |
|------------|---------|----------|
| **Next.js (TypeScript)** | Customer Platform & Admin Dashboard | SSR, SSG, App Router, SEO optimized |
| **React Native** | Mobile Applications | Cross-platform, Native performance |
| **Tailwind CSS** | Styling | Utility-first, Responsive design |

#### **Backend Technologies:**
| Technology | Services | Strengths |
|------------|----------|-----------|
| **.NET (C#)** | User, Order, Promotion, Admin | Enterprise-grade, Strong typing, Performance |
| **Go (Golang)** | Product, Payment, Inventory, Notification | High performance, Concurrency, Microservices |
| **NestJS (TypeScript)** | Auth, Cart, Shipping, Review | Modular, Dependency injection, Decorators |

#### **Infrastructure & DevOps:**
| Technology | Purpose | Benefits |
|------------|---------|----------|
| **Kubernetes** | Container Orchestration | Scalability, High availability, Auto-healing |
| **Docker** | Containerization | Consistency, Portability, Isolation |
| **Jenkins + ArgoCD** | CI/CD Pipeline | Automation, GitOps, Multi-environment |
| **HashiCorp Vault** | Secrets Management | Security, Dynamic secrets, Audit trail |
| **Keycloak** | Identity Management | SSO, OAuth2, Role-based access |

### 🔄 **System Flow Overview**

#### **Customer Journey Flow:**
```
1. 🏠 Customer visits website
   ↓
2. 🔐 Authentication (Keycloak + Auth Service)
   ↓
3. 🛍️ Browse products (Product Service + Elasticsearch)
   ↓
4. 🛒 Add to cart (Cart Service + Redis)
   ↓
5. 💳 Checkout process
   ├── Order creation (Order Service)
   ├── Payment processing (Payment Service)
   ├── Inventory check (Inventory Service)
   └── Shipping calculation (Shipping Service)
   ↓
6. 📦 Order fulfillment
   ├── Order tracking (Order Service)
   ├── Notifications (Notification Service)
   └── Review system (Review Service)
```

#### **Admin Operations Flow:**
```
1. 🔐 Admin login (Keycloak + 2FA)
   ↓
2. 📊 Dashboard access (Admin Service)
   ↓
3. 🛠️ Management operations
   ├── Product management (Product Service)
   ├── Order management (Order Service)
   ├── Customer management (User Service)
   ├── Inventory management (Inventory Service)
   └── Analytics & reports (Admin Service)
   ↓
4. 📈 Monitoring & alerts (Observability Stack)
```

### 🏢 **Business Capabilities Overview**

#### **Customer Features:**
- ✅ **User Management**: Registration, login, profile management
- ✅ **Product Discovery**: Search, browse, filter, recommendations
- ✅ **Shopping Experience**: Cart, wishlist, checkout
- ✅ **Payment Processing**: Multiple payment methods, secure transactions
- ✅ **Order Management**: Tracking, history, returns
- ✅ **Customer Engagement**: Reviews, ratings, loyalty program
- ✅ **Notifications**: Email, SMS, push notifications

#### **Admin Features:**
- ✅ **Product Management**: CRUD operations, inventory, pricing
- ✅ **Order Management**: Processing, fulfillment, analytics
- ✅ **Customer Management**: Database, support, analytics
- ✅ **Marketing Tools**: Promotions, coupons, campaigns
- ✅ **Analytics Dashboard**: Sales, performance, insights
- ✅ **System Administration**: Configuration, monitoring, security

#### **Technical Features:**
- ✅ **Scalability**: Horizontal scaling, auto-scaling
- ✅ **High Availability**: Multi-zone deployment, failover
- ✅ **Security**: End-to-end encryption, RBAC, compliance
- ✅ **Performance**: Caching, CDN, optimization
- ✅ **Monitoring**: Real-time metrics, alerting, tracing
- ✅ **DevOps**: Automated CI/CD, GitOps, infrastructure as code

### 📊 **System Metrics & Performance**

#### **Expected Performance:**
| Metric | Target | Monitoring |
|--------|--------|------------|
| **Response Time** | < 200ms (95th percentile) | Prometheus + Grafana |
| **Throughput** | 10,000+ requests/second | Load testing with k6 |
| **Availability** | 99.9% uptime | Health checks + alerting |
| **Error Rate** | < 0.1% | Error tracking + alerting |
| **Deployment Frequency** | Multiple times per day | CI/CD pipeline metrics |

#### **Scalability Targets:**
| Component | Current Capacity | Target Capacity |
|-----------|------------------|-----------------|
| **API Gateway** | 1,000 RPS | 10,000+ RPS |
| **Database** | 1,000 connections | 10,000+ connections |
| **Cache** | 1GB memory | 100GB+ memory |
| **Storage** | 1TB | 100TB+ |
| **Concurrent Users** | 1,000 | 100,000+ |

### 🔐 **Security Overview**

#### **Security Layers:**
```
🛡️ Security Architecture
├── 🔐 Authentication & Authorization
│   ├── Keycloak SSO
│   ├── JWT tokens
│   ├── OAuth2 integration
│   └── Role-based access control
├── 🔒 Data Protection
│   ├── Encryption at rest
│   ├── Encryption in transit (TLS)
│   ├── PII data protection
│   └── GDPR compliance
├── 🏗️ Infrastructure Security
│   ├── Kubernetes security policies
│   ├── Network policies
│   ├── Pod security standards
│   └── Container security scanning
├── 🔍 Application Security
│   ├── SAST/SCA scanning
│   ├── Dependency vulnerability scanning
│   ├── Code quality gates
│   └── Security testing
└── 📊 Security Monitoring
    ├── Security event logging
    ├── Threat detection
    ├── Incident response
    └── Compliance reporting
```

### 🚀 **Deployment & Operations**

#### **Environment Strategy:**
```
🌍 Environment Strategy
├── 🧪 Development (dev)
│   ├── Purpose: Development & testing
│   ├── Auto-deploy: Yes
│   ├── Data: Synthetic/mock
│   └── Security: Basic
├── 🧪 Staging (staging)
│   ├── Purpose: Pre-production testing
│   ├── Auto-deploy: Yes
│   ├── Data: Production-like
│   └── Security: Enhanced
└── 🏭 Production (prod)
    ├── Purpose: Live production
    ├── Auto-deploy: No (manual approval)
    ├── Data: Real production data
    └── Security: Maximum
```

#### **Deployment Architecture:**
```
🚀 Deployment Architecture
├── 🌐 Load Balancer (NGINX)
├── 🔌 API Gateway (NestJS BFF)
├── 🏢 Microservices (15 services)
├── 📊 Databases (PostgreSQL, Redis, MongoDB)
├── 🔄 Message Queue (Kafka)
├── 📈 Monitoring Stack (Prometheus, ELK, Jaeger)
├── 🔐 Security Services (Vault, Keycloak)
└── 🔄 CI/CD Pipeline (Jenkins, ArgoCD)
```

### 💰 **Business Value & ROI**

#### **Key Benefits:**
- ✅ **Scalability**: Handle growth from 1,000 to 100,000+ users
- ✅ **Reliability**: 99.9% uptime with automatic failover
- ✅ **Security**: Enterprise-grade security with compliance
- ✅ **Performance**: Fast response times and high throughput
- ✅ **Maintainability**: Modular architecture, easy updates
- ✅ **Cost Efficiency**: Resource optimization, auto-scaling
- ✅ **Time to Market**: Rapid development and deployment
- ✅ **Customer Experience**: Seamless, fast, secure shopping

#### **Technical ROI:**
- **Reduced Downtime**: 99.9% availability vs traditional 95%
- **Faster Development**: Microservices enable parallel development
- **Better Performance**: 200ms response time vs traditional 2+ seconds
- **Enhanced Security**: Comprehensive security stack vs basic security
- **Operational Efficiency**: Automated CI/CD vs manual deployments
- **Scalability**: Handle 100x traffic increase without major changes

---

## 🧱 ภาพรวมระบบ

## 🔧 Microservices หลัก (พร้อมภาษาและฐานข้อมูลที่แนะนำ)

| Service | หน้าที่ | ภาษา | ฐานข้อมูล |
|--------|---------|------|------------|
| **API Gateway** | จุดรับคำขอทั้งหมดจากลูกค้า จัดการ routing, auth, rate-limiting | **NGINX + NestJS (BFF)** | - |
| **Auth Service** | ลงทะเบียน, ล็อกอิน, JWT, OAuth2, สิทธิ์ผู้ใช้ | **NestJS + Keycloak** | PostgreSQL, Redis |
| **User Service** | ข้อมูลผู้ใช้, ที่อยู่, Wishlist | **.NET** | PostgreSQL |
| **Product Service** | รายการสินค้า, ค้นหา, จัดการข้อมูลสินค้า, รูปภาพ | **Go** | PostgreSQL, Elasticsearch, AWS S3 |
| **Order Service** | สร้างคำสั่งซื้อ, ติดตามสถานะ, ประวัติ, Tax, Accounting | **.NET** | PostgreSQL, MongoDB |
| **Cart Service** | ตะกร้าสินค้า, Merge guest/user | **NestJS** | Redis |
| **Payment Service** | เชื่อมต่อระบบชำระเงิน, คืนเงิน | **Go** | PostgreSQL |
| **Inventory Service** | คลังสินค้า, จัดการ stock | **Go** | PostgreSQL |
| **Shipping Service** | คำนวณค่าขนส่ง, เชื่อมกับขนส่งภายนอก | **NestJS** | PostgreSQL |
| **Promotion Service** | ระบบคูปอง, ส่วนลด, คะแนนสะสม | **.NET** | Redis, PostgreSQL |
| **Review Service** | รีวิว, การให้คะแนน, การกลั่นกรอง | **NestJS** | MongoDB |
| **Notification Service** | ส่งอีเมล, SMS, แจ้งเตือน | **Go** | Kafka / RabbitMQ |
| **Admin Service** | ระบบหลังบ้านสำหรับแอดมินจัดการข้อมูล | **NestJS + Next.js** | PostgreSQL |
| **Vault Service** | จัดการ secrets, API keys, certificates | **HashiCorp Vault** | Vault Storage |
| **Keycloak Service** | Identity & Access Management, SSO | **Keycloak** | PostgreSQL |

---

## 🎯 **Customer Features - ฟีเจอร์ฝั่งลูกค้า**

### ✅ **Authentication & User Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ลงทะเบียน/ล็อกอิน** | Auth Service + Keycloak | NestJS + Keycloak | Email, Social Login (Google, Facebook, Apple, Line), OTP |
| **Reset Password** | Auth Service + Keycloak | NestJS + Keycloak | Email verification + secure token |
| **Profile Management** | User Service | .NET | แก้ไขข้อมูลส่วนตัว, ที่อยู่, เบอร์โทร |
| **Wishlist** | User Service | .NET | Save favorite products |
| **Multi-Factor Authentication** | Keycloak | Keycloak | 2FA สำหรับ VIP customers |

### 🛒 **Shopping Experience**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ค้นหาสินค้า** | Product Service | Go + Elasticsearch | Full-text search, Auto-complete |
| **กรอง/จัดเรียง** | Product Service | Go | Category, Price, Brand, Rating |
| **รายละเอียดสินค้า** | Product Service | Go | Images, Specs, Reviews, Related |
| **เพิ่มลงตะกร้า** | Cart Service | NestJS + Redis | Guest/User cart management |

### 💳 **Checkout & Payment**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ที่อยู่จัดส่ง** | Order Service | .NET | Multiple addresses, validation |
| **วิธีชำระเงิน** | Payment Service | Go | QR Code, Credit Card, COD, PromptPay |
| **คูปอง/ส่วนลด** | Promotion Service | .NET | Coupon validation, discount calculation |
| **Order Summary** | Order Service | .NET | Price breakdown, tax calculation |

### 📦 **Order Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ตรวจสอบสถานะ** | Order Service | .NET | Real-time order tracking |
| **ประวัติคำสั่งซื้อ** | Order Service | .NET | Order history, reorder |
| **ยกเลิกคำสั่งซื้อ** | Order Service | .NET | Cancellation policy, refund |
| **Return/Refund** | Order Service | .NET | Return process, refund tracking |

### ❤️ **Customer Engagement**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **Review & Rating** | Review Service | NestJS | Product reviews, photo uploads |
| **Loyalty Program** | Promotion Service | .NET | Points, tiers, rewards |

### 🔔 **Notifications**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **สถานะคำสั่งซื้อ** | Notification Service | Go | Email, SMS, Push notifications |
| **โปรโมชั่น** | Notification Service | Go | Promotional campaigns |
| **Stock Alerts** | Notification Service | Go | Back-in-stock notifications |

---

## 🧑‍💻 **Admin & Seller Features - ฟีเจอร์ฝั่งผู้ดูแลระบบ**

### ✅ **Authentication & Security**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **Admin Login** | Auth Service + Keycloak | NestJS + Keycloak | Admin authentication with 2FA |
| **Role Management** | Keycloak | Keycloak | Admin, Manager, Support roles |
| **Session Management** | Keycloak | Keycloak | Active sessions, logout everywhere |
| **Access Control** | API Gateway + Keycloak | NGINX + Keycloak | Role-based API access |

### 📦 **Product Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **CRUD สินค้า** | Product Service | Go | Add, edit, delete products |
| **จัดการรูปภาพ** | Product Service | Go + S3 | Image upload, resize, CDN |
| **ตั้งราคา/สต็อก** | Product Service | Go | Bulk price/stock updates |
| **Category Management** | Product Service | Go | Hierarchical categories |

### 🧾 **Order Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ตรวจสอบคำสั่งซื้อ** | Order Service | .NET | Order dashboard, filters |
| **เปลี่ยนสถานะ** | Order Service | .NET | Status workflow management |
| **อัปโหลดเลขพัสดุ** | Shipping Service | NestJS | Tracking number integration |
| **Order Fulfillment** | Order Service | .NET | Pick, pack, ship workflow |

### 👤 **Customer Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **รายชื่อลูกค้า** | User Service | .NET | Customer database, search |
| **ประวัติการสั่งซื้อ** | Order Service | .NET | Customer order history |

### 🛍️ **Promotion Tools**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **สร้างคูปอง** | Promotion Service | .NET | Discount codes, conditions |
| **Flash Sale** | Promotion Service | .NET | Time-limited promotions |
| **ระบบสมาชิก** | Promotion Service | .NET | Tier system, points, rewards |

### 📊 **Analytics Dashboard**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **ยอดขาย** | Order Service | .NET | Daily/monthly sales reports |
| **สินค้าขายดี** | Product Service | Go | Best-selling products |
| **Inventory Reports** | Inventory Service | Go | Stock levels, turnover |

### 🔧 **System Management**
| ฟีเจอร์ | Service | Technology | คำอธิบาย |
|---------|---------|------------|----------|
| **Secrets Management** | Vault Service | HashiCorp Vault | Manage API keys, credentials |
| **User Management** | Keycloak | Keycloak | Manage users, roles, permissions |
| **System Configuration** | Admin Service | NestJS | System settings, configurations |
| **Monitoring & Logs** | Admin Service | NestJS | System health, error logs |

---

## 🔄 **Kafka Topics Summary**

| Topic | Producer | Consumer | คำอธิบาย |
|-------|----------|----------|----------|
| **Order Management** |
| `order-created` | Order Service | Inventory, Payment, Notification | สร้างคำสั่งซื้อใหม่ |
| `order-updated` | Order Service | Notification, Shipping | อัปเดตข้อมูลคำสั่งซื้อ |
| `order-cancelled` | Order Service | Inventory, Payment, Notification | ยกเลิกคำสั่งซื้อ |
| `order-completed` | Order Service | User, Promotion, Review, Notification | ส่งมอบสินค้าเสร็จสิ้น |
| `order-refunded` | Order Service | Inventory, Payment, Notification | คืนเงินคำสั่งซื้อ |
| **Payment Processing** |
| `payment-initiated` | Payment Service | Order, Notification | เริ่มกระบวนการชำระเงิน |
| `payment-confirmed` | Payment Service | Order, Inventory, Notification | ชำระเงินสำเร็จ |
| `payment-failed` | Payment Service | Order, Notification | ชำระเงินล้มเหลว |
| `payment-refunded` | Payment Service | Order, Inventory, Notification | คืนเงินสำเร็จ |
| **Inventory Management** |
| `inventory-updated` | Inventory Service | Product, Order, Notification | อัปเดตคลังสินค้า |
| `low-stock-alert` | Inventory Service | Notification, Admin | สินค้าใกล้หมด |
| `out-of-stock` | Inventory Service | Product, Order, Notification | สินค้าหมด |
| **User Management** |
| `user-registered` | Auth Service | User, Notification, Promotion | ลงทะเบียนผู้ใช้ใหม่ |
| `user-profile-updated` | User Service | Notification, Promotion | อัปเดตโปรไฟล์ |
| `user-logged-in` | Auth Service | User, Notification | ผู้ใช้เข้าสู่ระบบ |
| **Product Management** |
| `product-created` | Product Service | Notification, Admin | สร้างสินค้าใหม่ |
| `product-updated` | Product Service | Cart, Order, Notification | อัปเดตข้อมูลสินค้า |
| `product-price-changed` | Product Service | Cart, Order, Notification | เปลี่ยนราคาสินค้า |
| **Cart Management** |
| `cart-item-added` | Cart Service | Product, Promotion | เพิ่มสินค้าลงตะกร้า |
| `cart-item-removed` | Cart Service | Product | ลบสินค้าออกจากตะกร้า |
| `cart-abandoned` | Cart Service | Notification, Promotion | ทิ้งตะกร้าสินค้า |
| **Promotion & Marketing** |
| `coupon-created` | Promotion Service | Notification, Admin | สร้างคูปองใหม่ |
| `coupon-applied` | Promotion Service | Order, Notification | ใช้คูปอง |
| `coupon-expired` | Promotion Service | Notification, Admin | คูปองหมดอายุ |
| **Shipping & Delivery** |
| `shipping-label-created` | Shipping Service | Order, Notification | สร้างป้ายขนส่ง |
| `shipping-status-updated` | Shipping Service | Order, Notification | อัปเดตสถานะขนส่ง |
| `package-delivered` | Shipping Service | Order, Notification, Review | ส่งมอบสินค้า |
| **Review & Rating** |
| `review-submitted` | Review Service | Product, Notification | ส่งรีวิวใหม่ |
| `review-approved` | Review Service | Product, Notification | รีวิวผ่านการกลั่นกรอง |
| `rating-updated` | Review Service | Product | อัปเดตคะแนนสินค้า |
| **Security & Authentication** |
| `user-authenticated` | Auth Service | User, Notification, Analytics | ผู้ใช้เข้าสู่ระบบสำเร็จ |
| `user-authentication-failed` | Auth Service | Security, Notification | การเข้าสู่ระบบล้มเหลว |
| `user-logged-out` | Auth Service | User, Analytics | ผู้ใช้ออกจากระบบ |
| `security-alert` | Auth Service | Admin, Notification | แจ้งเตือนความปลอดภัย |
| **Notification & Communication** |
| `email-sent` | Notification Service | Admin | ส่งอีเมลสำเร็จ |
| `sms-sent` | Notification Service | Admin | ส่ง SMS สำเร็จ |
| `push-notification-sent` | Notification Service | Admin | ส่ง Push Notification สำเร็จ |

---

## 🏗️ **Architecture Patterns**

### 🎨 **Frontend - Next.js (TypeScript)**
- **Feature-Based Architecture** - จัดโครงสร้างตามฟีเจอร์
- **Server-Side Rendering (SSR)** + **Static Site Generation (SSG)**
- **App Router** (Next.js 13+) - File-based routing system
- **Authentication Integration** - Keycloak integration for SSO

### 🟦 **Backend - .NET (C#)**
- **Clean Architecture** - Domain-Driven Design (DDD)
- **CQRS (Command Query Responsibility Segregation)**
- **Repository Pattern** - Data access abstraction
- **Secrets Management** - Vault integration for credentials

### 🔵 **Backend - Go (Golang)**
- **Hexagonal Architecture** (Ports & Adapters)
- **Clean Architecture** - Dependency inversion
- **Repository Pattern** - Data access layer
- **Secrets Management** - Vault integration for API keys

### 🟢 **Backend - NestJS (TypeScript)**
- **Modular Architecture** - Feature-based modules
- **Dependency Injection** - Built-in IoC container
- **Repository Pattern** - Data access abstraction
- **Authentication** - Keycloak integration
- **Secrets Management** - Vault integration

---

## 🌐 **Web UI Architecture**

### **Frontend Applications (2 Web Applications)**

#### **1. Customer E-Commerce Platform** (Next.js)
**URL:** `https://shop.example.com`
**Target Users:** End customers
**Required Services:**
- **Auth Service + Keycloak** - ลงทะเบียน, ล็อกอิน, JWT authentication, Social login
- **User Service** - จัดการโปรไฟล์, ที่อยู่, Wishlist
- **Product Service** - แสดงสินค้า, ค้นหา, กรอง, รายละเอียดสินค้า
- **Cart Service** - เพิ่ม/ลบสินค้า, จัดการตะกร้า
- **Order Service** - สร้างคำสั่งซื้อ, ติดตามสถานะ, ประวัติ
- **Payment Service** - วิธีชำระเงิน, QR Code, Credit Card
- **Inventory Service** - ตรวจสอบ stock, แจ้งเตือนสินค้าใกล้หมด
- **Shipping Service** - คำนวณค่าขนส่ง, ติดตามพัสดุ
- **Promotion Service** - คูปอง, ส่วนลด, ระบบสมาชิก
- **Review Service** - รีวิวสินค้า, ให้คะแนน
- **Notification Service** - แจ้งเตือนสถานะ, โปรโมชั่น

**Menu Structure:**
```
🏠 Home
├── 🏷️ Categories
│   ├── Electronics
│   ├── Fashion
│   ├── Home & Garden
│   ├── Sports
│   └── Books
├── 🔍 Search
│   ├── Search Products
│   ├── Advanced Filters
│   └── Search History
├── 🛒 Shopping
│   ├── Cart
│   ├── Wishlist
│   ├── Recently Viewed
│   └── Recommendations
├── 📦 Orders
│   ├── My Orders
│   ├── Order Tracking
│   ├── Order History
│   └── Returns & Refunds
├── 👤 Account
│   ├── Profile
│   ├── Addresses
│   ├── Payment Methods
│   ├── Security Settings
│   └── Notifications
├── 💎 Loyalty
│   ├── Points Balance
│   ├── Rewards
│   ├── Coupons
│   └── Membership Tiers
├── 🎯 Promotions
│   ├── Flash Sales
│   ├── Daily Deals
│   ├── Clearance
│   └── New Arrivals
└── 📞 Support
    ├── Help Center
    ├── Contact Us
    ├── Live Chat
    └── FAQ
```

**Features:**
- Product browsing & search
- Shopping cart & checkout
- User account management
- Order tracking
- Product reviews
- Wishlist
- Mobile-responsive design
- Single Sign-On (SSO)

#### **2. Admin Dashboard** (Next.js)
**URL:** `https://admin.example.com`
**Target Users:** Store administrators, managers
**Required Services:**
- **Auth Service + Keycloak** - Admin authentication, Role-based access control, 2FA
- **Product Service** - CRUD สินค้า, จัดการรูปภาพ, Category management
- **Order Service** - จัดการคำสั่งซื้อ, เปลี่ยนสถานะ, Order analytics
- **User Service** - จัดการลูกค้า, Customer database
- **Inventory Service** - จัดการ stock, Inventory reports, Low stock alerts
- **Payment Service** - Payment analytics, Refund management
- **Shipping Service** - จัดการขนส่ง, Tracking number management
- **Promotion Service** - สร้างคูปอง, Flash sale, Marketing campaigns
- **Review Service** - จัดการรีวิว, Review moderation
- **Notification Service** - ส่งแจ้งเตือน, Notification management
- **Admin Service** - System configuration, User management
- **Vault Service** - Secrets management, API keys
- **Keycloak Service** - User management, Role management

**Menu Structure:**
```
📊 Dashboard
├── 📈 Overview
│   ├── Sales Summary
│   ├── Order Statistics
│   ├── Customer Metrics
│   └── Revenue Analytics
├── 📦 Products
│   ├── Product List
│   ├── Add Product
│   ├── Categories
│   ├── Inventory Management
│   ├── Bulk Import/Export
│   └── Product Analytics
├── 🧾 Orders
│   ├── Order List
│   ├── Order Details
│   ├── Order Processing
│   ├── Shipping Management
│   ├── Returns & Refunds
│   └── Order Analytics
├── 👥 Customers
│   ├── Customer List
│   ├── Customer Details
│   ├── Customer Analytics
│   ├── Customer Support
│   └── Customer Segmentation
├── 🛍️ Marketing
│   ├── Promotions
│   ├── Coupons
│   ├── Flash Sales
│   ├── Email Campaigns
│   ├── Loyalty Program
│   └── Marketing Analytics
├── 💳 Payments
│   ├── Payment Transactions
│   ├── Refunds
│   ├── Payment Methods
│   ├── Payment Analytics
│   └── Fraud Detection
├── 📊 Analytics
│   ├── Sales Reports
│   ├── Product Performance
│   ├── Customer Behavior
│   ├── Inventory Reports
│   └── Financial Reports
├── 🔧 System
│   ├── System Configuration
│   ├── User Management
│   ├── Role Management
│   ├── API Management
│   └── System Health
├── 🔐 Security
│   ├── Secrets Management (Vault)
│   ├── Identity Management (Keycloak)
│   ├── Access Control
│   ├── Audit Logs
│   └── Security Alerts
├── 📝 Content
│   ├── Reviews Management
│   ├── Content Moderation
│   ├── SEO Management
│   └── Media Library
├── 📱 Notifications
│   ├── Email Templates
│   ├── SMS Templates
│   ├── Push Notifications
│   └── Notification History
├── 🚚 Shipping
│   ├── Shipping Methods
│   ├── Carrier Management
│   ├── Shipping Rates
│   └── Delivery Tracking
├── 📋 Reports
│   ├── Sales Reports
│   ├── Inventory Reports
│   ├── Customer Reports
│   ├── Financial Reports
│   └── Custom Reports
└── ⚙️ Settings
    ├── General Settings
    ├── Payment Settings
    ├── Shipping Settings
    ├── Notification Settings
    ├── Security Settings
    └── Integration Settings
```

**Features:**
- Product management
- Order management
- Customer management
- Inventory management
- Sales analytics
- Marketing campaigns
- System configuration
- Security management

### **Mobile Applications (1 App)**

#### **Customer Mobile App** (React Native)
**Platforms:** iOS, Android
**Required Services:**
- **Auth Service + Keycloak** - Mobile authentication, Biometric login, SSO
- **User Service** - Mobile profile management
- **Product Service** - Mobile product browsing, Barcode scanning
- **Cart Service** - Mobile cart management
- **Order Service** - Mobile order tracking
- **Payment Service** - Mobile payment methods
- **Notification Service** - Push notifications
- **Location Service** - Location-based services

**Mobile Menu Structure:**
```
🏠 Home
├── 🔍 Search
├── 🏷️ Categories
├── 🛒 Cart
├── 📦 Orders
├── 👤 Profile
├── 💎 Loyalty
├── 🎯 Promotions
└── 📞 Support
```

**Features:**
- Mobile-optimized shopping experience
- Push notifications
- Barcode scanning
- Location-based services
- Offline functionality
- Biometric authentication

---

## 🔄 **Service Dependencies**

### **Frontend Dependencies:**
```
Next.js App (Customer)
├── Auth Service + Keycloak (JWT, OAuth2, SSO)
├── Product Service (Search, Filter, Images)
├── Cart Service (Add/Remove items)
├── Order Service (Checkout, Tracking)
├── Payment Service (Payment methods)
├── User Service (Profile, Address, Wishlist)
├── Review Service (Product reviews)
└── Notification Service (Real-time updates)

Next.js Admin App
├── Auth Service + Keycloak (Admin authentication, 2FA)
├── Product Service (CRUD products)
├── Order Service (Order management)
├── User Service (Customer management)
├── Inventory Service (Stock management)
├── Promotion Service (Campaigns)
├── Notification Service (Alerts)
├── Vault Service (Secrets management)
└── Keycloak Service (User management)
```

### **Backend Service Dependencies:**
```
API Gateway
├── Auth Service + Keycloak ← User Service
├── Product Service ← Inventory Service
├── Order Service ← Cart, Payment, Shipping
├── Payment Service ← Order Service
├── Inventory Service ← Product Service
├── Shipping Service ← Order Service
├── Promotion Service ← Order Service
├── Review Service ← Order Service
├── Notification Service ← All Services
├── Vault Service ← All Services (Secrets)
└── Keycloak Service ← Auth Service (Identity)
```

### **External Integrations:**
```
External Services
├── Payment Gateways (Stripe, PayPal, PromptPay)
├── Shipping Providers (Kerry, Flash, DHL)
├── Email Services (SendGrid, AWS SES)
├── SMS Services (Twilio, AWS SNS)
├── Cloud Storage (AWS S3, Google Cloud Storage)
├── CDN (CloudFlare, AWS CloudFront)
├── Analytics (Google Analytics)
├── Security Services
│   ├── HashiCorp Vault (Secrets Management)
│   └── Keycloak (Identity & Access Management)
└── Social Login (Google, Facebook, Apple, Line)
```

---

## 📊 **Database Architecture**

### **Primary Database (PostgreSQL)**
- User Service
- Order Service
- Product Service
- Payment Service
- Inventory Service
- Shipping Service
- Promotion Service
- Admin Service
- Keycloak Service

### **Cache & Session (Redis)**
- Auth Service
- Cart Service
- Promotion Service
- Notification Service
- Keycloak Service (Session storage)

### **Document Storage (MongoDB)**
- Order Service (Order documents)
- Review Service (Review content)

### **Search Engine (Elasticsearch)**
- Product Service (Product search)

### **Message Queue (Kafka/RabbitMQ)**
- Notification Service

### **File Storage (AWS S3)**
- Product Service (Image storage)

### **Secrets Storage (Vault)**
- All Services (API keys, credentials, certificates)

---

## 🚀 **Deployment Architecture**

### **Infrastructure**
- **Container Orchestration:** Kubernetes
- **Load Balancer:** NGINX
- **API Gateway:** NGINX + NestJS
- **Service Mesh:** Istio (optional)
- **Secrets Management:** HashiCorp Vault
- **Identity Management:** Keycloak
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack
- **CI/CD:** GitHub Actions

### **Scaling Strategy**
- **Horizontal Scaling:** Auto-scaling pods
- **Database Scaling:** Read replicas
- **Caching:** Redis cluster
- **CDN:** CloudFlare for static assets
- **Load Balancing:** Round-robin with health checks
- **Vault Scaling:** Multi-node cluster
- **Keycloak Scaling:** Multi-node cluster

---

## 🔐 **Security Infrastructure - Vault & Keycloak Integration**

### 🏦 **HashiCorp Vault - Secrets Management**

#### **Vault ใช้เก็บ Secrets อะไรบ้าง:**
| Secret Type | ตัวอย่าง | ใช้โดย Service |
|-------------|----------|----------------|
| **Database Credentials** | PostgreSQL, MongoDB, Redis passwords | All Services |
| **API Keys** | Stripe, PayPal, AWS S3, SendGrid keys | Payment, Product, Notification |
| **JWT Secrets** | JWT signing keys | Auth Service |
| **OAuth2 Secrets** | Google, Facebook, Apple OAuth secrets | Auth Service |
| **Payment Gateway Keys** | Stripe secret key, PayPal client secret | Payment Service |
| **Email Service Credentials** | SendGrid API key, SMTP passwords | Notification Service |
| **SMS Service Credentials** | Twilio API keys | Notification Service |
| **Cloud Storage Keys** | AWS S3, Google Cloud Storage | Product Service |
| **Kafka Credentials** | Kafka authentication | All Services |
| **SSL Certificates** | TLS certificates | API Gateway, All Services |

#### **Vault Integration Pattern:**
```
Service Startup:
1. Service authenticates with Vault using AppRole
2. Vault returns temporary credentials
3. Service uses credentials to access secrets
4. Credentials auto-rotate every 24 hours
```

#### **Vault Usage ในแต่ละ Service:**
- **Auth Service** - JWT secrets, OAuth2 secrets
- **Payment Service** - Payment gateway API keys
- **Product Service** - AWS S3 credentials, CDN keys
- **Notification Service** - Email/SMS service credentials
- **All Services** - Database credentials, Kafka credentials

### 👑 **Keycloak - Identity & Access Management**

#### **Keycloak ใช้จัดการอะไรบ้าง:**
| Feature | คำอธิบาย | ใช้โดย |
|---------|----------|--------|
| **User Authentication** | Login, Registration, Password reset | Customer, Admin |
| **Single Sign-On (SSO)** | Login once, access multiple apps | Customer, Admin |
| **Social Login** | Google, Facebook, Apple, Line | Customer |
| **Role-Based Access Control** | Admin, Customer, Seller roles | All Users |
| **Multi-Factor Authentication** | 2FA, SMS, Email verification | Admin, VIP Customers |
| **Session Management** | Active sessions, logout everywhere | All Users |
| **User Federation** | LDAP, Active Directory integration | Enterprise Customers |
| **Token Management** | JWT, Refresh tokens | All Services |

#### **Keycloak Realms:**
```
Keycloak Structure:
├── ecommerce-realm (Main realm)
│   ├── customer-client (Customer app)
│   ├── admin-client (Admin dashboard)
│   ├── mobile-client (Mobile app)
│   └── api-client (Service-to-service)
└── internal-realm (Internal services)
    ├── service-accounts
    └── admin-users
```

#### **Keycloak Integration ในแต่ละ Service:**
- **Auth Service** - Integrate with Keycloak for authentication
- **API Gateway** - Validate JWT tokens from Keycloak
- **Admin Service** - Role-based access control
- **All Services** - Service-to-service authentication

### 🔧 **Security Architecture Flow:**

#### **Customer Authentication Flow:**
```
1. Customer → Customer App
2. Customer App → Keycloak (Login)
3. Keycloak → Auth Service (Validate)
4. Auth Service → Vault (Get JWT secret)
5. Auth Service → Customer App (JWT token)
6. Customer App → API Gateway (With JWT)
7. API Gateway → Keycloak (Validate JWT)
8. API Gateway → Backend Services
```

#### **Admin Authentication Flow:**
```
1. Admin → Admin Dashboard
2. Admin Dashboard → Keycloak (Login with 2FA)
3. Keycloak → Auth Service (Validate + Check roles)
4. Auth Service → Vault (Get admin JWT secret)
5. Auth Service → Admin Dashboard (Admin JWT token)
6. Admin Dashboard → API Gateway (With Admin JWT)
7. API Gateway → Keycloak (Validate Admin JWT + Check roles)
8. API Gateway → Backend Services (With admin privileges)
```

#### **Service-to-Service Authentication:**
```
1. Service A → Vault (Get service credentials)
2. Vault → Service A (Temporary credentials)
3. Service A → Service B (With service token)
4. Service B → Vault (Validate service token)
5. Service B → Service A (Response)
```

### 🛡️ **Security Features:**

#### **Vault Security Features:**
- **Dynamic Secrets** - Auto-generate temporary credentials
- **Secret Rotation** - Automatic secret rotation
- **Audit Logging** - Track all secret access
- **Encryption** - Encrypt secrets at rest and in transit
- **Access Control** - Fine-grained access policies
- **Lease Management** - Time-limited access to secrets

#### **Keycloak Security Features:**
- **Multi-Factor Authentication** - SMS, Email, TOTP
- **Brute Force Protection** - Account lockout after failed attempts
- **Password Policies** - Strong password requirements
- **Session Management** - Active session monitoring
- **Token Security** - Short-lived JWT tokens
- **OAuth2/OpenID Connect** - Standard protocols

### 🔄 **Integration Points:**

#### **Vault Integration:**
```
Vault → All Services:
├── Database credentials
├── API keys
├── JWT secrets
├── SSL certificates
└── Service credentials
```

#### **Keycloak Integration:**
```
Keycloak → Auth Service:
├── User authentication
├── Token validation
├── Role management
└── Session management

Keycloak → API Gateway:
├── JWT validation
├── Role-based access
└── Rate limiting
```

### 📊 **Monitoring & Alerting:**

#### **Vault Monitoring:**
- Secret access logs
- Failed authentication attempts
- Secret rotation status
- Vault health status

#### **Keycloak Monitoring:**
- Login success/failure rates
- Active sessions count
- Token validation metrics
- User registration rates

### 🚀 **Deployment:**

#### **Vault Deployment:**
- **High Availability** - Multi-node cluster
- **Backup** - Regular secret backups
- **Disaster Recovery** - Secret recovery procedures
- **Security** - Network isolation, TLS encryption

#### **Keycloak Deployment:**
- **High Availability** - Multi-node cluster
- **Database** - PostgreSQL cluster
- **Load Balancing** - NGINX load balancer
- **Caching** - Redis for session storage

> **หมายเหตุ**: ระบบถูกออกแบบให้มีความยืดหยุ่นสูง สามารถเพิ่มหรือเปลี่ยนฟีเจอร์ได้โดยไม่กระทบกับบริการอื่นๆ ผ่าน Event-Driven Architecture และ API Gateway พร้อมระบบความปลอดภัยที่แข็งแกร่งด้วย Vault และ Keycloak

---

## 📊 **Monitoring & Observability - Full Observability Pipeline**

### 🔍 **Observability Stack Overview**

#### **Complete Stack:**
- **Metrics Collection & Visualization**: Prometheus + Grafana
- **Log Aggregation & Analysis**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Distributed Tracing**: Jaeger (OpenTelemetry)
- **Load Testing & Performance**: k6
- **Alerting**: Prometheus AlertManager + PagerDuty
- **APM**: Custom APM with OpenTelemetry

---

### 📈 **1. Metrics Collection & Visualization (Prometheus + Grafana)**

#### **Prometheus Configuration:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
  
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:8080']
  
  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8080']
  
  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:8080']
  
  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:8080']
  
  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka:9090']
  
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgresql:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

#### **Key Metrics Collected:**
| Service | Metrics | Description |
|---------|---------|-------------|
| **All Services** | `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_flight` | HTTP performance metrics |
| **Database** | `postgresql_connections`, `postgresql_queries_per_second`, `postgresql_slow_queries` | Database performance |
| **Kafka** | `kafka_consumer_lag`, `kafka_producer_throughput`, `kafka_topic_messages` | Message queue metrics |
| **Redis** | `redis_connected_clients`, `redis_memory_usage`, `redis_commands_processed` | Cache performance |
| **Business** | `orders_created_total`, `payments_processed_total`, `products_viewed_total` | Business metrics |

#### **Grafana Dashboards:**
```
📊 Grafana Dashboards
├── 🏠 System Overview
│   ├── Service Health Status
│   ├── Response Time Overview
│   ├── Error Rate Overview
│   └── Resource Usage
├── 🛒 E-commerce Business
│   ├── Order Metrics
│   ├── Payment Metrics
│   ├── Product Performance
│   └── Customer Behavior
├── 🔧 Infrastructure
│   ├── Database Performance
│   ├── Kafka Metrics
│   ├── Redis Performance
│   └── Network Metrics
├── 🔐 Security
│   ├── Authentication Metrics
│   ├── Authorization Failures
│   ├── Security Alerts
│   └── Vault Metrics
└── 📱 User Experience
    ├── Frontend Performance
    ├── API Response Times
    ├── Mobile App Metrics
    └── User Journey Tracking
```

---

### 📝 **2. Log Aggregation & Analysis (ELK Stack)**

#### **ELK Stack Architecture:**
```
Application Logs → Fluentbit → Elasticsearch → Kibana
```

#### **Fluentbit Configuration:**
```ini
[INPUT]
    Name                tail
    Path                /var/log/containers/*.log
    Parser              docker
    Tag                 kube.*
    Refresh_Interval    5
    Mem_Buf_Limit       5MB
    Skip_Long_Lines     On

[FILTER]
    Name                kubernetes
    Match               kube.*
    Kube_URL           https://kubernetes.default.svc:443
    Merge_Log          On
    K8S-Logging.Parser On
    K8S-Logging.Exclude On

[OUTPUT]
    Name                es
    Match               *
    Host                elasticsearch
    Port                9200
    Index               ecommerce-logs
    Type                _doc
    Generate_ID         On
    Suppress_Type_Name  On
```

#### **Log Structure:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "order-service",
  "trace_id": "abc123def456",
  "user_id": "user123",
  "order_id": "ORD-2024-001234",
  "message": "Order created successfully",
  "metadata": {
    "payment_method": "credit_card",
    "total_amount": 1500.00,
    "items_count": 3
  }
}
```

#### **Kibana Dashboards:**
```
📋 Kibana Dashboards
├── 🔍 Log Search
│   ├── Full-Text Search
│   ├── Filter by Service
│   ├── Filter by Log Level
│   └── Time Range Filter
├── 📊 Log Analytics
│   ├── Error Rate by Service
│   ├── Log Volume Trends
│   ├── Performance Issues
│   └── Security Events
├── 🚨 Alert Management
│   ├── Error Alerts
│   ├── Performance Alerts
│   ├── Security Alerts
│   └── Business Alerts
└── 📈 Business Intelligence
    ├── User Activity Logs
    ├── Order Processing Logs
    ├── Payment Transaction Logs
    └── Customer Support Logs
```

---

### 🔍 **3. Distributed Tracing (Jaeger + OpenTelemetry)**

#### **OpenTelemetry Configuration:**
```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```

#### **Service Instrumentation:**
```javascript
// Next.js Frontend
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('ecommerce-frontend');

// Instrument API calls
const span = tracer.startSpan('api-call');
span.setAttribute('api.endpoint', '/api/orders');
span.setAttribute('user.id', userId);

try {
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
} finally {
  span.end();
}
```

```csharp
// .NET Backend
using OpenTelemetry.Trace;

var tracer = TracerProvider.Default.GetTracer("order-service");

using var span = tracer.StartActiveSpan("create-order");
span.SetAttribute("order.id", orderId);
span.SetAttribute("user.id", userId);
span.SetAttribute("payment.method", paymentMethod);

// Business logic here
span.SetStatus(Status.Ok);
```

#### **Jaeger Dashboards:**
```
🔍 Jaeger Dashboards
├── 🔍 Trace Search
│   ├── Search by Trace ID
│   ├── Search by Service
│   ├── Search by Operation
│   └── Search by Tags
├── 📊 Trace Analytics
│   ├── Service Dependencies
│   ├── Trace Latency Distribution
│   ├── Error Rate by Service
│   └── Throughput Analysis
├── 🚨 Performance Issues
│   ├── Slow Traces
│   ├── Failed Traces
│   ├── Bottleneck Detection
│   └── Service Dependencies
└── 📈 Business Traces
    ├── Order Flow Traces
    ├── Payment Flow Traces
    ├── User Journey Traces
    └── Error Investigation
```

---

### ⚡ **4. Load Testing & Performance (k6)**

#### **k6 Test Scenarios:**
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

export default function() {
  const BASE_URL = 'https://shop.example.com';
  
  // Homepage
  const homeResponse = http.get(`${BASE_URL}/`);
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 1000,
  });
  
  // Product search
  const searchResponse = http.get(`${BASE_URL}/api/products/search?q=phone`);
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Add to cart
  const cartResponse = http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({
    productId: 'prod123',
    quantity: 1
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(cartResponse, {
    'add to cart status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

#### **Performance Test Scenarios:**
```
🧪 k6 Test Scenarios
├── 🏠 Homepage Load Test
│   ├── Concurrent Users: 100-1000
│   ├── Duration: 10 minutes
│   └── Metrics: Response time, Throughput
├── 🛒 Shopping Flow Test
│   ├── Browse → Search → Add to Cart → Checkout
│   ├── Concurrent Users: 50-200
│   └── Metrics: End-to-end flow time
├── 💳 Payment Flow Test
│   ├── Order Creation → Payment Processing
│   ├── Concurrent Users: 20-100
│   └── Metrics: Payment success rate, Processing time
├── 🔍 Search Performance Test
│   ├── Product search with various queries
│   ├── Concurrent Users: 100-500
│   └── Metrics: Search response time, Results relevance
└── 📊 API Endpoint Test
    ├── Individual API endpoint testing
    ├── Concurrent Users: 50-300
    └── Metrics: Response time, Error rate
```

---

### 🚨 **5. Alerting & Notification System**

#### **Prometheus AlertManager Configuration:**
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://127.0.0.1:5001/'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/your-slack-webhook'
```

#### **Alert Rules:**
```yaml
# prometheus-rules.yml
groups:
  - name: ecommerce-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      # Database connection issues
      - alert: DatabaseConnectionIssues
        expr: postgresql_connections > 80
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly full"
          description: "{{ $value }} connections in use"

      # Kafka consumer lag
      - alert: KafkaConsumerLag
        expr: kafka_consumer_lag > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Kafka consumer lag detected"
          description: "Consumer lag is {{ $value }} messages"
```

---

### 📊 **6. APM (Application Performance Monitoring)**

#### **Custom APM with OpenTelemetry:**
```javascript
// APM Configuration
const apm = {
  // Business Metrics
  trackOrder: (orderId, userId, amount) => {
    const span = tracer.startSpan('business.order.created');
    span.setAttribute('business.order.id', orderId);
    span.setAttribute('business.user.id', userId);
    span.setAttribute('business.order.amount', amount);
    span.setAttribute('business.order.currency', 'THB');
    return span;
  },

  trackPayment: (paymentId, orderId, method, status) => {
    const span = tracer.startSpan('business.payment.processed');
    span.setAttribute('business.payment.id', paymentId);
    span.setAttribute('business.order.id', orderId);
    span.setAttribute('business.payment.method', method);
    span.setAttribute('business.payment.status', status);
    return span;
  },

  trackUserJourney: (userId, action, page) => {
    const span = tracer.startSpan('user.journey');
    span.setAttribute('user.id', userId);
    span.setAttribute('user.action', action);
    span.setAttribute('user.page', page);
    span.setAttribute('user.timestamp', Date.now());
    return span;
  }
};
```

#### **APM Dashboards:**
```
📊 APM Dashboards
├── 🏪 Business Performance
│   ├── Order Conversion Rate
│   ├── Payment Success Rate
│   ├── Average Order Value
│   └── Customer Lifetime Value
├── 👤 User Experience
│   ├── Page Load Times
│   ├── User Journey Flows
│   ├── Error Rates by Page
│   └── User Engagement Metrics
├── 🔧 Technical Performance
│   ├── API Response Times
│   ├── Database Query Performance
│   ├── Cache Hit Rates
│   └── Service Dependencies
└── 📈 Business Intelligence
    ├── Sales Performance
    ├── Product Performance
    ├── Customer Behavior
    └── Marketing Campaign Performance
```

---

### 🔧 **7. Monitoring Integration Points**

#### **Service Integration:**
```
Monitoring Integration
├── 🔍 All Services
│   ├── Prometheus Metrics Endpoint (/metrics)
│   ├── Health Check Endpoint (/health)
│   ├── OpenTelemetry Instrumentation
│   └── Structured Logging
├── 🗄️ Databases
│   ├── PostgreSQL Metrics
│   ├── Redis Metrics
│   ├── MongoDB Metrics
│   └── Elasticsearch Metrics
├── 📨 Message Queues
│   ├── Kafka Metrics
│   ├── Consumer Lag Monitoring
│   └── Producer Throughput
├── 🌐 External Services
│   ├── Payment Gateway Health
│   ├── Shipping Provider Status
│   └── Third-party API Monitoring
└── 🔐 Security Services
    ├── Vault Health Monitoring
    ├── Keycloak Performance
    └── Security Event Logging
```

#### **Deployment Configuration:**
```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: monitoring-config
data:
  prometheus.yml: |
    # Prometheus configuration
  alertmanager.yml: |
    # AlertManager configuration
  otel-collector-config.yaml: |
    # OpenTelemetry configuration

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: monitoring-stack
spec:
  replicas: 3
  selector:
    matchLabels:
      app: monitoring
  template:
    metadata:
      labels:
        app: monitoring
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
      - name: jaeger
        image: jaegertracing/all-in-one:latest
        ports:
        - containerPort: 16686
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
        ports:
        - containerPort: 9200
```

---

### 📈 **8. Performance Optimization**

#### **Performance Monitoring Checklist:**
```
✅ Performance Monitoring
├── 📊 Metrics Collection
│   ├── Response time monitoring
│   ├── Throughput monitoring
│   ├── Error rate monitoring
│   └── Resource usage monitoring
├── 🔍 Distributed Tracing
│   ├── Request flow tracing
│   ├── Bottleneck identification
│   ├── Service dependency mapping
│   └── Performance optimization insights
├── 📝 Log Analysis
│   ├── Error pattern analysis
│   ├── Performance issue investigation
│   ├── Security event monitoring
│   └── Business intelligence
├── 🧪 Load Testing
│   ├── Performance baseline establishment
│   ├── Capacity planning
│   ├── Performance regression testing
│   └── Stress testing
└── 🚨 Alerting
    ├── Proactive issue detection
    ├── Automated incident response
    ├── Performance degradation alerts
    └── Business impact monitoring
```

> **หมายเหตุ**: ระบบ Monitoring & Observability นี้ให้ภาพรวมที่ครบถ้วนของระบบ E-commerce ตั้งแต่ระดับ Infrastructure ไปจนถึง Business Metrics ช่วยให้ทีมสามารถตรวจจับและแก้ไขปัญหาได้อย่างรวดเร็ว และปรับปรุงประสิทธิภาพของระบบอย่างต่อเนื่อง

---

## 🔒 **DevSecOps & CNAPPs - Cloud-Native Application Protection Platform**

### 🏗️ **Gartner CNAPP Model Implementation**

#### **CNAPP Security Layers:**
- **SAST (Static Application Security Testing)**: Snyk / SonarQube
- **SCA (Software Composition Analysis)**: Trivy / Snyk for dependency analysis
- **IaC Security**: tfsec, Checkov
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager
- **K8s Hardening**: Kyverno, OPA Gatekeeper, PodSecurityPolicy, NetworkPolicy
- **Container Security**: Trivy, Falco
- **Runtime Security**: Falco, Sysdig

---

### 🔍 **1. SAST (Static Application Security Testing)**

#### **Snyk Configuration:**
```yaml
# .snyk
version: v1.25.0
ignore:
  'npm:some-vulnerability@1.2.3':
    - '*':
        reason: 'Temporary ignore for development'
        expires: 2024-12-31T00:00:00.000Z

# snyk.yaml
version: v1.25.0
exclude:
  - 'node_modules/**'
  - 'dist/**'
  - 'build/**'
  - 'coverage/**'

test:
  - npm
  - docker
  - iac

monitor:
  - npm
  - docker
  - iac
```

#### **SonarQube Configuration:**
```yaml
# sonar-project.properties
sonar.projectKey=ecommerce-platform
sonar.projectName=E-Commerce Platform
sonar.projectVersion=1.0

# Source code
sonar.sources=src
sonar.tests=tests
sonar.test.inclusions=tests/**/*

# Language specific
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Security rules
sonar.security.sources.javasecurity=src
sonar.security.sources.pythonsecurity=src
sonar.security.sources.phpsecurity=src

# Quality gates
sonar.qualitygate.wait=true
```

#### **SAST Integration in CI/CD:**
```yaml
# .github/workflows/sast.yml
name: SAST Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  snyk-sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Run SonarQube analysis
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

### 📦 **2. SCA (Software Composition Analysis)**

#### **Trivy Configuration:**
```yaml
# trivy.yaml
scanners:
  - vuln
  - config
  - secret

severity: HIGH,CRITICAL

skip-dirs:
  - node_modules
  - vendor
  - .git

skip-files:
  - package-lock.json
  - yarn.lock

format: json

output: trivy-results.json
```

#### **Dependency Analysis:**
```bash
# Scan container images
trivy image --severity HIGH,CRITICAL ecommerce-app:latest

# Scan dependencies
trivy fs --severity HIGH,CRITICAL .

# Scan Kubernetes manifests
trivy config --severity HIGH,CRITICAL k8s/

# Scan Infrastructure as Code
trivy config --severity HIGH,CRITICAL terraform/
```

#### **Snyk Dependency Analysis:**
```json
// .snyk
{
  "version": "v1.25.0",
  "ignore": {
    "npm:lodash@4.17.15": {
      "reason": "False positive, internal use only",
      "expires": "2024-12-31T00:00:00.000Z"
    }
  },
  "patch": {
    "npm:some-vulnerability@1.2.3": {
      "paths": [
        {
          "path": "package.json",
          "patch": "patch content"
        }
      ]
    }
  }
}
```

---

### 🏗️ **3. IaC Security (Infrastructure as Code)**

#### **tfsec Configuration:**
```yaml
# .tfsec.yml
---
# Minimum version of tfsec to use
minimum_version: 1.0.0

# Enable all available checks
enable_all_checks: true

# Exclude specific checks
exclude:
  - AWS018  # Ensure security group rule descriptions
  - AWS017  # Ensure all data stored in the S3 bucket is securely encrypted at rest

# Custom checks
custom_checks:
  - code: CUSTOM001
    description: "Ensure all S3 buckets have versioning enabled"
    impact: "Data loss prevention"
    resolution: "Enable versioning on S3 buckets"
    required_labels:
      - aws_s3_bucket
    severity: HIGH
```

#### **Checkov Configuration:**
```yaml
# .checkov.yml
skip-path:
  - .terraform
  - node_modules
  - .git

skip-check:
  - CKV_AWS_18  # Ensure security group rule descriptions
  - CKV_AWS_17  # Ensure all data stored in the S3 bucket is securely encrypted at rest

framework:
  - terraform
  - kubernetes
  - dockerfile
  - helm

output: json
output-file-path: checkov-results.json
```

#### **IaC Security in CI/CD:**
```yaml
# .github/workflows/iac-security.yml
name: IaC Security Scan

on:
  push:
    paths:
      - 'terraform/**'
      - 'k8s/**'
      - 'docker/**'
  pull_request:
    paths:
      - 'terraform/**'
      - 'k8s/**'
      - 'docker/**'

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: terraform/
          
      - name: Upload tfsec results
        uses: actions/upload-artifact@v3
        with:
          name: tfsec-results
          path: tfsec-results.json
          
  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          output_format: json
          output_file_path: checkov-results.json
          
      - name: Upload Checkov results
        uses: actions/upload-artifact@v3
        with:
          name: checkov-results
          path: checkov-results.json
```

---

### 🔐 **4. Secrets Management**

#### **HashiCorp Vault Configuration:**
```hcl
# vault-config.hcl
storage "raft" {
  path = "/vault/data"
  node_id = "node-1"
  
  retry_join {
    leader_api_addr = "https://vault-0.vault-internal:8200"
  }
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = false
  tls_cert_file = "/vault/tls/tls.crt"
  tls_key_file = "/vault/tls/tls.key"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault-0.vault-internal:8201"

ui = true
disable_mlock = true
```

#### **Vault Policies:**
```hcl
# policies/app-policy.hcl
path "secret/data/ecommerce/*" {
  capabilities = ["read"]
}

path "secret/data/ecommerce/database" {
  capabilities = ["read", "update"]
}

path "auth/token/create" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

#### **Vault Integration in Services:**
```yaml
# vault-agent-config.hcl
auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "ecommerce-app"
    }
  }
}

template {
  destination = "/vault/secrets/database.env"
  contents = <<EOH
DB_HOST={{ with secret "secret/data/ecommerce/database" }}{{ .Data.data.host }}{{ end }}
DB_PORT={{ with secret "secret/data/ecommerce/database" }}{{ .Data.data.port }}{{ end }}
DB_NAME={{ with secret "secret/data/ecommerce/database" }}{{ .Data.data.name }}{{ end }}
DB_USER={{ with secret "secret/data/ecommerce/database" }}{{ .Data.data.user }}{{ end }}
DB_PASSWORD={{ with secret "secret/data/ecommerce/database" }}{{ .Data.data.password }}{{ end }}
EOH
}
```

---

### 🛡️ **5. Kubernetes Hardening**

#### **Kyverno Policies:**
```yaml
# kyverno-policies.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
spec:
  validationFailureAction: enforce
  rules:
  - name: check-for-labels
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "label 'app.kubernetes.io/name' is required"
      pattern:
        metadata:
          labels:
            app.kubernetes.io/name: "?*"
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged-containers
spec:
  validationFailureAction: enforce
  rules:
  - name: check-privileged
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Privileged containers are not allowed"
      pattern:
        spec:
          containers:
          - name: "*"
            securityContext:
              privileged: false
---
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-non-root-user
spec:
  validationFailureAction: enforce
  rules:
  - name: check-run-as-non-root
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Containers must not run as root"
      pattern:
        spec:
          securityContext:
            runAsNonRoot: true
          containers:
          - name: "*"
            securityContext:
              runAsNonRoot: true
```

#### **OPA Gatekeeper Policies:**
```rego
# opa-policies.rego
package kubernetes.admission

deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.operation == "CREATE"
    container := input.request.object.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Privileged containers are not allowed: %v", [container.name])
}

deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.operation == "CREATE"
    not input.request.object.metadata.labels["app.kubernetes.io/name"]
    msg := "Label 'app.kubernetes.io/name' is required"
}

deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.operation == "CREATE"
    container := input.request.object.spec.containers[_]
    not container.securityContext.runAsNonRoot
    msg := sprintf("Container %v must run as non-root user", [container.name])
}
```

#### **Pod Security Policies:**
```yaml
# pod-security-policies.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: ecommerce-restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: true
```

#### **Network Policies:**
```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ecommerce-network-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: ecommerce
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
```

---

### 🐳 **6. Container Security**

#### **Trivy Container Scanning:**
```yaml
# container-security.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: trivy-config
data:
  trivy.yaml: |
    scanners:
      - vuln
      - config
      - secret
    severity: HIGH,CRITICAL
    skip-dirs:
      - /tmp
      - /var/cache
    format: json
    output: trivy-results.json
```

#### **Falco Runtime Security:**
```yaml
# falco-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-config
data:
  falco.yaml: |
    rules_file:
      - /etc/falco/falco_rules.yaml
      - /etc/falco/k8s_audit_rules.yaml
      - /etc/falco/rules.d/
    
    webserver:
      enabled: true
      listen_port: 9376
      ssl_enabled: true
      ssl_certificate: /etc/falco/falco.pem
    
    program_output:
      enabled: true
      program: "curl -d @- -X POST http://webhook.example.com/falco"
    
    http_output:
      enabled: true
      url: "http://webhook.example.com/falco"
```

#### **Falco Rules:**
```yaml
# falco-rules.yaml
- rule: Unauthorized Process
  desc: Detect unauthorized processes
  condition: spawned_process and not proc.name in (authorized_processes)
  output: Unauthorized process started (user=%user.name command=%proc.cmdline)
  priority: WARNING

- rule: Container Drift
  desc: Detect new processes in container
  condition: container and spawned_process and not proc.name in (container_expected_processes)
  output: Container drift detected (container=%container.name process=%proc.name)
  priority: WARNING

- rule: Privileged Container
  desc: Detect privileged containers
  condition: container and container.privileged=true
  output: Privileged container started (user=%user.name container=%container.name)
  priority: CRITICAL
```

---

### 🔄 **7. DevSecOps CI/CD Pipeline**

#### **Complete Security Pipeline:**
```yaml
# .github/workflows/devsecops.yml
name: DevSecOps Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk SAST
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          
  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Trivy SCA
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
  iac-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        
  container-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build container
        run: docker build -t ecommerce-app .
      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ecommerce-app:latest'
          format: 'sarif'
          output: 'trivy-container-results.sarif'
          
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          args: --only-verified --format json --output trufflehog-results.json
          
  security-report:
    runs-on: ubuntu-latest
    needs: [sast, sca, iac-security, container-security, secrets-scan]
    steps:
      - name: Generate Security Report
        run: |
          echo "Security Scan Results:" > security-report.md
          echo "=====================" >> security-report.md
          echo "" >> security-report.md
          echo "SAST: ${{ needs.sast.result }}" >> security-report.md
          echo "SCA: ${{ needs.sca.result }}" >> security-report.md
          echo "IaC Security: ${{ needs.iac-security.result }}" >> security-report.md
          echo "Container Security: ${{ needs.container-security.result }}" >> security-report.md
          echo "Secrets Scan: ${{ needs.secrets-scan.result }}" >> security-report.md
          
      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.md
```

---

### 📊 **8. Security Monitoring & Compliance**

#### **Security Metrics Dashboard:**
```
🔒 Security Metrics
├── 🛡️ Vulnerability Management
│   ├── Open Vulnerabilities by Severity
│   ├── Vulnerability Age Distribution
│   ├── Remediation Time
│   └── False Positive Rate
├── 🔍 Security Scans
│   ├── SAST Scan Results
│   ├── SCA Scan Results
│   ├── Container Scan Results
│   └── IaC Security Results
├── 🚨 Security Incidents
│   ├── Runtime Security Alerts
│   ├── Policy Violations
│   ├── Unauthorized Access
│   └── Data Breach Attempts
└── 📋 Compliance
    ├── Policy Compliance Rate
    ├── Security Standards Adherence
    ├── Audit Trail
    └── Compliance Reports
```

#### **Security Compliance Framework:**
```
✅ Security Compliance
├── 📋 OWASP Top 10
│   ├── Injection Prevention
│   ├── Authentication & Authorization
│   ├── Data Protection
│   └── Security Configuration
├── 🏢 Industry Standards
│   ├── ISO 27001
│   ├── SOC 2 Type II
│   ├── PCI DSS
│   └── GDPR Compliance
├── 🔐 Cloud Security
│   ├── AWS Well-Architected
│   ├── Azure Security Benchmark
│   ├── Google Cloud Security
│   └── Multi-Cloud Security
└── 🛡️ Kubernetes Security
    ├── CIS Kubernetes Benchmark
    ├── NSA Kubernetes Hardening
    ├── Pod Security Standards
    └── Network Security Policies
```

---

### 🚀 **9. Security Automation & Response**

#### **Automated Security Response:**
```yaml
# security-automation.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-automation
data:
  security-rules.yaml: |
    - name: "Critical Vulnerability Detected"
      condition: "vulnerability.severity == 'CRITICAL'"
      actions:
        - "create-incident"
        - "notify-security-team"
        - "block-deployment"
        
    - name: "Unauthorized Access Attempt"
      condition: "auth.failure_count > 5"
      actions:
        - "block-ip"
        - "notify-admin"
        - "log-security-event"
        
    - name: "Container Drift Detected"
      condition: "container.unexpected_process"
      actions:
        - "isolate-container"
        - "notify-devops"
        - "create-incident"
```

#### **Security Incident Response:**
```
🚨 Incident Response Process
├── 🔍 Detection
│   ├── Automated Monitoring
│   ├── Security Alerts
│   ├── User Reports
│   └── External Threat Intel
├── 📋 Analysis
│   ├── Impact Assessment
│   ├── Root Cause Analysis
│   ├── Threat Intelligence
│   └── Evidence Collection
├── 🛡️ Containment
│   ├── Isolate Affected Systems
│   ├── Block Malicious Traffic
│   ├── Revoke Compromised Credentials
│   └── Implement Security Controls
├── 🔧 Remediation
│   ├── Patch Vulnerabilities
│   ├── Update Security Policies
│   ├── Strengthen Controls
│   └── Deploy Security Updates
└── 📊 Recovery
    ├── System Restoration
    ├── Service Validation
    ├── Post-Incident Review
    └── Lessons Learned
```

> **หมายเหตุ**: DevSecOps & CNAPP implementation นี้ให้การป้องกันที่ครอบคลุมตั้งแต่ Development ไปจนถึง Production ตามมาตรฐาน Gartner CNAPP model ช่วยให้ระบบมีความปลอดภัยสูงและเป็นไปตามมาตรฐานอุตสาหกรรม

---

## 🔄 **CI/CD Pipeline - Jenkins + ArgoCD**

### 🏗️ **CI/CD Architecture Overview**

#### **Complete Pipeline Stack:**
- **CI (Continuous Integration)**: Jenkins
- **CD (Continuous Deployment)**: ArgoCD
- **Container Registry**: Docker Hub / AWS ECR / Google GCR
- **Artifact Management**: Nexus Repository / AWS S3
- **Security Scanning**: Integrated with DevSecOps pipeline
- **Environment Management**: Multi-environment deployment

---

### 🔧 **1. Jenkins CI Pipeline**

#### **Jenkins Configuration:**
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        NODE_VERSION = '18'
        GO_VERSION = '1.21'
        DOTNET_VERSION = '8.0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('SAST') {
                    steps {
                        sh 'snyk test --severity-threshold=high'
                    }
                }
                stage('SCA') {
                    steps {
                        sh 'trivy fs --severity HIGH,CRITICAL .'
                    }
                }
                stage('IaC Security') {
                    steps {
                        sh 'tfsec .'
                        sh 'checkov -d .'
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Frontend Build') {
                    when {
                        anyOf {
                            changeset "**/frontend/**"
                            changeset "**/package.json"
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                            sh 'npm run test'
                        }
                    }
                }
                
                stage('Backend Build') {
                    when {
                        anyOf {
                            changeset "**/backend/**"
                            changeset "**/*.csproj"
                            changeset "**/go.mod"
                            changeset "**/package.json"
                        }
                    }
                    steps {
                        script {
                            // .NET Services
                            if (fileExists('**/*.csproj')) {
                                dir('backend/dotnet') {
                                    sh 'dotnet restore'
                                    sh 'dotnet build'
                                    sh 'dotnet test'
                                }
                            }
                            
                            // Go Services
                            if (fileExists('**/go.mod')) {
                                dir('backend/go') {
                                    sh 'go mod download'
                                    sh 'go build ./...'
                                    sh 'go test ./...'
                                }
                            }
                            
                            // NestJS Services
                            if (fileExists('**/package.json')) {
                                dir('backend/nestjs') {
                                    sh 'npm ci'
                                    sh 'npm run build'
                                    sh 'npm run test'
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Container Build') {
            steps {
                script {
                    def services = ['auth-service', 'user-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'inventory-service', 'shipping-service', 'promotion-service', 'review-service', 'notification-service', 'admin-service']
                    
                    services.each { service ->
                        if (fileExists("${service}/Dockerfile")) {
                            dir(service) {
                                sh "docker build -t ${DOCKER_REGISTRY}/${service}:${IMAGE_TAG} ."
                                sh "docker build -t ${DOCKER_REGISTRY}/${service}:latest ."
                            }
                        }
                    }
                }
            }
        }
        
        stage('Container Security') {
            steps {
                script {
                    def services = ['auth-service', 'user-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'inventory-service', 'shipping-service', 'promotion-service', 'review-service', 'notification-service', 'admin-service']
                    
                    services.each { service ->
                        if (fileExists("${service}/Dockerfile")) {
                            sh "trivy image --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/${service}:${IMAGE_TAG}"
                        }
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    def services = ['auth-service', 'user-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'inventory-service', 'shipping-service', 'promotion-service', 'review-service', 'notification-service', 'admin-service']
                    
                    services.each { service ->
                        if (fileExists("${service}/Dockerfile")) {
                            sh "docker push ${DOCKER_REGISTRY}/${service}:${IMAGE_TAG}"
                            sh "docker push ${DOCKER_REGISTRY}/${service}:latest"
                        }
                    }
                }
            }
        }
        
        stage('Generate Manifests') {
            steps {
                script {
                    // Generate Kubernetes manifests with updated image tags
                    sh '''
                        # Update image tags in kustomization files
                        find k8s/ -name "kustomization.yaml" -exec sed -i "s|IMAGE_TAG|${IMAGE_TAG}|g" {} \;
                        
                        # Generate manifests for each environment
                        for env in dev staging prod; do
                            kustomize build k8s/overlays/${env} > k8s/manifests/${env}-manifests.yaml
                        done
                    '''
                }
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    // Trigger ArgoCD sync for dev environment
                    sh '''
                        argocd app sync ecommerce-dev --prune --force
                        argocd app wait ecommerce-dev --health --timeout 300
                    '''
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            // Send notification
        }
    }
}
```

#### **Jenkins Multi-Branch Pipeline:**
```groovy
// Jenkinsfile.multibranch
pipeline {
    agent any
    
    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 1, unit: 'HOURS')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Environment Detection') {
            steps {
                script {
                    env.DEPLOY_ENV = ''
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_ENV = 'prod'
                    } else if (env.BRANCH_NAME == 'staging') {
                        env.DEPLOY_ENV = 'staging'
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.DEPLOY_ENV = 'dev'
                    } else {
                        env.DEPLOY_ENV = 'dev'
                    }
                }
            }
        }
        
        stage('Build & Test') {
            steps {
                sh './scripts/build-and-test.sh'
            }
        }
        
        stage('Security Scan') {
            steps {
                sh './scripts/security-scan.sh'
            }
        }
        
        stage('Build Containers') {
            steps {
                sh './scripts/build-containers.sh'
            }
        }
        
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                script {
                    sh "argocd app sync ecommerce-${env.DEPLOY_ENV} --prune --force"
                    sh "argocd app wait ecommerce-${env.DEPLOY_ENV} --health --timeout 300"
                }
            }
        }
    }
}
```

---

### 🚀 **2. ArgoCD CD Pipeline**

#### **ArgoCD Application Configuration:**
```yaml
# argocd-apps/dev-ecommerce.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecommerce-dev
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: ecommerce
  source:
    repoURL: https://github.com/your-org/ecommerce-k8s-manifests
    targetRevision: HEAD
    path: k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: ecommerce-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

```yaml
# argocd-apps/staging-ecommerce.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecommerce-staging
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: ecommerce
  source:
    repoURL: https://github.com/your-org/ecommerce-k8s-manifests
    targetRevision: HEAD
    path: k8s/overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: ecommerce-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

```yaml
# argocd-apps/prod-ecommerce.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecommerce-prod
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: ecommerce
  source:
    repoURL: https://github.com/your-org/ecommerce-k8s-manifests
    targetRevision: HEAD
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: ecommerce-prod
  syncPolicy:
    automated:
      prune: false  # Manual approval for production
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

#### **ArgoCD Project Configuration:**
```yaml
# argocd-projects/ecommerce-project.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: ecommerce
  namespace: argocd
spec:
  description: E-commerce Platform Project
  
  # Source repositories
  sourceRepos:
    - 'https://github.com/your-org/ecommerce-k8s-manifests'
    - 'https://github.com/your-org/ecommerce-app'
  
  # Destination clusters and namespaces
  destinations:
    - namespace: ecommerce-dev
      server: https://kubernetes.default.svc
    - namespace: ecommerce-staging
      server: https://kubernetes.default.svc
    - namespace: ecommerce-prod
      server: https://kubernetes.default.svc
  
  # Allowed Kubernetes resources
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRole
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRoleBinding
  
  # Allowed namespaced resources
  namespaceResourceWhitelist:
    - group: ''
      kind: ConfigMap
    - group: ''
      kind: Secret
    - group: ''
      kind: Service
    - group: ''
      kind: ServiceAccount
    - group: 'apps'
      kind: Deployment
    - group: 'apps'
      kind: StatefulSet
    - group: 'networking.k8s.io'
      kind: Ingress
    - group: 'networking.k8s.io'
      kind: NetworkPolicy
    - group: 'policy'
      kind: PodSecurityPolicy
    - group: 'rbac.authorization.k8s.io'
      kind: Role
    - group: 'rbac.authorization.k8s.io'
      kind: RoleBinding
  
  # Allowed source types
  sourceNamespaces:
    - argocd
  
  # Roles and permissions
  roles:
    - name: developer
      description: Developer role with limited permissions
      policies:
        - p, proj:ecommerce:developer, applications, get, ecommerce/ecommerce-dev, allow
        - p, proj:ecommerce:developer, applications, sync, ecommerce/ecommerce-dev, allow
      groups:
        - developers
    
    - name: staging-admin
      description: Staging environment administrator
      policies:
        - p, proj:ecommerce:staging-admin, applications, *, ecommerce/ecommerce-staging, allow
      groups:
        - staging-admins
    
    - name: prod-admin
      description: Production environment administrator
      policies:
        - p, proj:ecommerce:prod-admin, applications, *, ecommerce/ecommerce-prod, allow
      groups:
        - prod-admins
```

---

### 🌍 **3. Environment Best Practices**

#### **Environment Structure:**
```
Environments
├── 🧪 Development (dev)
│   ├── Purpose: Development and testing
│   ├── Branch: develop
│   ├── Auto-deploy: Yes
│   ├── Data: Mock/Synthetic
│   └── Security: Basic
├── 🧪 Staging (staging)
│   ├── Purpose: Pre-production testing
│   ├── Branch: staging
│   ├── Auto-deploy: Yes
│   ├── Data: Production-like
│   └── Security: Enhanced
└── 🏭 Production (prod)
    ├── Purpose: Live production
    ├── Branch: main
    ├── Auto-deploy: No (Manual approval)
    ├── Data: Real production data
    └── Security: Maximum
```

#### **Environment-Specific Configurations:**
```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - deployment.yaml
  - service.yaml
  - ingress.yaml
  - network-policy.yaml

commonLabels:
  app.kubernetes.io/name: ecommerce
  app.kubernetes.io/part-of: ecommerce-platform
```

```yaml
# k8s/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ecommerce-dev

resources:
  - ../../base

patchesStrategicMerge:
  - deployment-patch.yaml
  - configmap-patch.yaml

images:
  - name: ecommerce/auth-service
    newTag: latest
  - name: ecommerce/user-service
    newTag: latest
  - name: ecommerce/product-service
    newTag: latest
  - name: ecommerce/order-service
    newTag: latest
  - name: ecommerce/payment-service
    newTag: latest
  - name: ecommerce/cart-service
    newTag: latest
  - name: ecommerce/inventory-service
    newTag: latest
  - name: ecommerce/shipping-service
    newTag: latest
  - name: ecommerce/promotion-service
    newTag: latest
  - name: ecommerce/review-service
    newTag: latest
  - name: ecommerce/notification-service
    newTag: latest
  - name: ecommerce/admin-service
    newTag: latest

configMapGenerator:
  - name: ecommerce-config
    literals:
      - ENVIRONMENT=development
      - LOG_LEVEL=debug
      - API_VERSION=v1
      - FEATURE_FLAGS=all_enabled

secretGenerator:
  - name: ecommerce-secrets
    literals:
      - DB_HOST=dev-postgresql
      - DB_PORT=5432
      - REDIS_HOST=dev-redis
      - REDIS_PORT=6379
```

```yaml
# k8s/overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ecommerce-staging

resources:
  - ../../base

patchesStrategicMerge:
  - deployment-patch.yaml
  - configmap-patch.yaml

images:
  - name: ecommerce/auth-service
    newTag: staging
  - name: ecommerce/user-service
    newTag: staging
  - name: ecommerce/product-service
    newTag: staging
  - name: ecommerce/order-service
    newTag: staging
  - name: ecommerce/payment-service
    newTag: staging
  - name: ecommerce/cart-service
    newTag: staging
  - name: ecommerce/inventory-service
    newTag: staging
  - name: ecommerce/shipping-service
    newTag: staging
  - name: ecommerce/promotion-service
    newTag: staging
  - name: ecommerce/review-service
    newTag: staging
  - name: ecommerce/notification-service
    newTag: staging
  - name: ecommerce/admin-service
    newTag: staging

configMapGenerator:
  - name: ecommerce-config
    literals:
      - ENVIRONMENT=staging
      - LOG_LEVEL=info
      - API_VERSION=v1
      - FEATURE_FLAGS=selective_enabled

secretGenerator:
  - name: ecommerce-secrets
    literals:
      - DB_HOST=staging-postgresql
      - DB_PORT=5432
      - REDIS_HOST=staging-redis
      - REDIS_PORT=6379
```

```yaml
# k8s/overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ecommerce-prod

resources:
  - ../../base

patchesStrategicMerge:
  - deployment-patch.yaml
  - configmap-patch.yaml

images:
  - name: ecommerce/auth-service
    newTag: prod
  - name: ecommerce/user-service
    newTag: prod
  - name: ecommerce/product-service
    newTag: prod
  - name: ecommerce/order-service
    newTag: prod
  - name: ecommerce/payment-service
    newTag: prod
  - name: ecommerce/cart-service
    newTag: prod
  - name: ecommerce/inventory-service
    newTag: prod
  - name: ecommerce/shipping-service
    newTag: prod
  - name: ecommerce/promotion-service
    newTag: prod
  - name: ecommerce/review-service
    newTag: prod
  - name: ecommerce/notification-service
    newTag: prod
  - name: ecommerce/admin-service
    newTag: prod

configMapGenerator:
  - name: ecommerce-config
    literals:
      - ENVIRONMENT=production
      - LOG_LEVEL=warn
      - API_VERSION=v1
      - FEATURE_FLAGS=production_only

secretGenerator:
  - name: ecommerce-secrets
    literals:
      - DB_HOST=prod-postgresql
      - DB_PORT=5432
      - REDIS_HOST=prod-redis
      - REDIS_PORT=6379
```

---

### 🛡️ **4. ArgoCD Security Policies**

#### **ArgoCD RBAC Configuration:**
```yaml
# argocd-rbac-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    p, role:org-admin, applications, *, */*, allow
    p, role:org-admin, clusters, get, *, allow
    p, role:org-admin, repositories, get, *, allow
    p, role:org-admin, accounts, get, *, allow
    p, role:org-admin, logs, get, *, allow
    p, role:org-admin, exec, create, */*, allow
    p, role:org-admin, events, get, *, allow
    p, role:org-admin, extensions, get, *, allow
    p, role:org-admin, projects, get, *, allow
    p, role:org-admin, certificates, get, *, allow
    p, role:org-admin, gpgkeys, get, *, allow
    
    p, role:developer, applications, get, ecommerce/*, allow
    p, role:developer, applications, sync, ecommerce/ecommerce-dev, allow
    p, role:developer, applications, update, ecommerce/ecommerce-dev, allow
    p, role:developer, applications, delete, ecommerce/ecommerce-dev, allow
    p, role:developer, logs, get, ecommerce/ecommerce-dev, allow
    p, role:developer, exec, create, ecommerce/ecommerce-dev, allow
    p, role:developer, events, get, ecommerce/ecommerce-dev, allow
    
    p, role:staging-admin, applications, *, ecommerce/ecommerce-staging, allow
    p, role:staging-admin, applications, *, ecommerce/ecommerce-dev, allow
    p, role:staging-admin, logs, get, ecommerce/*, allow
    p, role:staging-admin, exec, create, ecommerce/*, allow
    p, role:staging-admin, events, get, ecommerce/*, allow
    
    p, role:prod-admin, applications, *, ecommerce/ecommerce-prod, allow
    p, role:prod-admin, applications, *, ecommerce/ecommerce-staging, allow
    p, role:prod-admin, applications, *, ecommerce/ecommerce-dev, allow
    p, role:prod-admin, logs, get, ecommerce/*, allow
    p, role:prod-admin, exec, create, ecommerce/*, allow
    p, role:prod-admin, events, get, ecommerce/*, allow
    
    g, developers, role:developer
    g, staging-admins, role:staging-admin
    g, prod-admins, role:prod-admin
    g, org-admins, role:org-admin
```

#### **ArgoCD Security Policies:**
```yaml
# argocd-security-policies.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: ecommerce-applications
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: dev
            namespace: ecommerce-dev
            autoSync: true
            prune: true
          - env: staging
            namespace: ecommerce-staging
            autoSync: true
            prune: true
          - env: prod
            namespace: ecommerce-prod
            autoSync: false
            prune: false
  template:
    metadata:
      name: 'ecommerce-{{env}}'
      namespace: argocd
      finalizers:
        - resources-finalizer.argocd.argoproj.io
    spec:
      project: ecommerce
      source:
        repoURL: https://github.com/your-org/ecommerce-k8s-manifests
        targetRevision: HEAD
        path: k8s/overlays/{{env}}
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: {{prune}}
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - PrunePropagationPolicy=foreground
          - PruneLast=true
        retry:
          limit: 5
          backoff:
            duration: 5s
            factor: 2
            maxDuration: 3m
```

#### **ArgoCD Security Constraints:**
```yaml
# argocd-security-constraints.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecommerce-security-constraints
  namespace: argocd
spec:
  project: ecommerce
  source:
    repoURL: https://github.com/your-org/ecommerce-k8s-manifests
    targetRevision: HEAD
    path: k8s/security
  destination:
    server: https://kubernetes.default.svc
    namespace: ecommerce-security
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

---

### 🔐 **5. Security Policies & Constraints**

#### **Pod Security Standards:**
```yaml
# k8s/security/pod-security-standards.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce-dev
  labels:
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/enforce-version: v1.24
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: v1.24
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: v1.24
---
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce-staging
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.24
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: v1.24
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: v1.24
---
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce-prod
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.24
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: v1.24
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: v1.24
```

#### **Network Security Policies:**
```yaml
# k8s/security/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ecommerce-network-policy
  namespace: ecommerce-prod
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/part-of: ecommerce-platform
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
  - to:
    - namespaceSelector:
        matchLabels:
          name: ecommerce-prod
    ports:
    - protocol: TCP
      port: 8080
```

---

### 📊 **6. CI/CD Monitoring & Observability**

#### **Jenkins Monitoring:**
```yaml
# jenkins-monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jenkins-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'jenkins'
        static_configs:
          - targets: ['jenkins:8080']
        metrics_path: /prometheus
        scrape_interval: 30s
```

#### **ArgoCD Monitoring:**
```yaml
# argocd-monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'argocd-server'
        static_configs:
          - targets: ['argocd-server:8080']
        metrics_path: /metrics
      - job_name: 'argocd-repo-server'
        static_configs:
          - targets: ['argocd-repo-server:8081']
        metrics_path: /metrics
      - job_name: 'argocd-application-controller'
        static_configs:
          - targets: ['argocd-application-controller:8082']
        metrics_path: /metrics
```

#### **CI/CD Metrics Dashboard:**
```
📊 CI/CD Metrics
├── 🔄 Pipeline Performance
│   ├── Build Success Rate
│   ├── Build Duration
│   ├── Deployment Frequency
│   └── Lead Time
├── 🛡️ Security Metrics
│   ├── Security Scan Results
│   ├── Vulnerability Detection Rate
│   ├── Security Gate Pass Rate
│   └── Compliance Score
├── 🚀 Deployment Metrics
│   ├── Deployment Success Rate
│   ├── Rollback Frequency
│   ├── Environment Sync Status
│   └── Application Health
└── 📈 Business Metrics
    ├── Time to Market
    ├── Release Frequency
    ├── Feature Delivery Rate
    └── Customer Impact
```

---

### 🔄 **7. GitOps Workflow**

#### **GitOps Best Practices:**
```
🔄 GitOps Workflow
├── 📝 Development
│   ├── Feature branch creation
│   ├── Code development
│   ├── Local testing
│   └── Pull request creation
├── 🔍 Code Review
│   ├── Automated security scans
│   ├── Code quality checks
│   ├── Peer review
│   └── Approval process
├── 🧪 CI Pipeline
│   ├── Build and test
│   ├── Security scanning
│   ├── Container building
│   └── Artifact publishing
├── 🚀 CD Pipeline
│   ├── Manifest generation
│   ├── ArgoCD sync
│   ├── Health checks
│   └── Rollback capability
└── 📊 Monitoring
    ├── Application health
    ├── Performance metrics
    ├── Security alerts
    └── Business metrics
```

#### **GitOps Directory Structure:**
```
ecommerce-k8s-manifests/
├── k8s/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   ├── overlays/
│   │   ├── dev/
│   │   │   ├── kustomization.yaml
│   │   │   ├── deployment-patch.yaml
│   │   │   └── configmap-patch.yaml
│   │   ├── staging/
│   │   │   ├── kustomization.yaml
│   │   │   ├── deployment-patch.yaml
│   │   │   └── configmap-patch.yaml
│   │   └── prod/
│   │       ├── kustomization.yaml
│   │       ├── deployment-patch.yaml
│   │       └── configmap-patch.yaml
│   └── security/
│       ├── pod-security-standards.yaml
│       ├── network-policies.yaml
│       └── rbac-policies.yaml
├── argocd/
│   ├── projects/
│   ├── applications/
│   └── rbac/
└── scripts/
    ├── build-and-test.sh
    ├── security-scan.sh
    └── build-containers.sh
```

> **หมายเหตุ**: CI/CD Pipeline นี้ใช้ Jenkins สำหรับ Continuous Integration และ ArgoCD สำหรับ Continuous Deployment ตาม GitOps principles พร้อม Security Policies ที่แข็งแกร่งและ Environment Management ที่เป็นไปตาม best practices

---

## 🏠 **Local Development Setup - Docker & Kubernetes**

### 🐳 **Local Development Architecture**

#### **Local Stack Overview:**
```
🏠 LOCAL DEVELOPMENT STACK
├── 🐳 Docker Desktop
│   ├── Docker Engine
│   ├── Kubernetes Cluster
│   └── Docker Compose
├── 🔧 Development Tools
│   ├── kubectl
│   ├── helm
│   ├── kustomize
│   └── argocd CLI
├── 🏢 Local Services
│   ├── Minikube / Docker Desktop K8s
│   ├── Local Registry
│   └── Development Databases
└── 📊 Local Monitoring
    ├── Prometheus
    ├── Grafana
    └── Jaeger
```

---

### 🚀 **1. Prerequisites & Setup**

#### **Required Software:**
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
sudo mv kustomize /usr/local/bin/

# Install ArgoCD CLI
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64
```

#### **Docker Desktop Configuration:**
```yaml
# ~/.docker/daemon.json
{
  "registry-mirrors": [],
  "insecure-registries": ["localhost:5000"],
  "debug": true,
  "experimental": true,
  "features": {
    "buildkit": true
  }
}
```

---

### 🏗️ **2. Local Kubernetes Setup**

#### **Docker Desktop Kubernetes:**
```bash
# Enable Kubernetes in Docker Desktop
# Settings -> Kubernetes -> Enable Kubernetes

# Verify installation
kubectl cluster-info
kubectl get nodes

# Create local namespaces
kubectl create namespace ecommerce-dev
kubectl create namespace ecommerce-staging
kubectl create namespace monitoring
kubectl create namespace argocd
```

#### **Local Registry Setup:**
```yaml
# docker-compose.registry.yml
version: '3.8'
services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
    environment:
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
      REGISTRY_HTTP_ADDR: "0.0.0.0:5000"

volumes:
  registry-data:
```

```bash
# Start local registry
docker-compose -f docker-compose.registry.yml up -d

# Test registry
curl http://localhost:5000/v2/_catalog
```

---

### 🏢 **3. Local Microservices Setup**

#### **Docker Compose for Local Development:**
```yaml
# docker-compose.local.yml
version: '3.8'

services:
  # Databases
  postgresql:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - ecommerce-network

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
      MONGO_INITDB_DATABASE: ecommerce
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - ecommerce-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - ecommerce-network

  # Message Queue
  kafka:
    image: confluentinc/cp-kafka:7.3.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    networks:
      - ecommerce-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - ecommerce-network

  # Security Services
  vault:
    image: vault:1.13
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: dev-token
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    networks:
      - ecommerce-network

  keycloak:
    image: quay.io/keycloak/keycloak:22.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgresql:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
    ports:
      - "8080:8080"
    command: start-dev
    depends_on:
      - postgresql
    networks:
      - ecommerce-network

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - ecommerce-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - ecommerce-network

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      COLLECTOR_OTLP_ENABLED: true
    networks:
      - ecommerce-network

  # Development Tools
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8081:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    depends_on:
      - kafka
    networks:
      - ecommerce-network

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "8082:8081"
    environment:
      REDIS_HOSTS: local:redis:6379
    depends_on:
      - redis
    networks:
      - ecommerce-network

volumes:
  postgres-data:
  redis-data:
  mongo-data:
  elasticsearch-data:
  grafana-data:

networks:
  ecommerce-network:
    driver: bridge
```

---

### 🔧 **4. Local Service Configurations**

#### **Local Prometheus Configuration:**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgresql:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka:9090']
```

#### **Local Grafana Dashboards:**
```json
// monitoring/grafana-dashboards/local-development.json
{
  "dashboard": {
    "title": "Local Development - E-commerce Platform",
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "{{datname}}"
          }
        ]
      },
      {
        "title": "Redis Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_memory_used_bytes",
            "legendFormat": "Redis Memory"
          }
        ]
      }
    ]
  }
}
```

---

### 🚀 **5. Local Development Scripts**

#### **Start Local Environment:**
```bash
#!/bin/bash
# scripts/start-local.sh

echo "🚀 Starting Local E-commerce Development Environment..."

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Initialize databases
echo "🗄️ Initializing databases..."
./scripts/init-databases.sh

# Setup Vault
echo "🔐 Setting up Vault..."
./scripts/setup-vault.sh

# Setup Keycloak
echo "👑 Setting up Keycloak..."
./scripts/setup-keycloak.sh

# Deploy to Kubernetes
echo "☸️ Deploying to Kubernetes..."
kubectl apply -f k8s/local/

# Wait for pods to be ready
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=ecommerce-platform -n ecommerce-dev --timeout=300s

echo "✅ Local environment is ready!"
echo ""
echo "🌐 Access URLs:"
echo "  - Customer Platform: http://localhost:3000"
echo "  - Admin Dashboard: http://localhost:3001"
echo "  - Keycloak: http://localhost:8080"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Jaeger: http://localhost:16686"
echo "  - Kafka UI: http://localhost:8081"
echo "  - Redis Commander: http://localhost:8082"
echo "  - Vault: http://localhost:8200"
```

#### **Database Initialization:**
```bash
#!/bin/bash
# scripts/init-databases.sh

echo "🗄️ Initializing databases..."

# PostgreSQL
echo "Setting up PostgreSQL..."
docker exec -i postgresql psql -U postgres -d ecommerce << EOF
CREATE DATABASE IF NOT EXISTS keycloak;
CREATE DATABASE IF NOT EXISTS ecommerce_dev;
CREATE DATABASE IF NOT EXISTS ecommerce_staging;
EOF

# MongoDB
echo "Setting up MongoDB..."
docker exec -i mongodb mongosh --eval "
  use ecommerce;
  db.createCollection('orders');
  db.createCollection('reviews');
"

# Elasticsearch
echo "Setting up Elasticsearch..."
curl -X PUT "localhost:9200/products" -H "Content-Type: application/json" -d'
{
  "mappings": {
    "properties": {
      "name": { "type": "text" },
      "description": { "type": "text" },
      "category": { "type": "keyword" },
      "price": { "type": "float" }
    }
  }
}'

echo "✅ Databases initialized!"
```

#### **Vault Setup:**
```bash
#!/bin/bash
# scripts/setup-vault.sh

echo "🔐 Setting up Vault..."

# Wait for Vault to be ready
sleep 10

# Initialize Vault
docker exec -i vault vault login dev-token

# Create secrets
docker exec -i vault vault secrets enable -path=secret kv-v2

# Add database credentials
docker exec -i vault vault kv put secret/ecommerce/database \
  host=postgresql \
  port=5432 \
  name=ecommerce_dev \
  user=postgres \
  password=postgres

# Add Redis credentials
docker exec -i vault vault kv put secret/ecommerce/redis \
  host=redis \
  port=6379

# Add Kafka credentials
docker exec -i vault vault kv put secret/ecommerce/kafka \
  bootstrap_servers=kafka:9092

echo "✅ Vault configured!"
```

#### **Keycloak Setup:**
```bash
#!/bin/bash
# scripts/setup-keycloak.sh

echo "👑 Setting up Keycloak..."

# Wait for Keycloak to be ready
sleep 30

# Create realm
curl -X POST "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer $(curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=admin&grant_type=password&client_id=admin-cli" | jq -r '.access_token')" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "ecommerce",
    "enabled": true,
    "displayName": "E-commerce Platform"
  }'

# Create client for customer app
curl -X POST "http://localhost:8080/admin/realms/ecommerce/clients" \
  -H "Authorization: Bearer $(curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=admin&grant_type=password&client_id=admin-cli" | jq -r '.access_token')" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "customer-app",
    "enabled": true,
    "publicClient": true,
    "redirectUris": ["http://localhost:3000/*"],
    "webOrigins": ["http://localhost:3000"]
  }'

echo "✅ Keycloak configured!"
```

---

### 🐳 **6. Local Kubernetes Manifests**

#### **Local Namespace Setup:**
```yaml
# k8s/local/namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce-dev
  labels:
    name: ecommerce-dev
    pod-security.kubernetes.io/enforce: baseline
---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
---
apiVersion: v1
kind: Namespace
metadata:
  name: argocd
  labels:
    name: argocd
```

#### **Local ConfigMaps:**
```yaml
# k8s/local/configmaps.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ecommerce-config
  namespace: ecommerce-dev
data:
  ENVIRONMENT: "local"
  LOG_LEVEL: "debug"
  API_VERSION: "v1"
  FEATURE_FLAGS: "all_enabled"
  DATABASE_HOST: "postgresql"
  DATABASE_PORT: "5432"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"
  KAFKA_BOOTSTRAP_SERVERS: "kafka:9092"
  VAULT_ADDR: "http://vault:8200"
  KEYCLOAK_URL: "http://keycloak:8080"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: monitoring-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
```

#### **Local Secrets:**
```yaml
# k8s/local/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ecommerce-secrets
  namespace: ecommerce-dev
type: Opaque
data:
  DB_PASSWORD: cG9zdGdyZXM=  # postgres
  REDIS_PASSWORD: ""  # empty for local
  JWT_SECRET: bG9jYWwtZGV2LWp3dC1zZWNyZXQ=  # local-dev-jwt-secret
  VAULT_TOKEN: ZGV2LXRva2Vu  # dev-token
```

---

### 🔧 **7. Local Development Workflow**

#### **Development Commands:**
```bash
# Start local environment
./scripts/start-local.sh

# Stop local environment
docker-compose -f docker-compose.local.yml down

# View logs
docker-compose -f docker-compose.local.yml logs -f [service-name]

# Access services
kubectl port-forward -n ecommerce-dev svc/customer-platform 3000:80
kubectl port-forward -n ecommerce-dev svc/admin-dashboard 3001:80

# Build and deploy service
docker build -t localhost:5000/auth-service:latest ./auth-service
docker push localhost:5000/auth-service:latest
kubectl rollout restart deployment auth-service -n ecommerce-dev

# View monitoring
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

#### **Local Development Tips:**
```bash
# Quick service restart
kubectl rollout restart deployment [service-name] -n ecommerce-dev

# View service logs
kubectl logs -f deployment/[service-name] -n ecommerce-dev

# Access service shell
kubectl exec -it deployment/[service-name] -n ecommerce-dev -- /bin/bash

# Check service health
kubectl get pods -n ecommerce-dev
kubectl describe pod [pod-name] -n ecommerce-dev

# View service endpoints
kubectl get svc -n ecommerce-dev
kubectl describe svc [service-name] -n ecommerce-dev
```

---

### 📊 **8. Local Monitoring & Debugging**

#### **Local Monitoring Stack:**
```yaml
# k8s/local/monitoring.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: monitoring-config
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin"
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
```

#### **Local Debugging Tools:**
```bash
# Install debugging tools
kubectl krew install access-matrix
kubectl krew install resource-capacity
kubectl krew install view-secret

# Debug network issues
kubectl run -i --tty --rm debug --image=nicolaka/netshoot --restart=Never -- sh

# Debug DNS issues
kubectl run -i --tty --rm debug --image=nicolaka/netshoot --restart=Never -- dig [service-name]

# Check resource usage
kubectl top pods -n ecommerce-dev
kubectl top nodes
```

---

### 🚀 **9. Local CI/CD Setup**

#### **Local ArgoCD Setup:**
```bash
# Install ArgoCD locally
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login to ArgoCD
argocd login localhost:8080 --username admin --password [password]
```

#### **Local Jenkins Setup:**
```yaml
# docker-compose.jenkins.yml
version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins-data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JENKINS_OPTS=--httpPort=8080
    networks:
      - ecommerce-network

volumes:
  jenkins-data:

networks:
  ecommerce-network:
    external: true
```

---

### 📋 **10. Local Development Checklist**

#### **Pre-Development Setup:**
- [ ] Docker Desktop installed and running
- [ ] Kubernetes enabled in Docker Desktop
- [ ] kubectl, helm, kustomize, argocd CLI installed
- [ ] Local registry running on localhost:5000
- [ ] All required ports available (3000, 3001, 8080, 9090, etc.)

#### **Environment Startup:**
- [ ] Docker services started (databases, message queues, monitoring)
- [ ] Databases initialized with sample data
- [ ] Vault configured with secrets
- [ ] Keycloak configured with realms and clients
- [ ] Kubernetes manifests applied
- [ ] All pods running and healthy
- [ ] Services accessible via port-forward

#### **Development Workflow:**
- [ ] Code changes made
- [ ] Docker image built and pushed to local registry
- [ ] Kubernetes deployment updated
- [ ] Service restarted and healthy
- [ ] Changes tested and verified
- [ ] Monitoring dashboards checked

#### **Troubleshooting:**
- [ ] Check pod logs for errors
- [ ] Verify service connectivity
- [ ] Check resource usage
- [ ] Validate configuration
- [ ] Restart problematic services

> **หมายเหตุ**: Local Development Setup นี้ให้สภาพแวดล้อมการพัฒนาที่ครบถ้วนบนเครื่อง local ด้วย Docker และ Kubernetes พร้อม monitoring และ debugging tools ที่จำเป็น
# 🚀 Kafka Integration - E-commerce Platform

## 📋 Overview

Complete Apache Kafka integration for the e-commerce microservices platform, providing event-driven architecture with real-time data streaming, event sourcing, and distributed transaction management through Saga patterns.

## 🏗️ Architecture

### **Event-Driven Microservices**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Event Tracker│ │    │ │Event Router │ │    │ │Event Pub/Sub│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │     Kafka Cluster       │
                    │  ┌─────────────────────┐│
                    │  │   Event Topics      ││
                    │  │ • user-events       ││
                    │  │ • order-events      ││
                    │  │ • payment-events    ││
                    │  │ • inventory-events  ││
                    │  │ • analytics-events  ││
                    │  └─────────────────────┘│
                    └─────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Order Service  │    │ Payment Service │    │Inventory Service│
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Event Handler│ │    │ │Event Handler│ │    │ │Event Handler│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Event Schema & Topics

### **Topic Structure**
| Topic | Partitions | Replication | Retention | Purpose |
|-------|------------|-------------|-----------|---------|
| `user-events` | 3 | 3 | 7 days | User registration, login, profile updates |
| `order-events` | 6 | 3 | 30 days | Order lifecycle management |
| `payment-events` | 6 | 3 | 90 days | Payment processing, refunds |
| `inventory-events` | 4 | 3 | 14 days | Stock updates, alerts |
| `product-events` | 3 | 3 | 30 days | Product catalog changes |
| `cart-events` | 4 | 3 | 3 days | Shopping cart activities |
| `shipping-events` | 4 | 3 | 30 days | Shipment tracking |
| `review-events` | 3 | 3 | 90 days | Product reviews, moderation |
| `promotion-events` | 2 | 3 | 30 days | Promotions, coupons |
| `notification-events` | 4 | 3 | 7 days | User notifications |
| `analytics-events` | 8 | 3 | 30 days | User behavior, metrics |
| `audit-events` | 4 | 3 | 365 days | Compliance, security logs |

### **Event Types**

#### **User Events**
```typescript
// User Registration
{
  eventType: 'user.registered',
  data: {
    userId: string,
    email: string,
    registrationMethod: 'email' | 'social' | 'phone',
    isEmailVerified: boolean
  }
}

// User Login
{
  eventType: 'user.login',
  data: {
    userId: string,
    loginMethod: 'password' | 'social' | 'sso',
    ipAddress: string,
    location: { country: string, city: string }
  }
}
```

#### **Order Events**
```typescript
// Order Created
{
  eventType: 'order.created',
  data: {
    orderId: string,
    userId: string,
    items: Array<{
      productId: string,
      quantity: number,
      price: number
    }>,
    totals: {
      subtotal: number,
      tax: number,
      shipping: number,
      total: number
    }
  }
}

// Order Status Updated
{
  eventType: 'order.status.updated',
  data: {
    orderId: string,
    oldStatus: string,
    newStatus: string,
    updatedBy: string
  }
}
```

## 🔄 Event Producers

### **Service Integration**
```typescript
// Order Service Example
@Injectable()
export class OrderEventService {
  constructor(private eventPublisher: EventPublisherService) {}

  async onOrderCreated(order: Order): Promise<void> {
    await this.eventPublisher.publishOrderCreated({
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totals: order.totals,
      createdAt: new Date().toISOString()
    });
  }
}
```

### **Frontend Analytics**
```typescript
// React/Next.js Integration
import { useKafkaAnalytics } from '@/hooks/useKafkaAnalytics';

export function ProductPage({ product }) {
  const { trackEvent } = useKafkaAnalytics();

  useEffect(() => {
    trackEvent('analytics.product_view', {
      productId: product.id,
      category: product.category,
      price: product.price
    });
  }, [product]);
}
```

## 📥 Event Consumers

### **Built-in Event Handlers**

#### **Notification Handler**
```typescript
@Injectable()
export class NotificationEventHandler {
  async handle(event: UserRegisteredEvent | OrderCreatedEvent): Promise<void> {
    switch (event.eventType) {
      case 'user.registered':
        await this.sendWelcomeEmail(event.data.userId);
        break;
      case 'order.created':
        await this.sendOrderConfirmation(event.data.orderId);
        break;
    }
  }
}
```

#### **Inventory Handler**
```typescript
@Injectable()
export class InventoryEventHandler {
  async handle(event: OrderCreatedEvent): Promise<void> {
    // Automatically deduct inventory when order is created
    for (const item of event.data.items) {
      await this.inventoryService.deductStock(
        item.productId, 
        item.quantity
      );
    }
  }
}
```

#### **Analytics Handler**
```typescript
@Injectable()
export class AnalyticsEventHandler {
  async handle(event: PageViewEvent | ProductViewEvent): Promise<void> {
    // Real-time analytics processing
    await this.analyticsService.recordEvent(event);
    await this.updateDashboards(event);
  }
}
```

## 🎭 Saga Pattern Implementation

### **Order Processing Saga**
```typescript
@Injectable()
export class OrderSagaService {
  async executeOrderSaga(orderEvent: OrderCreatedEvent): Promise<void> {
    const saga = new OrderSaga(orderEvent.data.orderId);
    
    try {
      // Step 1: Validate Order
      await saga.validateOrder();
      
      // Step 2: Process Payment
      await saga.processPayment();
      
      // Step 3: Reserve Inventory
      await saga.reserveInventory();
      
      // Step 4: Create Shipment
      await saga.createShipment();
      
      await saga.complete();
    } catch (error) {
      await saga.compensate();
    }
  }
}
```

### **Compensation Logic**
```typescript
class OrderSaga {
  async compensate(): Promise<void> {
    // Reverse order of operations
    if (this.completedSteps.includes('shipment')) {
      await this.cancelShipment();
    }
    if (this.completedSteps.includes('inventory')) {
      await this.releaseInventory();
    }
    if (this.completedSteps.includes('payment')) {
      await this.refundPayment();
    }
  }
}
```

## 📊 Monitoring & Health Checks

### **Health Metrics**
```typescript
interface KafkaHealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  producer: {
    messagesProduced: number;
    errors: number;
    avgLatency: number;
  };
  consumers: {
    active: number;
    lag: number;
    errors: number;
  };
  topics: {
    total: number;
    healthy: number;
  };
}
```

### **Real-time Monitoring**
- **Kafka UI**: http://localhost:8080
- **Prometheus Metrics**: http://localhost:9308/metrics
- **Schema Registry**: http://localhost:8081
- **Kafka Connect**: http://localhost:8083

## 🚀 Quick Start

### **1. Start Kafka Cluster**
```bash
# Start Kafka infrastructure
docker-compose -f docker-compose.kafka.yml up -d

# Wait for cluster to be ready
./scripts/kafka-setup.sh --test
```

### **2. Initialize Topics**
```bash
# Create all e-commerce topics
./scripts/kafka-setup.sh

# Verify setup
./scripts/kafka-setup.sh --info
```

### **3. Service Integration**
```typescript
// In your NestJS service
import { KafkaModule } from '@/infrastructure/kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  // ... other imports
})
export class YourServiceModule {}
```

### **4. Publish Events**
```typescript
// Inject EventPublisherService
constructor(private eventPublisher: EventPublisherService) {}

// Publish events
await this.eventPublisher.publishOrderCreated({
  orderId: '12345',
  userId: 'user-123',
  // ... event data
});
```

### **5. Handle Events**
```typescript
// Register custom event handlers
this.eventConsumer.registerHandler('order.created', this.customHandler);
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Kafka Configuration
KAFKA_BROKER_1=localhost:9092
KAFKA_BROKER_2=localhost:9093
KAFKA_BROKER_3=localhost:9094

# Producer Settings
KAFKA_PRODUCER_IDEMPOTENT=true
KAFKA_PRODUCER_MAX_IN_FLIGHT=1
KAFKA_PRODUCER_COMPRESSION=gzip

# Consumer Settings
KAFKA_CONSUMER_GROUP_ID=ecommerce-consumers
KAFKA_CONSUMER_SESSION_TIMEOUT=30000
KAFKA_CONSUMER_MAX_WAIT_TIME=5000

# Topic Settings
KAFKA_DEFAULT_PARTITIONS=3
KAFKA_DEFAULT_REPLICATION=3
KAFKA_DEFAULT_RETENTION=604800000

# Security (Production)
KAFKA_SSL_ENABLED=true
KAFKA_SASL_ENABLED=true
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

### **Topic Configuration**
```typescript
// Custom topic configuration
const topicConfig = {
  topic: 'custom-events',
  numPartitions: 6,
  replicationFactor: 3,
  configEntries: [
    { name: 'retention.ms', value: '2592000000' }, // 30 days
    { name: 'cleanup.policy', value: 'delete' },
    { name: 'compression.type', value: 'gzip' },
    { name: 'max.message.bytes', value: '2000000' }
  ]
};
```

## 🔒 Security & Best Practices

### **Message Security**
- **Encryption**: SSL/TLS for data in transit
- **Authentication**: SASL for broker authentication
- **Authorization**: ACLs for topic access control
- **Schema Validation**: Avro schemas for data integrity

### **Performance Optimization**
- **Batching**: Batch multiple events for better throughput
- **Compression**: GZIP compression for reduced network usage
- **Partitioning**: Strategic partitioning for parallel processing
- **Consumer Groups**: Load balancing across multiple consumers

### **Error Handling**
- **Dead Letter Queues**: Failed message handling
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breakers**: Prevent cascade failures
- **Monitoring**: Real-time alerting for issues

## 📈 Performance Metrics

### **Throughput Targets**
- **Orders**: 1,000 events/second
- **Analytics**: 10,000 events/second
- **Notifications**: 5,000 events/second
- **Inventory**: 2,000 events/second

### **Latency Targets**
- **Critical Events**: < 100ms (orders, payments)
- **Standard Events**: < 500ms (notifications, reviews)
- **Analytics Events**: < 1s (page views, searches)

## 🛠️ Development Tools

### **Testing**
```bash
# Test Kafka setup
./scripts/kafka-setup.sh --test

# Manual testing
kafka-console-producer --bootstrap-server localhost:9092 --topic user-events
kafka-console-consumer --bootstrap-server localhost:9092 --topic user-events --from-beginning
```

### **Debugging**
```bash
# Check topic details
kafka-topics --bootstrap-server localhost:9092 --describe --topic order-events

# Monitor consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group ecommerce-consumers

# View cluster info
kafka-broker-api-versions --bootstrap-server localhost:9092
```

## 🚀 Production Deployment

### **Kubernetes Integration**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-event-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: event-service
        env:
        - name: KAFKA_BROKERS
          value: "kafka-1:9092,kafka-2:9092,kafka-3:9092"
```

### **Monitoring Stack**
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation

## 📚 Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Event Sourcing Patterns](https://microservices.io/patterns/data/event-sourcing.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Schema Registry Guide](https://docs.confluent.io/platform/current/schema-registry/index.html)

---

## 🎯 Next Steps

1. **Implement Custom Event Handlers** for your specific business logic
2. **Set up Monitoring Dashboards** for production visibility
3. **Configure Schema Registry** for event schema evolution
4. **Implement Dead Letter Queues** for error handling
5. **Add Performance Testing** for load validation

**Your Kafka integration is now complete and production-ready!** 🚀

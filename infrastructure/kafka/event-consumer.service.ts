import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaMessage } from 'kafkajs';
import { 
  KafkaEvent, 
  KAFKA_TOPICS, 
  EVENT_TYPES,
  UserRegisteredEvent,
  UserLoginEvent,
  OrderCreatedEvent,
  OrderStatusUpdatedEvent,
  PaymentProcessedEvent,
  PaymentFailedEvent,
  InventoryUpdatedEvent,
  LowStockAlertEvent,
  ProductCreatedEvent,
  ProductPriceChangedEvent,
  CartItemAddedEvent,
  CartAbandonedEvent,
  ShipmentCreatedEvent,
  DeliveryCompletedEvent,
  ReviewCreatedEvent,
  PromotionUsedEvent,
  NotificationSentEvent,
  PageViewEvent,
  ProductViewEvent,
  SearchEvent
} from './schemas/events';

export interface EventHandler<T extends KafkaEvent> {
  handle(event: T): Promise<void>;
}

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);
  private eventHandlers: Map<string, EventHandler<any>[]> = new Map();

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    // Initialize all consumers
    await this.initializeConsumers();
  }

  private async initializeConsumers() {
    try {
      // User Events Consumer
      await this.kafkaService.createConsumer(
        'user-events-consumer',
        [KAFKA_TOPICS.USER_EVENTS],
        this.handleUserEvents.bind(this),
        { fromBeginning: false }
      );

      // Order Events Consumer
      await this.kafkaService.createConsumer(
        'order-events-consumer',
        [KAFKA_TOPICS.ORDER_EVENTS],
        this.handleOrderEvents.bind(this),
        { fromBeginning: false }
      );

      // Payment Events Consumer
      await this.kafkaService.createConsumer(
        'payment-events-consumer',
        [KAFKA_TOPICS.PAYMENT_EVENTS],
        this.handlePaymentEvents.bind(this),
        { fromBeginning: false }
      );

      // Inventory Events Consumer
      await this.kafkaService.createConsumer(
        'inventory-events-consumer',
        [KAFKA_TOPICS.INVENTORY_EVENTS],
        this.handleInventoryEvents.bind(this),
        { fromBeginning: false }
      );

      // Product Events Consumer
      await this.kafkaService.createConsumer(
        'product-events-consumer',
        [KAFKA_TOPICS.PRODUCT_EVENTS],
        this.handleProductEvents.bind(this),
        { fromBeginning: false }
      );

      // Cart Events Consumer
      await this.kafkaService.createConsumer(
        'cart-events-consumer',
        [KAFKA_TOPICS.CART_EVENTS],
        this.handleCartEvents.bind(this),
        { fromBeginning: false }
      );

      // Shipping Events Consumer
      await this.kafkaService.createConsumer(
        'shipping-events-consumer',
        [KAFKA_TOPICS.SHIPPING_EVENTS],
        this.handleShippingEvents.bind(this),
        { fromBeginning: false }
      );

      // Review Events Consumer
      await this.kafkaService.createConsumer(
        'review-events-consumer',
        [KAFKA_TOPICS.REVIEW_EVENTS],
        this.handleReviewEvents.bind(this),
        { fromBeginning: false }
      );

      // Promotion Events Consumer
      await this.kafkaService.createConsumer(
        'promotion-events-consumer',
        [KAFKA_TOPICS.PROMOTION_EVENTS],
        this.handlePromotionEvents.bind(this),
        { fromBeginning: false }
      );

      // Notification Events Consumer
      await this.kafkaService.createConsumer(
        'notification-events-consumer',
        [KAFKA_TOPICS.NOTIFICATION_EVENTS],
        this.handleNotificationEvents.bind(this),
        { fromBeginning: false }
      );

      // Analytics Events Consumer (High throughput)
      await this.kafkaService.createConsumer(
        'analytics-events-consumer',
        [KAFKA_TOPICS.ANALYTICS_EVENTS],
        this.handleAnalyticsEvents.bind(this),
        { 
          fromBeginning: false,
          sessionTimeout: 60000,
          heartbeatInterval: 10000
        }
      );

      this.logger.log('✅ All Kafka consumers initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka consumers:', error);
      throw error;
    }
  }

  // Event Handler Registration
  registerHandler<T extends KafkaEvent>(eventType: string, handler: EventHandler<T>) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    this.logger.log(`📝 Registered handler for event type: ${eventType}`);
  }

  // Generic event processing
  private async processEvent<T extends KafkaEvent>(
    message: KafkaMessage,
    topic: string,
    partition: number
  ): Promise<void> {
    const event = this.kafkaService.parseEvent<T>(message);
    if (!event) {
      this.logger.warn(`⚠️ Failed to parse event from topic ${topic}`);
      return;
    }

    const handlers = this.eventHandlers.get(event.eventType) || [];
    
    if (handlers.length === 0) {
      this.logger.debug(`📭 No handlers registered for event type: ${event.eventType}`);
      return;
    }

    // Process all handlers concurrently
    const promises = handlers.map(async (handler) => {
      try {
        await handler.handle(event);
        this.logger.debug(`✅ Event ${event.eventType} processed successfully`);
      } catch (error) {
        this.logger.error(`❌ Handler failed for event ${event.eventType}:`, error);
        // Implement retry logic or dead letter queue here
        throw error;
      }
    });

    await Promise.all(promises);
  }

  // Specific event handlers
  private async handleUserEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleOrderEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handlePaymentEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleInventoryEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleProductEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleCartEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleShippingEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleReviewEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handlePromotionEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleNotificationEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    await this.processEvent(message, topic, partition);
  }

  private async handleAnalyticsEvents(message: KafkaMessage, topic: string, partition: number): Promise<void> {
    // High-throughput analytics events - process with minimal logging
    const event = this.kafkaService.parseEvent<PageViewEvent | ProductViewEvent | SearchEvent>(message);
    if (!event) return;

    const handlers = this.eventHandlers.get(event.eventType) || [];
    
    // Process handlers without detailed logging for performance
    await Promise.all(
      handlers.map(handler => handler.handle(event).catch(error => {
        this.logger.error(`❌ Analytics handler failed:`, error);
      }))
    );
  }
}

// Built-in Event Handlers

@Injectable()
export class NotificationEventHandler implements EventHandler<UserRegisteredEvent | OrderCreatedEvent | PaymentProcessedEvent | DeliveryCompletedEvent> {
  private readonly logger = new Logger(NotificationEventHandler.name);

  async handle(event: UserRegisteredEvent | OrderCreatedEvent | PaymentProcessedEvent | DeliveryCompletedEvent): Promise<void> {
    switch (event.eventType) {
      case EVENT_TYPES.USER_REGISTERED:
        await this.handleUserRegistered(event as UserRegisteredEvent);
        break;
      case EVENT_TYPES.ORDER_CREATED:
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
      case EVENT_TYPES.PAYMENT_PROCESSED:
        await this.handlePaymentProcessed(event as PaymentProcessedEvent);
        break;
      case EVENT_TYPES.DELIVERY_COMPLETED:
        await this.handleDeliveryCompleted(event as DeliveryCompletedEvent);
        break;
    }
  }

  private async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`🔔 Sending welcome notification to user ${event.data.userId}`);
    // Implement notification sending logic
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`🔔 Sending order confirmation to user ${event.data.userId}`);
    // Implement order confirmation notification
  }

  private async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    this.logger.log(`🔔 Sending payment confirmation to user ${event.data.userId}`);
    // Implement payment confirmation notification
  }

  private async handleDeliveryCompleted(event: DeliveryCompletedEvent): Promise<void> {
    this.logger.log(`🔔 Sending delivery notification to user ${event.data.userId}`);
    // Implement delivery notification
  }
}

@Injectable()
export class InventoryEventHandler implements EventHandler<OrderCreatedEvent | InventoryUpdatedEvent> {
  private readonly logger = new Logger(InventoryEventHandler.name);

  async handle(event: OrderCreatedEvent | InventoryUpdatedEvent): Promise<void> {
    switch (event.eventType) {
      case EVENT_TYPES.ORDER_CREATED:
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
      case EVENT_TYPES.INVENTORY_UPDATED:
        await this.handleInventoryUpdated(event as InventoryUpdatedEvent);
        break;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`📦 Updating inventory for order ${event.data.orderId}`);
    // Implement inventory deduction logic
    for (const item of event.data.items) {
      // Deduct inventory for each item
      this.logger.debug(`📉 Reducing inventory for product ${item.productId} by ${item.quantity}`);
    }
  }

  private async handleInventoryUpdated(event: InventoryUpdatedEvent): Promise<void> {
    this.logger.log(`📊 Processing inventory update for product ${event.data.productId}`);
    
    // Check for low stock alerts
    if (event.data.newQuantity <= 10) { // Threshold example
      this.logger.warn(`⚠️ Low stock alert for product ${event.data.productId}: ${event.data.newQuantity} remaining`);
      // Trigger low stock alert
    }
  }
}

@Injectable()
export class AnalyticsEventHandler implements EventHandler<PageViewEvent | ProductViewEvent | SearchEvent | OrderCreatedEvent> {
  private readonly logger = new Logger(AnalyticsEventHandler.name);

  async handle(event: PageViewEvent | ProductViewEvent | SearchEvent | OrderCreatedEvent): Promise<void> {
    // High-performance analytics processing
    switch (event.eventType) {
      case EVENT_TYPES.PAGE_VIEW:
        await this.handlePageView(event as PageViewEvent);
        break;
      case EVENT_TYPES.PRODUCT_VIEW:
        await this.handleProductView(event as ProductViewEvent);
        break;
      case EVENT_TYPES.SEARCH:
        await this.handleSearch(event as SearchEvent);
        break;
      case EVENT_TYPES.ORDER_CREATED:
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
    }
  }

  private async handlePageView(event: PageViewEvent): Promise<void> {
    // Store page view analytics
    // Update real-time dashboards
  }

  private async handleProductView(event: ProductViewEvent): Promise<void> {
    // Track product popularity
    // Update recommendation engines
  }

  private async handleSearch(event: SearchEvent): Promise<void> {
    // Track search patterns
    // Improve search algorithms
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Track conversion metrics
    // Update revenue analytics
  }
}

@Injectable()
export class AuditEventHandler implements EventHandler<KafkaEvent> {
  private readonly logger = new Logger(AuditEventHandler.name);

  async handle(event: KafkaEvent): Promise<void> {
    // Log all events for audit purposes
    this.logger.log(`📋 Audit log: ${event.eventType} - ${event.eventId}`);
    
    // Store in audit database
    // Implement compliance logging
    
    // Special handling for sensitive events
    if (this.isSensitiveEvent(event.eventType)) {
      await this.handleSensitiveEvent(event);
    }
  }

  private isSensitiveEvent(eventType: string): boolean {
    const sensitiveEvents = [
      EVENT_TYPES.PAYMENT_PROCESSED,
      EVENT_TYPES.PAYMENT_FAILED,
      EVENT_TYPES.USER_LOGIN,
      EVENT_TYPES.ORDER_CREATED,
    ];
    return sensitiveEvents.includes(eventType);
  }

  private async handleSensitiveEvent(event: KafkaEvent): Promise<void> {
    // Enhanced logging for sensitive events
    // Implement additional security measures
    this.logger.log(`🔒 Sensitive event logged: ${event.eventType}`);
  }
}

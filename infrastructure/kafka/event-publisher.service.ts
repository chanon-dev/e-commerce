import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from './kafka.service';
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

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  // User Events
  async publishUserRegistered(data: Omit<UserRegisteredEvent['data'], never>, metadata?: {
    correlationId?: string;
    userId?: string;
  }): Promise<void> {
    const event: UserRegisteredEvent = {
      eventId: '',
      eventType: EVENT_TYPES.USER_REGISTERED,
      timestamp: '',
      version: '1.0',
      source: 'user-service',
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event, {
      key: data.userId,
    });

    this.logger.log(`👤 Published user registered event for user ${data.userId}`);
  }

  async publishUserLogin(data: Omit<UserLoginEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: UserLoginEvent = {
      eventId: '',
      eventType: EVENT_TYPES.USER_LOGIN,
      timestamp: '',
      version: '1.0',
      source: 'auth-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, event, {
      key: data.userId,
    });

    this.logger.log(`🔐 Published user login event for user ${data.userId}`);
  }

  // Order Events
  async publishOrderCreated(data: Omit<OrderCreatedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: OrderCreatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.ORDER_CREATED,
      timestamp: '',
      version: '1.0',
      source: 'order-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.ORDER_EVENTS, event, {
      key: data.orderId,
    });

    this.logger.log(`📦 Published order created event for order ${data.orderId}`);
  }

  async publishOrderStatusUpdated(data: Omit<OrderStatusUpdatedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: OrderStatusUpdatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.ORDER_STATUS_UPDATED,
      timestamp: '',
      version: '1.0',
      source: 'order-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.ORDER_EVENTS, event, {
      key: data.orderId,
    });

    this.logger.log(`📋 Published order status updated event for order ${data.orderId}`);
  }

  // Payment Events
  async publishPaymentProcessed(data: Omit<PaymentProcessedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: PaymentProcessedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PAYMENT_PROCESSED,
      timestamp: '',
      version: '1.0',
      source: 'payment-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.PAYMENT_EVENTS, event, {
      key: data.paymentId,
    });

    this.logger.log(`💳 Published payment processed event for payment ${data.paymentId}`);
  }

  async publishPaymentFailed(data: Omit<PaymentFailedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: PaymentFailedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PAYMENT_FAILED,
      timestamp: '',
      version: '1.0',
      source: 'payment-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.PAYMENT_EVENTS, event, {
      key: data.paymentId,
    });

    this.logger.log(`❌ Published payment failed event for payment ${data.paymentId}`);
  }

  // Inventory Events
  async publishInventoryUpdated(data: Omit<InventoryUpdatedEvent['data'], never>, metadata?: {
    correlationId?: string;
    userId?: string;
  }): Promise<void> {
    const event: InventoryUpdatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.INVENTORY_UPDATED,
      timestamp: '',
      version: '1.0',
      source: 'inventory-service',
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.INVENTORY_EVENTS, event, {
      key: data.productId,
    });

    this.logger.log(`📊 Published inventory updated event for product ${data.productId}`);
  }

  async publishLowStockAlert(data: Omit<LowStockAlertEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: LowStockAlertEvent = {
      eventId: '',
      eventType: EVENT_TYPES.LOW_STOCK_ALERT,
      timestamp: '',
      version: '1.0',
      source: 'inventory-service',
      correlationId: metadata?.correlationId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.INVENTORY_EVENTS, event, {
      key: data.productId,
    });

    this.logger.log(`⚠️ Published low stock alert for product ${data.productId}`);
  }

  // Product Events
  async publishProductCreated(data: Omit<ProductCreatedEvent['data'], never>, metadata?: {
    correlationId?: string;
    userId?: string;
  }): Promise<void> {
    const event: ProductCreatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PRODUCT_CREATED,
      timestamp: '',
      version: '1.0',
      source: 'product-service',
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.PRODUCT_EVENTS, event, {
      key: data.productId,
    });

    this.logger.log(`🛍️ Published product created event for product ${data.productId}`);
  }

  async publishProductPriceChanged(data: Omit<ProductPriceChangedEvent['data'], never>, metadata?: {
    correlationId?: string;
    userId?: string;
  }): Promise<void> {
    const event: ProductPriceChangedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PRODUCT_PRICE_CHANGED,
      timestamp: '',
      version: '1.0',
      source: 'product-service',
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.PRODUCT_EVENTS, event, {
      key: data.productId,
    });

    this.logger.log(`💰 Published product price changed event for product ${data.productId}`);
  }

  // Cart Events
  async publishCartItemAdded(data: Omit<CartItemAddedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: CartItemAddedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.CART_ITEM_ADDED,
      timestamp: '',
      version: '1.0',
      source: 'cart-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      sessionId: data.sessionId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.CART_EVENTS, event, {
      key: data.cartId,
    });

    this.logger.log(`🛒 Published cart item added event for cart ${data.cartId}`);
  }

  async publishCartAbandoned(data: Omit<CartAbandonedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: CartAbandonedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.CART_ABANDONED,
      timestamp: '',
      version: '1.0',
      source: 'cart-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      sessionId: data.sessionId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.CART_EVENTS, event, {
      key: data.cartId,
    });

    this.logger.log(`🛒 Published cart abandoned event for cart ${data.cartId}`);
  }

  // Shipping Events
  async publishShipmentCreated(data: Omit<ShipmentCreatedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: ShipmentCreatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.SHIPMENT_CREATED,
      timestamp: '',
      version: '1.0',
      source: 'shipping-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.SHIPPING_EVENTS, event, {
      key: data.shipmentId,
    });

    this.logger.log(`📦 Published shipment created event for shipment ${data.shipmentId}`);
  }

  async publishDeliveryCompleted(data: Omit<DeliveryCompletedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: DeliveryCompletedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.DELIVERY_COMPLETED,
      timestamp: '',
      version: '1.0',
      source: 'shipping-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.SHIPPING_EVENTS, event, {
      key: data.shipmentId,
    });

    this.logger.log(`✅ Published delivery completed event for shipment ${data.shipmentId}`);
  }

  // Review Events
  async publishReviewCreated(data: Omit<ReviewCreatedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: ReviewCreatedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.REVIEW_CREATED,
      timestamp: '',
      version: '1.0',
      source: 'review-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.REVIEW_EVENTS, event, {
      key: data.reviewId,
    });

    this.logger.log(`⭐ Published review created event for review ${data.reviewId}`);
  }

  // Promotion Events
  async publishPromotionUsed(data: Omit<PromotionUsedEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: PromotionUsedEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PROMOTION_USED,
      timestamp: '',
      version: '1.0',
      source: 'promotion-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.PROMOTION_EVENTS, event, {
      key: data.promotionId,
    });

    this.logger.log(`🎟️ Published promotion used event for promotion ${data.promotionId}`);
  }

  // Notification Events
  async publishNotificationSent(data: Omit<NotificationSentEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: NotificationSentEvent = {
      eventId: '',
      eventType: EVENT_TYPES.NOTIFICATION_SENT,
      timestamp: '',
      version: '1.0',
      source: 'notification-service',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.NOTIFICATION_EVENTS, event, {
      key: data.notificationId,
    });

    this.logger.log(`🔔 Published notification sent event for notification ${data.notificationId}`);
  }

  // Analytics Events
  async publishPageView(data: Omit<PageViewEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: PageViewEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PAGE_VIEW,
      timestamp: '',
      version: '1.0',
      source: 'frontend',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      sessionId: data.sessionId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.ANALYTICS_EVENTS, event, {
      key: data.sessionId,
    });

    this.logger.debug(`📊 Published page view event for page ${data.page}`);
  }

  async publishProductView(data: Omit<ProductViewEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: ProductViewEvent = {
      eventId: '',
      eventType: EVENT_TYPES.PRODUCT_VIEW,
      timestamp: '',
      version: '1.0',
      source: 'frontend',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      sessionId: data.sessionId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.ANALYTICS_EVENTS, event, {
      key: data.productId,
    });

    this.logger.debug(`📊 Published product view event for product ${data.productId}`);
  }

  async publishSearch(data: Omit<SearchEvent['data'], never>, metadata?: {
    correlationId?: string;
  }): Promise<void> {
    const event: SearchEvent = {
      eventId: '',
      eventType: EVENT_TYPES.SEARCH,
      timestamp: '',
      version: '1.0',
      source: 'frontend',
      correlationId: metadata?.correlationId,
      userId: data.userId,
      sessionId: data.sessionId,
      data,
    };

    await this.kafkaService.publishEvent(KAFKA_TOPICS.ANALYTICS_EVENTS, event, {
      key: data.sessionId,
    });

    this.logger.debug(`🔍 Published search event for query "${data.query}"`);
  }

  // Batch publishing for high-volume events
  async publishAnalyticsBatch(events: (PageViewEvent | ProductViewEvent | SearchEvent)[]): Promise<void> {
    await this.kafkaService.publishBatch(
      KAFKA_TOPICS.ANALYTICS_EVENTS,
      events,
      {
        keyExtractor: (event) => event.sessionId || event.eventId,
      }
    );

    this.logger.debug(`📊 Published ${events.length} analytics events in batch`);
  }
}

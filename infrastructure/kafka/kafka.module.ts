import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { EventPublisherService } from './event-publisher.service';
import { 
  EventConsumerService, 
  NotificationEventHandler, 
  InventoryEventHandler, 
  AnalyticsEventHandler, 
  AuditEventHandler 
} from './event-consumer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    KafkaService,
    EventPublisherService,
    EventConsumerService,
    
    // Built-in Event Handlers
    NotificationEventHandler,
    InventoryEventHandler,
    AnalyticsEventHandler,
    AuditEventHandler,
    
    // Configuration provider
    {
      provide: 'KAFKA_CONFIG',
      useFactory: () => ({
        retryAttempts: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.KAFKA_RETRY_DELAY || '1000'),
        enableDeadLetterQueue: process.env.KAFKA_ENABLE_DLQ === 'true',
        deadLetterQueueTopic: process.env.KAFKA_DLQ_TOPIC || 'dead-letter-queue',
        enableMetrics: process.env.KAFKA_ENABLE_METRICS !== 'false',
        metricsInterval: parseInt(process.env.KAFKA_METRICS_INTERVAL || '30000'),
      }),
    },
  ],
  exports: [
    KafkaService,
    EventPublisherService,
    EventConsumerService,
    NotificationEventHandler,
    InventoryEventHandler,
    AnalyticsEventHandler,
    AuditEventHandler,
  ],
})
export class KafkaModule {
  constructor(
    private readonly eventConsumerService: EventConsumerService,
    private readonly notificationEventHandler: NotificationEventHandler,
    private readonly inventoryEventHandler: InventoryEventHandler,
    private readonly analyticsEventHandler: AnalyticsEventHandler,
    private readonly auditEventHandler: AuditEventHandler,
  ) {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // Register Notification Event Handlers
    this.eventConsumerService.registerHandler('user.registered', this.notificationEventHandler);
    this.eventConsumerService.registerHandler('order.created', this.notificationEventHandler);
    this.eventConsumerService.registerHandler('payment.processed', this.notificationEventHandler);
    this.eventConsumerService.registerHandler('delivery.completed', this.notificationEventHandler);

    // Register Inventory Event Handlers
    this.eventConsumerService.registerHandler('order.created', this.inventoryEventHandler);
    this.eventConsumerService.registerHandler('inventory.updated', this.inventoryEventHandler);

    // Register Analytics Event Handlers
    this.eventConsumerService.registerHandler('analytics.page_view', this.analyticsEventHandler);
    this.eventConsumerService.registerHandler('analytics.product_view', this.analyticsEventHandler);
    this.eventConsumerService.registerHandler('analytics.search', this.analyticsEventHandler);
    this.eventConsumerService.registerHandler('order.created', this.analyticsEventHandler);

    // Register Audit Event Handler for all events
    const allEventTypes = [
      'user.registered',
      'user.profile.updated',
      'user.login',
      'order.created',
      'order.status.updated',
      'order.cancelled',
      'payment.processed',
      'payment.failed',
      'payment.refunded',
      'inventory.updated',
      'inventory.low_stock',
      'inventory.out_of_stock',
      'product.created',
      'product.updated',
      'product.price.changed',
      'cart.item.added',
      'cart.abandoned',
      'shipment.created',
      'shipment.status.updated',
      'delivery.completed',
      'review.created',
      'review.moderated',
      'promotion.activated',
      'promotion.used',
      'notification.sent',
    ];

    allEventTypes.forEach(eventType => {
      this.eventConsumerService.registerHandler(eventType, this.auditEventHandler);
    });

    console.log('✅ Kafka event handlers registered successfully');
  }
}

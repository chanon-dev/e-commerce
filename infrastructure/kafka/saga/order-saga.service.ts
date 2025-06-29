import { Injectable, Logger } from '@nestjs/common';
import { EventConsumerService, EventHandler } from '../event-consumer.service';
import { EventPublisherService } from '../event-publisher.service';
import { 
  OrderCreatedEvent, 
  PaymentProcessedEvent, 
  PaymentFailedEvent,
  InventoryUpdatedEvent,
  ShipmentCreatedEvent,
  EVENT_TYPES 
} from '../schemas/events';

export interface SagaStep {
  stepName: string;
  execute(): Promise<void>;
  compensate(): Promise<void>;
}

export interface OrderSagaState {
  orderId: string;
  userId: string;
  correlationId: string;
  currentStep: number;
  completedSteps: string[];
  failedStep?: string;
  status: 'pending' | 'completed' | 'failed' | 'compensating' | 'compensated';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrderSagaService implements EventHandler<OrderCreatedEvent | PaymentProcessedEvent | PaymentFailedEvent> {
  private readonly logger = new Logger(OrderSagaService.name);
  private sagaStates: Map<string, OrderSagaState> = new Map();

  constructor(
    private readonly eventPublisher: EventPublisherService,
    private readonly eventConsumer: EventConsumerService,
  ) {
    this.registerSagaHandlers();
  }

  private registerSagaHandlers() {
    this.eventConsumer.registerHandler(EVENT_TYPES.ORDER_CREATED, this);
    this.eventConsumer.registerHandler(EVENT_TYPES.PAYMENT_PROCESSED, this);
    this.eventConsumer.registerHandler(EVENT_TYPES.PAYMENT_FAILED, this);
  }

  async handle(event: OrderCreatedEvent | PaymentProcessedEvent | PaymentFailedEvent): Promise<void> {
    switch (event.eventType) {
      case EVENT_TYPES.ORDER_CREATED:
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
      case EVENT_TYPES.PAYMENT_PROCESSED:
        await this.handlePaymentProcessed(event as PaymentProcessedEvent);
        break;
      case EVENT_TYPES.PAYMENT_FAILED:
        await this.handlePaymentFailed(event as PaymentFailedEvent);
        break;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const sagaState: OrderSagaState = {
      orderId: event.data.orderId,
      userId: event.data.userId,
      correlationId: event.correlationId || event.eventId,
      currentStep: 0,
      completedSteps: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sagaStates.set(event.data.orderId, sagaState);
    
    this.logger.log(`🎭 Order saga started for order ${event.data.orderId}`);
    
    // Start the saga workflow
    await this.executeOrderSaga(event.data.orderId, event);
  }

  private async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    const sagaState = this.sagaStates.get(event.data.orderId);
    if (!sagaState) {
      this.logger.warn(`⚠️ No saga state found for order ${event.data.orderId}`);
      return;
    }

    if (event.data.status === 'success') {
      sagaState.completedSteps.push('payment');
      sagaState.currentStep++;
      sagaState.updatedAt = new Date();
      
      this.logger.log(`✅ Payment completed for order ${event.data.orderId}`);
      
      // Continue with next step: inventory reservation
      await this.executeInventoryReservation(sagaState);
    } else {
      await this.handleSagaFailure(sagaState, 'payment', 'Payment processing failed');
    }
  }

  private async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const sagaState = this.sagaStates.get(event.data.orderId);
    if (!sagaState) {
      this.logger.warn(`⚠️ No saga state found for order ${event.data.orderId}`);
      return;
    }

    await this.handleSagaFailure(sagaState, 'payment', event.data.errorMessage);
  }

  private async executeOrderSaga(orderId: string, orderEvent: OrderCreatedEvent): Promise<void> {
    const sagaState = this.sagaStates.get(orderId);
    if (!sagaState) return;

    try {
      // Step 1: Validate Order
      await this.executeOrderValidation(sagaState, orderEvent);
      
      // Step 2: Process Payment (will be handled by payment event)
      await this.executePaymentProcessing(sagaState, orderEvent);
      
    } catch (error) {
      this.logger.error(`❌ Order saga failed for order ${orderId}:`, error);
      await this.handleSagaFailure(sagaState, 'order_validation', error.message);
    }
  }

  private async executeOrderValidation(sagaState: OrderSagaState, orderEvent: OrderCreatedEvent): Promise<void> {
    this.logger.log(`🔍 Validating order ${sagaState.orderId}`);
    
    // Validate order items, pricing, etc.
    // This would typically call external services
    
    // For demo purposes, assume validation passes
    sagaState.completedSteps.push('order_validation');
    sagaState.currentStep++;
    sagaState.updatedAt = new Date();
    
    this.logger.log(`✅ Order validation completed for order ${sagaState.orderId}`);
  }

  private async executePaymentProcessing(sagaState: OrderSagaState, orderEvent: OrderCreatedEvent): Promise<void> {
    this.logger.log(`💳 Processing payment for order ${sagaState.orderId}`);
    
    // Trigger payment processing
    // This would typically call the payment service
    // The payment service would then publish PaymentProcessed or PaymentFailed events
    
    // For demo purposes, we'll simulate calling the payment service
    // In reality, this would be an HTTP call or message to payment service
    
    this.logger.log(`💳 Payment processing initiated for order ${sagaState.orderId}`);
  }

  private async executeInventoryReservation(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`📦 Reserving inventory for order ${sagaState.orderId}`);
    
    try {
      // Reserve inventory for each item
      // This would typically call the inventory service
      
      sagaState.completedSteps.push('inventory_reservation');
      sagaState.currentStep++;
      sagaState.updatedAt = new Date();
      
      this.logger.log(`✅ Inventory reserved for order ${sagaState.orderId}`);
      
      // Continue with shipping
      await this.executeShippingCreation(sagaState);
      
    } catch (error) {
      await this.handleSagaFailure(sagaState, 'inventory_reservation', error.message);
    }
  }

  private async executeShippingCreation(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`🚚 Creating shipment for order ${sagaState.orderId}`);
    
    try {
      // Create shipment
      // This would typically call the shipping service
      
      sagaState.completedSteps.push('shipping_creation');
      sagaState.currentStep++;
      sagaState.status = 'completed';
      sagaState.updatedAt = new Date();
      
      this.logger.log(`✅ Order saga completed successfully for order ${sagaState.orderId}`);
      
      // Publish order completion event
      await this.publishOrderCompleted(sagaState);
      
    } catch (error) {
      await this.handleSagaFailure(sagaState, 'shipping_creation', error.message);
    }
  }

  private async handleSagaFailure(sagaState: OrderSagaState, failedStep: string, errorMessage: string): Promise<void> {
    this.logger.error(`❌ Saga failed at step ${failedStep} for order ${sagaState.orderId}: ${errorMessage}`);
    
    sagaState.failedStep = failedStep;
    sagaState.status = 'failed';
    sagaState.updatedAt = new Date();
    
    // Start compensation
    await this.startCompensation(sagaState);
  }

  private async startCompensation(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`🔄 Starting compensation for order ${sagaState.orderId}`);
    
    sagaState.status = 'compensating';
    sagaState.updatedAt = new Date();
    
    // Compensate in reverse order
    const stepsToCompensate = [...sagaState.completedSteps].reverse();
    
    for (const step of stepsToCompensate) {
      try {
        await this.compensateStep(sagaState, step);
        this.logger.log(`🔄 Compensated step ${step} for order ${sagaState.orderId}`);
      } catch (error) {
        this.logger.error(`❌ Failed to compensate step ${step} for order ${sagaState.orderId}:`, error);
        // Continue with other compensations even if one fails
      }
    }
    
    sagaState.status = 'compensated';
    sagaState.updatedAt = new Date();
    
    this.logger.log(`🔄 Compensation completed for order ${sagaState.orderId}`);
    
    // Publish order failed event
    await this.publishOrderFailed(sagaState);
  }

  private async compensateStep(sagaState: OrderSagaState, step: string): Promise<void> {
    switch (step) {
      case 'payment':
        await this.compensatePayment(sagaState);
        break;
      case 'inventory_reservation':
        await this.compensateInventoryReservation(sagaState);
        break;
      case 'shipping_creation':
        await this.compensateShippingCreation(sagaState);
        break;
      default:
        this.logger.warn(`⚠️ No compensation defined for step: ${step}`);
    }
  }

  private async compensatePayment(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`💳 Compensating payment for order ${sagaState.orderId}`);
    // Refund payment
    // This would typically call the payment service to process a refund
  }

  private async compensateInventoryReservation(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`📦 Compensating inventory reservation for order ${sagaState.orderId}`);
    // Release reserved inventory
    // This would typically call the inventory service to release the reservation
  }

  private async compensateShippingCreation(sagaState: OrderSagaState): Promise<void> {
    this.logger.log(`🚚 Compensating shipping creation for order ${sagaState.orderId}`);
    // Cancel shipment
    // This would typically call the shipping service to cancel the shipment
  }

  private async publishOrderCompleted(sagaState: OrderSagaState): Promise<void> {
    // Publish order completed event
    this.logger.log(`✅ Publishing order completed event for order ${sagaState.orderId}`);
    
    // This would publish an OrderCompletedEvent
    // await this.eventPublisher.publishOrderCompleted({...});
  }

  private async publishOrderFailed(sagaState: OrderSagaState): Promise<void> {
    // Publish order failed event
    this.logger.log(`❌ Publishing order failed event for order ${sagaState.orderId}`);
    
    // This would publish an OrderFailedEvent
    // await this.eventPublisher.publishOrderFailed({...});
  }

  // Utility methods
  getSagaState(orderId: string): OrderSagaState | undefined {
    return this.sagaStates.get(orderId);
  }

  getAllSagaStates(): OrderSagaState[] {
    return Array.from(this.sagaStates.values());
  }

  cleanupCompletedSagas(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [orderId, sagaState] of this.sagaStates.entries()) {
      if ((sagaState.status === 'completed' || sagaState.status === 'compensated') && 
          sagaState.updatedAt < cutoffTime) {
        this.sagaStates.delete(orderId);
        this.logger.log(`🧹 Cleaned up saga state for order ${orderId}`);
      }
    }
  }
}

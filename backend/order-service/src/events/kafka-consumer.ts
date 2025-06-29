// Order Service - Kafka Event Consumer (NO SHARED CODE)
// Own event definitions and handlers

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

export class OrderServiceEventConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    });

    this.consumer = this.kafka.consumer({
      groupId: 'order-service-group',
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log('[Order Service] Kafka consumer connected');
    } catch (error) {
      console.error('[Order Service] Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('[Order Service] Kafka consumer disconnected');
    } catch (error) {
      console.error('[Order Service] Failed to disconnect Kafka consumer:', error);
    }
  }

  async subscribe(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer not connected');
    }

    // Subscribe to relevant topics
    await this.consumer.subscribe({
      topics: ['payment-events', 'inventory-events', 'user-events'],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    console.log('[Order Service] Subscribed to Kafka topics');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    try {
      if (!message.value) {
        console.warn('[Order Service] Received empty message');
        return;
      }

      const eventData = JSON.parse(message.value.toString());
      const eventType = eventData.eventType;

      console.log(`[Order Service] Received event: ${eventType} from topic: ${topic}`);

      // Handle different event types (own event definitions)
      switch (eventType) {
        case 'payment.completed':
          await this.handlePaymentCompleted(eventData);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventData);
          break;
        case 'inventory.reserved':
          await this.handleInventoryReserved(eventData);
          break;
        case 'inventory.released':
          await this.handleInventoryReleased(eventData);
          break;
        case 'user.updated':
          await this.handleUserUpdated(eventData);
          break;
        default:
          console.log(`[Order Service] Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error('[Order Service] Error processing message:', error);
      // Could implement dead letter queue here
    }
  }

  // Event handlers with own event structure definitions
  private async handlePaymentCompleted(eventData: any): Promise<void> {
    try {
      // Define own event structure (not shared)
      const paymentEvent = {
        orderId: eventData.data?.orderId,
        paymentId: eventData.data?.paymentId,
        amount: eventData.data?.amount,
        transactionId: eventData.data?.transactionId,
        completedAt: eventData.data?.completedAt || eventData.timestamp,
      };

      console.log('[Order Service] Processing payment completed:', paymentEvent);

      // Update order status
      await this.updateOrderPaymentStatus(paymentEvent.orderId, 'paid');

      // Publish order confirmed event
      await this.publishOrderConfirmedEvent(paymentEvent.orderId);

    } catch (error) {
      console.error('[Order Service] Error handling payment completed:', error);
    }
  }

  private async handlePaymentFailed(eventData: any): Promise<void> {
    try {
      const paymentEvent = {
        orderId: eventData.data?.orderId,
        paymentId: eventData.data?.paymentId,
        reason: eventData.data?.reason,
        failedAt: eventData.data?.failedAt || eventData.timestamp,
      };

      console.log('[Order Service] Processing payment failed:', paymentEvent);

      // Update order status
      await this.updateOrderPaymentStatus(paymentEvent.orderId, 'payment_failed');

      // Publish order cancelled event
      await this.publishOrderCancelledEvent(paymentEvent.orderId, 'Payment failed');

    } catch (error) {
      console.error('[Order Service] Error handling payment failed:', error);
    }
  }

  private async handleInventoryReserved(eventData: any): Promise<void> {
    try {
      const inventoryEvent = {
        orderId: eventData.data?.orderId,
        productId: eventData.data?.productId,
        quantity: eventData.data?.quantity,
        reservationId: eventData.data?.reservationId,
      };

      console.log('[Order Service] Processing inventory reserved:', inventoryEvent);

      // Update order inventory status
      await this.updateOrderInventoryStatus(inventoryEvent.orderId, 'reserved');

    } catch (error) {
      console.error('[Order Service] Error handling inventory reserved:', error);
    }
  }

  private async handleInventoryReleased(eventData: any): Promise<void> {
    try {
      const inventoryEvent = {
        orderId: eventData.data?.orderId,
        productId: eventData.data?.productId,
        quantity: eventData.data?.quantity,
        reason: eventData.data?.reason,
      };

      console.log('[Order Service] Processing inventory released:', inventoryEvent);

      // Update order inventory status
      await this.updateOrderInventoryStatus(inventoryEvent.orderId, 'released');

    } catch (error) {
      console.error('[Order Service] Error handling inventory released:', error);
    }
  }

  private async handleUserUpdated(eventData: any): Promise<void> {
    try {
      const userEvent = {
        userId: eventData.data?.userId,
        email: eventData.data?.email,
        firstName: eventData.data?.firstName,
        lastName: eventData.data?.lastName,
      };

      console.log('[Order Service] Processing user updated:', userEvent);

      // Update customer info in existing orders
      await this.updateCustomerInfoInOrders(userEvent.userId, userEvent);

    } catch (error) {
      console.error('[Order Service] Error handling user updated:', error);
    }
  }

  // Business logic methods (would interact with Order Service's own database)
  private async updateOrderPaymentStatus(orderId: string, status: string): Promise<void> {
    console.log(`[Order Service] Updating order ${orderId} payment status to: ${status}`);
    // Implementation would update order in database
  }

  private async updateOrderInventoryStatus(orderId: string, status: string): Promise<void> {
    console.log(`[Order Service] Updating order ${orderId} inventory status to: ${status}`);
    // Implementation would update order in database
  }

  private async updateCustomerInfoInOrders(userId: string, userInfo: any): Promise<void> {
    console.log(`[Order Service] Updating customer info for user ${userId}`);
    // Implementation would update customer info in orders
  }

  // Event publishing methods (own event structures)
  private async publishOrderConfirmedEvent(orderId: string): Promise<void> {
    const event = {
      eventType: 'order.confirmed',
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      data: {
        orderId: orderId,
        confirmedAt: new Date().toISOString(),
      },
    };

    console.log('[Order Service] Publishing order.confirmed event:', event);
    // Implementation would publish to Kafka
  }

  private async publishOrderCancelledEvent(orderId: string, reason: string): Promise<void> {
    const event = {
      eventType: 'order.cancelled',
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      data: {
        orderId: orderId,
        reason: reason,
        cancelledAt: new Date().toISOString(),
      },
    };

    console.log('[Order Service] Publishing order.cancelled event:', event);
    // Implementation would publish to Kafka
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

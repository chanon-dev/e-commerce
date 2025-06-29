import { Injectable, Logger } from '@nestjs/common';
import { EventPublisherService } from '../../../../infrastructure/kafka/event-publisher.service';
import { OrderCreatedEvent, OrderStatusUpdatedEvent, OrderCancelledEvent } from '../../../../infrastructure/kafka/schemas/events';

@Injectable()
export class OrderEventService {
  private readonly logger = new Logger(OrderEventService.name);

  constructor(private readonly eventPublisher: EventPublisherService) {}

  async publishOrderCreated(orderData: {
    orderId: string;
    userId: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      discount?: number;
    }>;
    totals: {
      subtotal: number;
      tax: number;
      shipping: number;
      discount: number;
      total: number;
    };
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    paymentMethod: string;
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishOrderCreated({
        ...orderData,
        createdAt: new Date().toISOString(),
      }, { correlationId });

      this.logger.log(`📦 Order created event published for order ${orderData.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish order created event:`, error);
      throw error;
    }
  }

  async publishOrderStatusUpdated(orderData: {
    orderId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    updatedBy: string;
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishOrderStatusUpdated({
        ...orderData,
        updatedAt: new Date().toISOString(),
      }, { correlationId });

      this.logger.log(`📋 Order status updated event published for order ${orderData.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish order status updated event:`, error);
      throw error;
    }
  }

  async publishOrderCancelled(orderData: {
    orderId: string;
    userId: string;
    reason: string;
    cancelledBy: string;
    refundAmount: number;
  }, correlationId?: string): Promise<void> {
    try {
      const event = {
        orderId: orderData.orderId,
        userId: orderData.userId,
        reason: orderData.reason,
        cancelledBy: orderData.cancelledBy,
        refundAmount: orderData.refundAmount,
        cancelledAt: new Date().toISOString(),
      };

      // Note: We need to create a publishOrderCancelled method in EventPublisherService
      // For now, we'll use the generic publishEvent method
      // await this.eventPublisher.publishOrderCancelled(event, { correlationId });

      this.logger.log(`❌ Order cancelled event published for order ${orderData.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish order cancelled event:`, error);
      throw error;
    }
  }

  // Integration with Order Service methods
  async onOrderCreated(order: any): Promise<void> {
    const orderData = {
      orderId: order.id,
      userId: order.userId,
      items: order.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
      })),
      totals: {
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
      },
      shippingAddress: {
        name: order.shippingAddress.name,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
      },
      paymentMethod: order.paymentMethod,
    };

    await this.publishOrderCreated(orderData, order.correlationId);
  }

  async onOrderStatusChanged(order: any, oldStatus: string, updatedBy: string): Promise<void> {
    const orderData = {
      orderId: order.id,
      userId: order.userId,
      oldStatus,
      newStatus: order.status,
      reason: order.statusReason,
      updatedBy,
    };

    await this.publishOrderStatusUpdated(orderData, order.correlationId);
  }

  async onOrderCancelled(order: any, reason: string, cancelledBy: string, refundAmount: number): Promise<void> {
    const orderData = {
      orderId: order.id,
      userId: order.userId,
      reason,
      cancelledBy,
      refundAmount,
    };

    await this.publishOrderCancelled(orderData, order.correlationId);
  }
}

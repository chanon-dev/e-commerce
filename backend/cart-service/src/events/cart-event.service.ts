import { Injectable, Logger } from '@nestjs/common';
import { EventPublisherService } from '../../../../infrastructure/kafka/event-publisher.service';

@Injectable()
export class CartEventService {
  private readonly logger = new Logger(CartEventService.name);

  constructor(private readonly eventPublisher: EventPublisherService) {}

  async publishCartItemAdded(cartData: {
    cartId: string;
    userId?: string;
    sessionId?: string;
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishCartItemAdded({
        ...cartData,
        addedAt: new Date().toISOString(),
      }, { correlationId });

      this.logger.log(`🛒 Cart item added event published for cart ${cartData.cartId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish cart item added event:`, error);
      throw error;
    }
  }

  async publishCartAbandoned(cartData: {
    cartId: string;
    userId?: string;
    sessionId?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
    }>;
    totalValue: number;
    lastActivityAt: string;
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishCartAbandoned({
        ...cartData,
        abandonedAt: new Date().toISOString(),
      }, { correlationId });

      this.logger.log(`🛒 Cart abandoned event published for cart ${cartData.cartId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish cart abandoned event:`, error);
      throw error;
    }
  }

  // Integration with Cart Service methods
  async onItemAdded(cart: any, item: any): Promise<void> {
    const cartData = {
      cartId: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
    };

    await this.publishCartItemAdded(cartData, cart.correlationId);
  }

  async onItemUpdated(cart: any, item: any, oldQuantity: number): Promise<void> {
    // If quantity increased, treat as item added
    if (item.quantity > oldQuantity) {
      const cartData = {
        cartId: cart.id,
        userId: cart.userId,
        sessionId: cart.sessionId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity - oldQuantity,
        price: item.price,
      };

      await this.publishCartItemAdded(cartData, cart.correlationId);
    }
    
    this.logger.log(`🛒 Cart item updated for cart ${cart.id}`);
  }

  async onItemRemoved(cart: any, item: any): Promise<void> {
    this.logger.log(`🛒 Cart item removed from cart ${cart.id}`);
    // Could publish a cart item removed event if needed
  }

  async onCartAbandoned(cart: any): Promise<void> {
    const cartData = {
      cartId: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: cart.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalValue: cart.total,
      lastActivityAt: cart.updatedAt,
    };

    await this.publishCartAbandoned(cartData, cart.correlationId);
  }

  async onCartCleared(cart: any): Promise<void> {
    this.logger.log(`🛒 Cart cleared for cart ${cart.id}`);
    // Could publish a cart cleared event if needed
  }

  async onCartConverted(cart: any, orderId: string): Promise<void> {
    this.logger.log(`🛒 Cart ${cart.id} converted to order ${orderId}`);
    // Could publish a cart converted event for analytics
  }

  // Scheduled method to detect abandoned carts
  async detectAbandonedCarts(): Promise<void> {
    try {
      // This would typically query the database for carts that haven't been updated
      // in a certain time period (e.g., 30 minutes)
      this.logger.log('🔍 Checking for abandoned carts...');
      
      // Implementation would go here to:
      // 1. Query database for inactive carts
      // 2. Check if they meet abandonment criteria
      // 3. Publish abandonment events
      
    } catch (error) {
      this.logger.error('❌ Failed to detect abandoned carts:', error);
    }
  }
}

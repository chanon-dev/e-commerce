// Event Schema Definitions for Kafka Messages
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

// User Events
export interface UserRegisteredEvent extends BaseEvent {
  eventType: 'user.registered';
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    registrationMethod: 'email' | 'social' | 'phone';
    isEmailVerified: boolean;
    createdAt: string;
  };
}

export interface UserProfileUpdatedEvent extends BaseEvent {
  eventType: 'user.profile.updated';
  data: {
    userId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedAt: string;
  };
}

export interface UserLoginEvent extends BaseEvent {
  eventType: 'user.login';
  data: {
    userId: string;
    loginMethod: 'password' | 'social' | 'sso';
    ipAddress: string;
    userAgent: string;
    location?: {
      country: string;
      city: string;
    };
    loginAt: string;
  };
}

// Order Events
export interface OrderCreatedEvent extends BaseEvent {
  eventType: 'order.created';
  data: {
    orderId: string;
    userId: string;
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      discount?: number;
    }[];
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
    createdAt: string;
  };
}

export interface OrderStatusUpdatedEvent extends BaseEvent {
  eventType: 'order.status.updated';
  data: {
    orderId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    updatedBy: string;
    updatedAt: string;
  };
}

export interface OrderCancelledEvent extends BaseEvent {
  eventType: 'order.cancelled';
  data: {
    orderId: string;
    userId: string;
    reason: string;
    cancelledBy: string;
    refundAmount: number;
    cancelledAt: string;
  };
}

// Payment Events
export interface PaymentProcessedEvent extends BaseEvent {
  eventType: 'payment.processed';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    provider: string;
    transactionId: string;
    status: 'success' | 'pending' | 'failed';
    processedAt: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  eventType: 'payment.failed';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    provider: string;
    errorCode: string;
    errorMessage: string;
    failedAt: string;
  };
}

export interface PaymentRefundedEvent extends BaseEvent {
  eventType: 'payment.refunded';
  data: {
    refundId: string;
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    reason: string;
    refundedBy: string;
    refundedAt: string;
  };
}

// Inventory Events
export interface InventoryUpdatedEvent extends BaseEvent {
  eventType: 'inventory.updated';
  data: {
    productId: string;
    variantId?: string;
    sku: string;
    oldQuantity: number;
    newQuantity: number;
    changeType: 'sale' | 'restock' | 'adjustment' | 'return';
    reason?: string;
    updatedBy: string;
    updatedAt: string;
  };
}

export interface LowStockAlertEvent extends BaseEvent {
  eventType: 'inventory.low_stock';
  data: {
    productId: string;
    variantId?: string;
    sku: string;
    currentQuantity: number;
    threshold: number;
    productName: string;
    alertLevel: 'warning' | 'critical';
    alertedAt: string;
  };
}

export interface OutOfStockEvent extends BaseEvent {
  eventType: 'inventory.out_of_stock';
  data: {
    productId: string;
    variantId?: string;
    sku: string;
    productName: string;
    lastSaleAt?: string;
    outOfStockAt: string;
  };
}

// Product Events
export interface ProductCreatedEvent extends BaseEvent {
  eventType: 'product.created';
  data: {
    productId: string;
    name: string;
    category: string;
    price: number;
    sku: string;
    status: string;
    createdBy: string;
    createdAt: string;
  };
}

export interface ProductUpdatedEvent extends BaseEvent {
  eventType: 'product.updated';
  data: {
    productId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedBy: string;
    updatedAt: string;
  };
}

export interface ProductPriceChangedEvent extends BaseEvent {
  eventType: 'product.price.changed';
  data: {
    productId: string;
    variantId?: string;
    sku: string;
    oldPrice: number;
    newPrice: number;
    changePercentage: number;
    effectiveDate: string;
    changedBy: string;
    changedAt: string;
  };
}

// Cart Events
export interface CartItemAddedEvent extends BaseEvent {
  eventType: 'cart.item.added';
  data: {
    cartId: string;
    userId?: string;
    sessionId?: string;
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    addedAt: string;
  };
}

export interface CartAbandonedEvent extends BaseEvent {
  eventType: 'cart.abandoned';
  data: {
    cartId: string;
    userId?: string;
    sessionId?: string;
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
    }[];
    totalValue: number;
    lastActivityAt: string;
    abandonedAt: string;
  };
}

// Shipping Events
export interface ShipmentCreatedEvent extends BaseEvent {
  eventType: 'shipment.created';
  data: {
    shipmentId: string;
    orderId: string;
    userId: string;
    carrier: string;
    trackingNumber: string;
    shippingMethod: string;
    estimatedDelivery: string;
    createdAt: string;
  };
}

export interface ShipmentStatusUpdatedEvent extends BaseEvent {
  eventType: 'shipment.status.updated';
  data: {
    shipmentId: string;
    orderId: string;
    trackingNumber: string;
    oldStatus: string;
    newStatus: string;
    location?: string;
    estimatedDelivery?: string;
    updatedAt: string;
  };
}

export interface DeliveryCompletedEvent extends BaseEvent {
  eventType: 'delivery.completed';
  data: {
    shipmentId: string;
    orderId: string;
    userId: string;
    trackingNumber: string;
    deliveredAt: string;
    deliveredTo: string;
    signedBy?: string;
  };
}

// Review Events
export interface ReviewCreatedEvent extends BaseEvent {
  eventType: 'review.created';
  data: {
    reviewId: string;
    productId: string;
    userId: string;
    orderId?: string;
    rating: number;
    title: string;
    content: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
  };
}

export interface ReviewModerationEvent extends BaseEvent {
  eventType: 'review.moderated';
  data: {
    reviewId: string;
    productId: string;
    userId: string;
    moderationResult: 'approved' | 'rejected' | 'flagged';
    moderationReason?: string;
    sentimentScore?: number;
    toxicityScore?: number;
    moderatedBy: string;
    moderatedAt: string;
  };
}

// Promotion Events
export interface PromotionActivatedEvent extends BaseEvent {
  eventType: 'promotion.activated';
  data: {
    promotionId: string;
    code: string;
    type: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    startDate: string;
    endDate: string;
    usageLimit?: number;
    activatedAt: string;
  };
}

export interface PromotionUsedEvent extends BaseEvent {
  eventType: 'promotion.used';
  data: {
    promotionId: string;
    code: string;
    orderId: string;
    userId: string;
    discountAmount: number;
    usageCount: number;
    usedAt: string;
  };
}

// Notification Events
export interface NotificationSentEvent extends BaseEvent {
  eventType: 'notification.sent';
  data: {
    notificationId: string;
    userId: string;
    type: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    subject: string;
    content: string;
    status: 'sent' | 'delivered' | 'failed';
    sentAt: string;
  };
}

// Analytics Events
export interface PageViewEvent extends BaseEvent {
  eventType: 'analytics.page_view';
  data: {
    userId?: string;
    sessionId: string;
    page: string;
    referrer?: string;
    userAgent: string;
    ipAddress: string;
    duration?: number;
    viewedAt: string;
  };
}

export interface ProductViewEvent extends BaseEvent {
  eventType: 'analytics.product_view';
  data: {
    productId: string;
    userId?: string;
    sessionId: string;
    category: string;
    price: number;
    source: string;
    viewedAt: string;
  };
}

export interface SearchEvent extends BaseEvent {
  eventType: 'analytics.search';
  data: {
    userId?: string;
    sessionId: string;
    query: string;
    filters?: Record<string, any>;
    resultsCount: number;
    searchedAt: string;
  };
}

// Union type for all events
export type KafkaEvent = 
  | UserRegisteredEvent
  | UserProfileUpdatedEvent
  | UserLoginEvent
  | OrderCreatedEvent
  | OrderStatusUpdatedEvent
  | OrderCancelledEvent
  | PaymentProcessedEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  | InventoryUpdatedEvent
  | LowStockAlertEvent
  | OutOfStockEvent
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductPriceChangedEvent
  | CartItemAddedEvent
  | CartAbandonedEvent
  | ShipmentCreatedEvent
  | ShipmentStatusUpdatedEvent
  | DeliveryCompletedEvent
  | ReviewCreatedEvent
  | ReviewModerationEvent
  | PromotionActivatedEvent
  | PromotionUsedEvent
  | NotificationSentEvent
  | PageViewEvent
  | ProductViewEvent
  | SearchEvent;

// Event Type Registry
export const EVENT_TYPES = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_LOGIN: 'user.login',
  
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  ORDER_CANCELLED: 'order.cancelled',
  
  // Payment Events
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  
  // Inventory Events
  INVENTORY_UPDATED: 'inventory.updated',
  LOW_STOCK_ALERT: 'inventory.low_stock',
  OUT_OF_STOCK: 'inventory.out_of_stock',
  
  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_PRICE_CHANGED: 'product.price.changed',
  
  // Cart Events
  CART_ITEM_ADDED: 'cart.item.added',
  CART_ABANDONED: 'cart.abandoned',
  
  // Shipping Events
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_STATUS_UPDATED: 'shipment.status.updated',
  DELIVERY_COMPLETED: 'delivery.completed',
  
  // Review Events
  REVIEW_CREATED: 'review.created',
  REVIEW_MODERATED: 'review.moderated',
  
  // Promotion Events
  PROMOTION_ACTIVATED: 'promotion.activated',
  PROMOTION_USED: 'promotion.used',
  
  // Notification Events
  NOTIFICATION_SENT: 'notification.sent',
  
  // Analytics Events
  PAGE_VIEW: 'analytics.page_view',
  PRODUCT_VIEW: 'analytics.product_view',
  SEARCH: 'analytics.search',
} as const;

// Kafka Topics Configuration
export const KAFKA_TOPICS = {
  USER_EVENTS: 'user-events',
  ORDER_EVENTS: 'order-events',
  PAYMENT_EVENTS: 'payment-events',
  INVENTORY_EVENTS: 'inventory-events',
  PRODUCT_EVENTS: 'product-events',
  CART_EVENTS: 'cart-events',
  SHIPPING_EVENTS: 'shipping-events',
  REVIEW_EVENTS: 'review-events',
  PROMOTION_EVENTS: 'promotion-events',
  NOTIFICATION_EVENTS: 'notification-events',
  ANALYTICS_EVENTS: 'analytics-events',
  AUDIT_EVENTS: 'audit-events',
} as const;

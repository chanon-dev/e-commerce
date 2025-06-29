import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
}

@Entity('carts')
@Index(['userId'])
@Index(['sessionId'])
@Index(['status'])
@Index(['expiresAt'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @Column({ nullable: true })
  @Index()
  sessionId?: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 0 })
  itemCount: number;

  @Column({ nullable: true })
  couponCode?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt?: Date;

  @Column('uuid', { nullable: true })
  convertedOrderId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: false,
  })
  items: CartItem[];

  // Business methods
  addItem(
    productId: string,
    productName: string,
    productSku: string,
    unitPrice: number,
    quantity: number,
    variantId?: string,
    variantName?: string,
    productImageUrl?: string,
  ): CartItem {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    // Check if item already exists
    const existingItem = this.items?.find(
      (item) => item.productId === productId && item.variantId === variantId,
    );

    if (existingItem) {
      existingItem.updateQuantity(existingItem.quantity + quantity);
      this.recalculateTotals();
      return existingItem;
    }

    // Create new item
    const newItem = new CartItem();
    newItem.cartId = this.id;
    newItem.productId = productId;
    newItem.productName = productName;
    newItem.productSku = productSku;
    newItem.variantId = variantId;
    newItem.variantName = variantName;
    newItem.unitPrice = unitPrice;
    newItem.quantity = quantity;
    newItem.productImageUrl = productImageUrl;
    newItem.calculateTotalPrice();

    if (!this.items) {
      this.items = [];
    }
    this.items.push(newItem);

    this.recalculateTotals();
    this.updateActivity();

    return newItem;
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const item = this.items?.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    item.updateQuantity(quantity);
    this.recalculateTotals();
    this.updateActivity();
  }

  removeItem(itemId: string): void {
    if (!this.items) {
      return;
    }

    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    this.items.splice(itemIndex, 1);
    this.recalculateTotals();
    this.updateActivity();
  }

  clearItems(): void {
    this.items = [];
    this.recalculateTotals();
    this.updateActivity();
  }

  applyCoupon(couponCode: string, discountAmount: number): void {
    if (discountAmount < 0) {
      throw new Error('Discount amount cannot be negative');
    }

    if (discountAmount > this.subtotal) {
      throw new Error('Discount cannot exceed subtotal');
    }

    this.couponCode = couponCode;
    this.discountAmount = discountAmount;
    this.recalculateTotals();
    this.updateActivity();
  }

  removeCoupon(): void {
    this.couponCode = undefined;
    this.discountAmount = 0;
    this.recalculateTotals();
    this.updateActivity();
  }

  setShipping(shippingAmount: number): void {
    if (shippingAmount < 0) {
      throw new Error('Shipping amount cannot be negative');
    }

    this.shippingAmount = shippingAmount;
    this.recalculateTotals();
    this.updateActivity();
  }

  setTax(taxAmount: number): void {
    if (taxAmount < 0) {
      throw new Error('Tax amount cannot be negative');
    }

    this.taxAmount = taxAmount;
    this.recalculateTotals();
    this.updateActivity();
  }

  assignToUser(userId: string, customerEmail?: string): void {
    this.userId = userId;
    this.customerEmail = customerEmail;
    this.updateActivity();
  }

  setExpiry(expiresAt: Date): void {
    this.expiresAt = expiresAt;
  }

  abandon(): void {
    this.status = CartStatus.ABANDONED;
    this.updateActivity();
  }

  convert(orderId: string): void {
    this.status = CartStatus.CONVERTED;
    this.convertedOrderId = orderId;
    this.convertedAt = new Date();
    this.updateActivity();
  }

  expire(): void {
    this.status = CartStatus.EXPIRED;
  }

  addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
    this.updateActivity();
  }

  getMetadata<T>(key: string): T | undefined {
    return this.metadata?.[key] as T;
  }

  private recalculateTotals(): void {
    if (!this.items || this.items.length === 0) {
      this.subtotal = 0;
      this.itemCount = 0;
    } else {
      this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
      this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
  }

  private updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  // Helper properties
  get isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isActive(): boolean {
    return this.status === CartStatus.ACTIVE && !this.isExpired;
  }

  get isAbandoned(): boolean {
    return this.status === CartStatus.ABANDONED;
  }

  get isConverted(): boolean {
    return this.status === CartStatus.CONVERTED;
  }

  get hasDiscount(): boolean {
    return this.discountAmount > 0;
  }

  get discountPercentage(): number {
    return this.subtotal > 0 ? (this.discountAmount / this.subtotal) * 100 : 0;
  }

  get averageItemPrice(): number {
    return this.itemCount > 0 ? this.subtotal / this.itemCount : 0;
  }

  get daysSinceCreated(): number {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceLastActivity(): number {
    if (!this.lastActivityAt) {
      return this.daysSinceCreated;
    }
    const diffTime = Math.abs(new Date().getTime() - this.lastActivityAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isRecentlyActive(): boolean {
    return this.daysSinceLastActivity <= 1;
  }

  get abandonmentRisk(): 'low' | 'medium' | 'high' {
    const daysSinceActivity = this.daysSinceLastActivity;
    
    if (daysSinceActivity <= 1) return 'low';
    if (daysSinceActivity <= 3) return 'medium';
    return 'high';
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
@Index(['variantId'])
@Index(['cartId', 'productId', 'variantId'], { unique: true })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  cartId: string;

  @Column('uuid')
  @Index()
  productId: string;

  @Column()
  productName: string;

  @Column()
  productSku: string;

  @Column('uuid', { nullable: true })
  @Index()
  variantId?: string;

  @Column({ nullable: true })
  variantName?: string;

  @Column({ nullable: true })
  productImageUrl?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column('jsonb', { default: {} })
  productAttributes: Record<string, any>;

  @Column('jsonb', { default: {} })
  variantAttributes: Record<string, any>;

  @Column('jsonb', { default: {} })
  customizations: Record<string, any>;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  addedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  // Business methods
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (newQuantity > 999) {
      throw new Error('Quantity cannot exceed 999');
    }

    this.quantity = newQuantity;
    this.calculateTotalPrice();
    this.lastModifiedAt = new Date();
  }

  updateUnitPrice(newUnitPrice: number): void {
    if (newUnitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    this.unitPrice = newUnitPrice;
    this.calculateTotalPrice();
    this.lastModifiedAt = new Date();
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.unitPrice * this.quantity;
  }

  addProductAttribute(key: string, value: any): void {
    if (!this.productAttributes) {
      this.productAttributes = {};
    }
    this.productAttributes[key] = value;
    this.lastModifiedAt = new Date();
  }

  addVariantAttribute(key: string, value: any): void {
    if (!this.variantAttributes) {
      this.variantAttributes = {};
    }
    this.variantAttributes[key] = value;
    this.lastModifiedAt = new Date();
  }

  addCustomization(key: string, value: any): void {
    if (!this.customizations) {
      this.customizations = {};
    }
    this.customizations[key] = value;
    this.lastModifiedAt = new Date();
  }

  setNotes(notes: string): void {
    this.notes = notes;
    this.lastModifiedAt = new Date();
  }

  // Helper properties
  get displayName(): string {
    if (this.variantName) {
      return `${this.productName} - ${this.variantName}`;
    }
    return this.productName;
  }

  get hasVariant(): boolean {
    return !!this.variantId;
  }

  get hasCustomizations(): boolean {
    return this.customizations && Object.keys(this.customizations).length > 0;
  }

  get hasNotes(): boolean {
    return !!this.notes && this.notes.trim().length > 0;
  }

  get isHighQuantity(): boolean {
    return this.quantity >= 10;
  }

  get isHighValue(): boolean {
    return this.totalPrice >= 100;
  }

  get pricePerUnit(): number {
    return this.unitPrice;
  }

  get formattedPrice(): string {
    return `${this.currency} ${this.totalPrice.toFixed(2)}`;
  }

  get formattedUnitPrice(): string {
    return `${this.currency} ${this.unitPrice.toFixed(2)}`;
  }

  get weight(): number {
    return this.getProductAttribute<number>('weight') || 0;
  }

  get dimensions(): { length?: number; width?: number; height?: number } {
    return {
      length: this.getProductAttribute<number>('length'),
      width: this.getProductAttribute<number>('width'),
      height: this.getProductAttribute<number>('height'),
    };
  }

  get color(): string | undefined {
    return this.getVariantAttribute<string>('color');
  }

  get size(): string | undefined {
    return this.getVariantAttribute<string>('size');
  }

  get material(): string | undefined {
    return this.getProductAttribute<string>('material');
  }

  get brand(): string | undefined {
    return this.getProductAttribute<string>('brand');
  }

  get category(): string | undefined {
    return this.getProductAttribute<string>('category');
  }

  get isGiftWrapped(): boolean {
    return this.getCustomization<boolean>('giftWrapped') || false;
  }

  get giftMessage(): string | undefined {
    return this.getCustomization<string>('giftMessage');
  }

  get isPersonalized(): boolean {
    return this.getCustomization<boolean>('personalized') || false;
  }

  get personalizationText(): string | undefined {
    return this.getCustomization<string>('personalizationText');
  }

  get daysSinceAdded(): number {
    const addedDate = this.addedAt || this.createdAt;
    const diffTime = Math.abs(new Date().getTime() - addedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceModified(): number {
    const modifiedDate = this.lastModifiedAt || this.updatedAt;
    const diffTime = Math.abs(new Date().getTime() - modifiedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isRecentlyAdded(): boolean {
    return this.daysSinceAdded <= 1;
  }

  get isRecentlyModified(): boolean {
    return this.daysSinceModified <= 1;
  }

  // Helper methods
  getProductAttribute<T>(key: string): T | undefined {
    return this.productAttributes?.[key] as T;
  }

  getVariantAttribute<T>(key: string): T | undefined {
    return this.variantAttributes?.[key] as T;
  }

  getCustomization<T>(key: string): T | undefined {
    return this.customizations?.[key] as T;
  }

  hasProductAttribute(key: string): boolean {
    return this.productAttributes && key in this.productAttributes;
  }

  hasVariantAttribute(key: string): boolean {
    return this.variantAttributes && key in this.variantAttributes;
  }

  hasCustomization(key: string): boolean {
    return this.customizations && key in this.customizations;
  }

  // Comparison methods
  isSameProduct(other: CartItem): boolean {
    return this.productId === other.productId && this.variantId === other.variantId;
  }

  canBeMergedWith(other: CartItem): boolean {
    return (
      this.isSameProduct(other) &&
      this.unitPrice === other.unitPrice &&
      JSON.stringify(this.customizations) === JSON.stringify(other.customizations)
    );
  }

  // Validation methods
  validate(): string[] {
    const errors: string[] = [];

    if (!this.productId) {
      errors.push('Product ID is required');
    }

    if (!this.productName || this.productName.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!this.productSku || this.productSku.trim().length === 0) {
      errors.push('Product SKU is required');
    }

    if (this.unitPrice < 0) {
      errors.push('Unit price cannot be negative');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (this.quantity > 999) {
      errors.push('Quantity cannot exceed 999');
    }

    if (Math.abs(this.totalPrice - this.unitPrice * this.quantity) > 0.01) {
      errors.push('Total price calculation is incorrect');
    }

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  // Serialization methods
  toJSON(): any {
    return {
      id: this.id,
      cartId: this.cartId,
      productId: this.productId,
      productName: this.productName,
      productSku: this.productSku,
      variantId: this.variantId,
      variantName: this.variantName,
      productImageUrl: this.productImageUrl,
      unitPrice: this.unitPrice,
      quantity: this.quantity,
      totalPrice: this.totalPrice,
      currency: this.currency,
      productAttributes: this.productAttributes,
      variantAttributes: this.variantAttributes,
      customizations: this.customizations,
      notes: this.notes,
      displayName: this.displayName,
      formattedPrice: this.formattedPrice,
      formattedUnitPrice: this.formattedUnitPrice,
      hasVariant: this.hasVariant,
      hasCustomizations: this.hasCustomizations,
      hasNotes: this.hasNotes,
      isHighQuantity: this.isHighQuantity,
      isHighValue: this.isHighValue,
      addedAt: this.addedAt,
      lastModifiedAt: this.lastModifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

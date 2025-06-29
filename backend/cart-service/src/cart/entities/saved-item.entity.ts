import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('saved_items')
@Index(['userId'])
@Index(['productId'])
@Index(['variantId'])
@Index(['userId', 'productId', 'variantId'], { unique: true })
@Index(['createdAt'])
export class SavedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

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

  @Column({ nullable: true })
  listName?: string;

  @Column('int', { default: 1 })
  desiredQuantity: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isOnSale: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice?: number;

  @Column({ default: false })
  priceDropAlert: boolean;

  @Column({ default: false })
  backInStockAlert: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  targetPrice?: number;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastViewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastPriceCheckAt?: Date;

  @Column('jsonb', { default: [] })
  priceHistory: Array<{
    price: number;
    date: string;
    isOnSale?: boolean;
    salePrice?: number;
  }>;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business methods
  updatePrice(newPrice: number, isOnSale: boolean = false, salePrice?: number): void {
    const oldPrice = this.unitPrice;
    this.unitPrice = newPrice;
    this.isOnSale = isOnSale;
    this.salePrice = salePrice;
    this.lastPriceCheckAt = new Date();

    // Add to price history
    if (!this.priceHistory) {
      this.priceHistory = [];
    }

    this.priceHistory.push({
      price: newPrice,
      date: new Date().toISOString(),
      isOnSale,
      salePrice,
    });

    // Keep only last 30 price history entries
    if (this.priceHistory.length > 30) {
      this.priceHistory = this.priceHistory.slice(-30);
    }
  }

  updateAvailability(isAvailable: boolean): void {
    this.isAvailable = isAvailable;
    this.lastPriceCheckAt = new Date();
  }

  setDesiredQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Desired quantity must be positive');
    }
    if (quantity > 999) {
      throw new Error('Desired quantity cannot exceed 999');
    }
    this.desiredQuantity = quantity;
  }

  setTargetPrice(targetPrice: number): void {
    if (targetPrice <= 0) {
      throw new Error('Target price must be positive');
    }
    this.targetPrice = targetPrice;
    this.priceDropAlert = true;
  }

  removeTargetPrice(): void {
    this.targetPrice = undefined;
    this.priceDropAlert = false;
  }

  enablePriceDropAlert(): void {
    this.priceDropAlert = true;
  }

  disablePriceDropAlert(): void {
    this.priceDropAlert = false;
  }

  enableBackInStockAlert(): void {
    this.backInStockAlert = true;
  }

  disableBackInStockAlert(): void {
    this.backInStockAlert = false;
  }

  setListName(listName: string): void {
    this.listName = listName;
  }

  removeFromList(): void {
    this.listName = undefined;
  }

  addCustomization(key: string, value: any): void {
    if (!this.customizations) {
      this.customizations = {};
    }
    this.customizations[key] = value;
  }

  removeCustomization(key: string): void {
    if (this.customizations && key in this.customizations) {
      delete this.customizations[key];
    }
  }

  setNotes(notes: string): void {
    this.notes = notes;
  }

  recordView(): void {
    this.viewCount++;
    this.lastViewedAt = new Date();
  }

  addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata<T>(key: string): T | undefined {
    return this.metadata?.[key] as T;
  }

  // Helper properties
  get displayName(): string {
    if (this.variantName) {
      return `${this.productName} - ${this.variantName}`;
    }
    return this.productName;
  }

  get currentPrice(): number {
    return this.isOnSale && this.salePrice ? this.salePrice : this.unitPrice;
  }

  get formattedPrice(): string {
    return `${this.currency} ${this.currentPrice.toFixed(2)}`;
  }

  get formattedOriginalPrice(): string {
    return `${this.currency} ${this.unitPrice.toFixed(2)}`;
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

  get isInList(): boolean {
    return !!this.listName;
  }

  get hasTargetPrice(): boolean {
    return !!this.targetPrice;
  }

  get isAtTargetPrice(): boolean {
    return this.hasTargetPrice && this.currentPrice <= this.targetPrice!;
  }

  get discountPercentage(): number {
    if (!this.isOnSale || !this.salePrice) {
      return 0;
    }
    return ((this.unitPrice - this.salePrice) / this.unitPrice) * 100;
  }

  get totalDesiredValue(): number {
    return this.currentPrice * this.desiredQuantity;
  }

  get formattedTotalValue(): string {
    return `${this.currency} ${this.totalDesiredValue.toFixed(2)}`;
  }

  get daysSinceSaved(): number {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceLastViewed(): number {
    if (!this.lastViewedAt) {
      return this.daysSinceSaved;
    }
    const diffTime = Math.abs(new Date().getTime() - this.lastViewedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isRecentlySaved(): boolean {
    return this.daysSinceSaved <= 7;
  }

  get isRecentlyViewed(): boolean {
    return this.daysSinceLastViewed <= 7;
  }

  get isStale(): boolean {
    return this.daysSinceLastViewed > 30;
  }

  get lowestPrice(): number {
    if (!this.priceHistory || this.priceHistory.length === 0) {
      return this.currentPrice;
    }
    return Math.min(...this.priceHistory.map(h => h.salePrice || h.price));
  }

  get highestPrice(): number {
    if (!this.priceHistory || this.priceHistory.length === 0) {
      return this.currentPrice;
    }
    return Math.max(...this.priceHistory.map(h => h.price));
  }

  get averagePrice(): number {
    if (!this.priceHistory || this.priceHistory.length === 0) {
      return this.currentPrice;
    }
    const sum = this.priceHistory.reduce((acc, h) => acc + (h.salePrice || h.price), 0);
    return sum / this.priceHistory.length;
  }

  get priceDropFromHighest(): number {
    const highest = this.highestPrice;
    const current = this.currentPrice;
    return highest > current ? ((highest - current) / highest) * 100 : 0;
  }

  get isPriceAtLowest(): boolean {
    return this.currentPrice === this.lowestPrice;
  }

  get isPriceAtHighest(): boolean {
    return this.currentPrice === this.highestPrice;
  }

  get shouldNotifyPriceDrop(): boolean {
    return this.priceDropAlert && this.isAtTargetPrice;
  }

  get shouldNotifyBackInStock(): boolean {
    return this.backInStockAlert && this.isAvailable;
  }

  // Product attribute helpers
  get color(): string | undefined {
    return this.getVariantAttribute<string>('color');
  }

  get size(): string | undefined {
    return this.getVariantAttribute<string>('size');
  }

  get brand(): string | undefined {
    return this.getProductAttribute<string>('brand');
  }

  get category(): string | undefined {
    return this.getProductAttribute<string>('category');
  }

  get rating(): number | undefined {
    return this.getProductAttribute<number>('rating');
  }

  get reviewCount(): number | undefined {
    return this.getProductAttribute<number>('reviewCount');
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
  isSameProduct(other: SavedItem): boolean {
    return this.productId === other.productId && this.variantId === other.variantId;
  }

  // Validation methods
  validate(): string[] {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

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

    if (this.desiredQuantity <= 0) {
      errors.push('Desired quantity must be positive');
    }

    if (this.desiredQuantity > 999) {
      errors.push('Desired quantity cannot exceed 999');
    }

    if (this.targetPrice && this.targetPrice <= 0) {
      errors.push('Target price must be positive');
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
      userId: this.userId,
      productId: this.productId,
      productName: this.productName,
      productSku: this.productSku,
      variantId: this.variantId,
      variantName: this.variantName,
      productImageUrl: this.productImageUrl,
      unitPrice: this.unitPrice,
      currency: this.currency,
      productAttributes: this.productAttributes,
      variantAttributes: this.variantAttributes,
      customizations: this.customizations,
      notes: this.notes,
      listName: this.listName,
      desiredQuantity: this.desiredQuantity,
      isAvailable: this.isAvailable,
      isOnSale: this.isOnSale,
      salePrice: this.salePrice,
      priceDropAlert: this.priceDropAlert,
      backInStockAlert: this.backInStockAlert,
      targetPrice: this.targetPrice,
      viewCount: this.viewCount,
      lastViewedAt: this.lastViewedAt,
      lastPriceCheckAt: this.lastPriceCheckAt,
      priceHistory: this.priceHistory,
      displayName: this.displayName,
      currentPrice: this.currentPrice,
      formattedPrice: this.formattedPrice,
      formattedOriginalPrice: this.formattedOriginalPrice,
      formattedTotalValue: this.formattedTotalValue,
      hasVariant: this.hasVariant,
      hasCustomizations: this.hasCustomizations,
      hasNotes: this.hasNotes,
      isInList: this.isInList,
      hasTargetPrice: this.hasTargetPrice,
      isAtTargetPrice: this.isAtTargetPrice,
      discountPercentage: this.discountPercentage,
      totalDesiredValue: this.totalDesiredValue,
      daysSinceSaved: this.daysSinceSaved,
      daysSinceLastViewed: this.daysSinceLastViewed,
      isRecentlySaved: this.isRecentlySaved,
      isRecentlyViewed: this.isRecentlyViewed,
      isStale: this.isStale,
      lowestPrice: this.lowestPrice,
      highestPrice: this.highestPrice,
      averagePrice: this.averagePrice,
      priceDropFromHighest: this.priceDropFromHighest,
      isPriceAtLowest: this.isPriceAtLowest,
      isPriceAtHighest: this.isPriceAtHighest,
      shouldNotifyPriceDrop: this.shouldNotifyPriceDrop,
      shouldNotifyBackInStock: this.shouldNotifyBackInStock,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

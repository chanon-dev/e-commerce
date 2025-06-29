import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ShipmentItem } from './shipment-item.entity';
import { ShipmentTracking } from './shipment-tracking.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum ShipmentType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup',
}

export enum ShippingCarrier {
  FEDEX = 'fedex',
  UPS = 'ups',
  DHL = 'dhl',
  USPS = 'usps',
  THAILAND_POST = 'thailand_post',
  KERRY = 'kerry',
  FLASH = 'flash',
  J_AND_T = 'j_and_t',
}

@Entity('shipments')
@Index(['orderId'])
@Index(['trackingNumber'])
@Index(['status'])
@Index(['carrier'])
@Index(['recipientEmail'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  orderId: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({ unique: true })
  @Index()
  trackingNumber: string;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  @Index()
  status: ShipmentStatus;

  @Column({
    type: 'enum',
    enum: ShipmentType,
    default: ShipmentType.STANDARD,
  })
  type: ShipmentType;

  @Column({
    type: 'enum',
    enum: ShippingCarrier,
  })
  @Index()
  carrier: ShippingCarrier;

  @Column({ nullable: true })
  carrierServiceCode?: string;

  @Column({ nullable: true })
  carrierTrackingUrl?: string;

  // Sender information
  @Column()
  senderName: string;

  @Column()
  senderCompany: string;

  @Column()
  senderStreet: string;

  @Column({ nullable: true })
  senderStreet2?: string;

  @Column()
  senderCity: string;

  @Column()
  senderState: string;

  @Column()
  senderPostalCode: string;

  @Column()
  senderCountry: string;

  @Column()
  senderPhone: string;

  @Column()
  senderEmail: string;

  // Recipient information
  @Column()
  recipientName: string;

  @Column({ nullable: true })
  recipientCompany?: string;

  @Column()
  recipientStreet: string;

  @Column({ nullable: true })
  recipientStreet2?: string;

  @Column()
  recipientCity: string;

  @Column()
  recipientState: string;

  @Column()
  recipientPostalCode: string;

  @Column()
  recipientCountry: string;

  @Column()
  recipientPhone: string;

  @Column()
  @Index()
  recipientEmail: string;

  // Package information
  @Column('decimal', { precision: 8, scale: 2 })
  weight: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  length?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  width?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  height?: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  @Column({ default: 'cm' })
  dimensionUnit: string;

  // Shipping costs
  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  insuranceCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalFees: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;

  @Column({ default: 'USD' })
  currency: string;

  // Insurance and declared value
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  declaredValue?: number;

  @Column({ default: false })
  isInsured: boolean;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  insuranceValue?: number;

  // Delivery options
  @Column({ default: false })
  requiresSignature: boolean;

  @Column({ default: false })
  isFragile: boolean;

  @Column({ default: false })
  isDangerous: boolean;

  @Column({ nullable: true })
  specialInstructions?: string;

  @Column({ nullable: true })
  deliveryInstructions?: string;

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancellationReason?: string;

  // Labels and documents
  @Column({ nullable: true })
  labelUrl?: string;

  @Column({ nullable: true })
  invoiceUrl?: string;

  @Column({ nullable: true })
  customsFormUrl?: string;

  // External provider information
  @Column({ nullable: true })
  providerShipmentId?: string;

  @Column({ nullable: true })
  providerLabelId?: string;

  @Column('jsonb', { default: {} })
  providerData: Record<string, any>;

  // Metadata
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  internalNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => ShipmentItem, (item) => item.shipment, {
    cascade: true,
    eager: false,
  })
  items: ShipmentItem[];

  @OneToMany(() => ShipmentTracking, (tracking) => tracking.shipment, {
    cascade: true,
    eager: false,
  })
  trackingEvents: ShipmentTracking[];

  // Business methods
  static create(data: {
    orderId: string;
    userId: string;
    carrier: ShippingCarrier;
    type: ShipmentType;
    senderInfo: any;
    recipientInfo: any;
    packageInfo: any;
    shippingCost: number;
    currency?: string;
  }): Shipment {
    const shipment = new Shipment();
    
    shipment.orderId = data.orderId;
    shipment.userId = data.userId;
    shipment.trackingNumber = this.generateTrackingNumber();
    shipment.carrier = data.carrier;
    shipment.type = data.type;
    shipment.status = ShipmentStatus.PENDING;
    
    // Sender information
    shipment.senderName = data.senderInfo.name;
    shipment.senderCompany = data.senderInfo.company;
    shipment.senderStreet = data.senderInfo.street;
    shipment.senderStreet2 = data.senderInfo.street2;
    shipment.senderCity = data.senderInfo.city;
    shipment.senderState = data.senderInfo.state;
    shipment.senderPostalCode = data.senderInfo.postalCode;
    shipment.senderCountry = data.senderInfo.country;
    shipment.senderPhone = data.senderInfo.phone;
    shipment.senderEmail = data.senderInfo.email;
    
    // Recipient information
    shipment.recipientName = data.recipientInfo.name;
    shipment.recipientCompany = data.recipientInfo.company;
    shipment.recipientStreet = data.recipientInfo.street;
    shipment.recipientStreet2 = data.recipientInfo.street2;
    shipment.recipientCity = data.recipientInfo.city;
    shipment.recipientState = data.recipientInfo.state;
    shipment.recipientPostalCode = data.recipientInfo.postalCode;
    shipment.recipientCountry = data.recipientInfo.country;
    shipment.recipientPhone = data.recipientInfo.phone;
    shipment.recipientEmail = data.recipientInfo.email;
    
    // Package information
    shipment.weight = data.packageInfo.weight;
    shipment.length = data.packageInfo.length;
    shipment.width = data.packageInfo.width;
    shipment.height = data.packageInfo.height;
    shipment.weightUnit = data.packageInfo.weightUnit || 'kg';
    shipment.dimensionUnit = data.packageInfo.dimensionUnit || 'cm';
    
    // Costs
    shipment.shippingCost = data.shippingCost;
    shipment.totalCost = data.shippingCost;
    shipment.currency = data.currency || 'USD';
    
    return shipment;
  }

  confirm(): void {
    if (this.status !== ShipmentStatus.PENDING) {
      throw new Error('Can only confirm pending shipments');
    }
    
    this.status = ShipmentStatus.CONFIRMED;
    this.addTrackingEvent('Shipment confirmed', 'Shipment has been confirmed and is ready for pickup');
  }

  pickup(pickedUpAt?: Date): void {
    if (this.status !== ShipmentStatus.CONFIRMED) {
      throw new Error('Can only pickup confirmed shipments');
    }
    
    this.status = ShipmentStatus.PICKED_UP;
    this.pickedUpAt = pickedUpAt || new Date();
    this.addTrackingEvent('Package picked up', 'Package has been picked up by carrier');
  }

  ship(shippedAt?: Date): void {
    if (this.status !== ShipmentStatus.PICKED_UP) {
      throw new Error('Can only ship picked up packages');
    }
    
    this.status = ShipmentStatus.IN_TRANSIT;
    this.shippedAt = shippedAt || new Date();
    this.addTrackingEvent('In transit', 'Package is in transit to destination');
  }

  outForDelivery(): void {
    if (this.status !== ShipmentStatus.IN_TRANSIT) {
      throw new Error('Package must be in transit before out for delivery');
    }
    
    this.status = ShipmentStatus.OUT_FOR_DELIVERY;
    this.addTrackingEvent('Out for delivery', 'Package is out for delivery');
  }

  deliver(deliveredAt?: Date, signature?: string): void {
    if (this.status !== ShipmentStatus.OUT_FOR_DELIVERY && this.status !== ShipmentStatus.IN_TRANSIT) {
      throw new Error('Package must be out for delivery or in transit to be delivered');
    }
    
    this.status = ShipmentStatus.DELIVERED;
    this.deliveredAt = deliveredAt || new Date();
    this.actualDeliveryDate = this.deliveredAt;
    
    const eventData: any = {};
    if (signature) {
      eventData.signature = signature;
    }
    
    this.addTrackingEvent('Delivered', 'Package has been delivered successfully', eventData);
  }

  fail(reason: string): void {
    if (this.status === ShipmentStatus.DELIVERED) {
      throw new Error('Cannot fail delivered shipment');
    }
    
    this.status = ShipmentStatus.FAILED;
    this.addTrackingEvent('Delivery failed', reason);
  }

  returnToSender(reason: string): void {
    if (this.status === ShipmentStatus.DELIVERED) {
      throw new Error('Cannot return delivered shipment');
    }
    
    this.status = ShipmentStatus.RETURNED;
    this.addTrackingEvent('Returned to sender', reason);
  }

  cancel(reason: string): void {
    if (this.status === ShipmentStatus.DELIVERED) {
      throw new Error('Cannot cancel delivered shipment');
    }
    
    this.status = ShipmentStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    this.addTrackingEvent('Cancelled', reason);
  }

  setEstimatedDelivery(date: Date): void {
    this.estimatedDeliveryDate = date;
  }

  setInsurance(value: number, cost: number = 0): void {
    this.isInsured = true;
    this.insuranceValue = value;
    this.insuranceCost = cost;
    this.recalculateTotalCost();
  }

  setDeclaredValue(value: number): void {
    this.declaredValue = value;
  }

  setSpecialHandling(options: {
    requiresSignature?: boolean;
    isFragile?: boolean;
    isDangerous?: boolean;
    specialInstructions?: string;
    deliveryInstructions?: string;
  }): void {
    if (options.requiresSignature !== undefined) {
      this.requiresSignature = options.requiresSignature;
    }
    if (options.isFragile !== undefined) {
      this.isFragile = options.isFragile;
    }
    if (options.isDangerous !== undefined) {
      this.isDangerous = options.isDangerous;
    }
    if (options.specialInstructions !== undefined) {
      this.specialInstructions = options.specialInstructions;
    }
    if (options.deliveryInstructions !== undefined) {
      this.deliveryInstructions = options.deliveryInstructions;
    }
  }

  setProviderData(shipmentId: string, labelId?: string, data?: any): void {
    this.providerShipmentId = shipmentId;
    this.providerLabelId = labelId;
    if (data) {
      this.providerData = { ...this.providerData, ...data };
    }
  }

  setLabelUrl(url: string): void {
    this.labelUrl = url;
  }

  setCarrierTrackingUrl(url: string): void {
    this.carrierTrackingUrl = url;
  }

  addAdditionalFees(amount: number, description?: string): void {
    this.additionalFees += amount;
    this.recalculateTotalCost();
    
    if (description) {
      this.addMetadata('additional_fees', {
        amount,
        description,
        addedAt: new Date().toISOString(),
      });
    }
  }

  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  setNotes(notes: string): void {
    this.notes = notes;
  }

  setInternalNotes(notes: string): void {
    this.internalNotes = notes;
  }

  private recalculateTotalCost(): void {
    this.totalCost = this.shippingCost + this.insuranceCost + this.additionalFees;
  }

  private addTrackingEvent(event: string, description: string, data?: any): void {
    const tracking = new ShipmentTracking();
    tracking.shipmentId = this.id;
    tracking.event = event;
    tracking.description = description;
    tracking.location = this.getCurrentLocation();
    tracking.timestamp = new Date();
    
    if (data) {
      tracking.data = data;
    }
    
    if (!this.trackingEvents) {
      this.trackingEvents = [];
    }
    this.trackingEvents.push(tracking);
  }

  private getCurrentLocation(): string {
    // This would typically be determined by the carrier's API
    switch (this.status) {
      case ShipmentStatus.PENDING:
      case ShipmentStatus.CONFIRMED:
        return `${this.senderCity}, ${this.senderState}`;
      case ShipmentStatus.PICKED_UP:
      case ShipmentStatus.IN_TRANSIT:
        return 'In Transit';
      case ShipmentStatus.OUT_FOR_DELIVERY:
      case ShipmentStatus.DELIVERED:
        return `${this.recipientCity}, ${this.recipientState}`;
      default:
        return 'Unknown';
    }
  }

  private static generateTrackingNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRK${timestamp}${random}`;
  }

  // Helper properties
  get isPending(): boolean {
    return this.status === ShipmentStatus.PENDING;
  }

  get isConfirmed(): boolean {
    return this.status === ShipmentStatus.CONFIRMED;
  }

  get isInTransit(): boolean {
    return this.status === ShipmentStatus.IN_TRANSIT || this.status === ShipmentStatus.OUT_FOR_DELIVERY;
  }

  get isDelivered(): boolean {
    return this.status === ShipmentStatus.DELIVERED;
  }

  get isCancelled(): boolean {
    return this.status === ShipmentStatus.CANCELLED;
  }

  get isFailed(): boolean {
    return this.status === ShipmentStatus.FAILED;
  }

  get canBeCancelled(): boolean {
    return ![ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED].includes(this.status);
  }

  get isInternational(): boolean {
    return this.senderCountry !== this.recipientCountry;
  }

  get hasInsurance(): boolean {
    return this.isInsured && this.insuranceValue > 0;
  }

  get hasSpecialHandling(): boolean {
    return this.requiresSignature || this.isFragile || this.isDangerous;
  }

  get formattedTotalCost(): string {
    return `${this.currency} ${this.totalCost.toFixed(2)}`;
  }

  get formattedWeight(): string {
    return `${this.weight} ${this.weightUnit}`;
  }

  get formattedDimensions(): string {
    if (!this.length || !this.width || !this.height) {
      return 'N/A';
    }
    return `${this.length} x ${this.width} x ${this.height} ${this.dimensionUnit}`;
  }

  get estimatedDeliveryDays(): number | null {
    if (!this.estimatedDeliveryDate) {
      return null;
    }
    
    const now = new Date();
    const diffTime = this.estimatedDeliveryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isDelayed(): boolean {
    if (!this.estimatedDeliveryDate || this.isDelivered) {
      return false;
    }
    
    return new Date() > this.estimatedDeliveryDate;
  }

  get senderAddress(): string {
    const parts = [this.senderStreet];
    if (this.senderStreet2) parts.push(this.senderStreet2);
    parts.push(`${this.senderCity}, ${this.senderState} ${this.senderPostalCode}`);
    parts.push(this.senderCountry);
    return parts.join(', ');
  }

  get recipientAddress(): string {
    const parts = [this.recipientStreet];
    if (this.recipientStreet2) parts.push(this.recipientStreet2);
    parts.push(`${this.recipientCity}, ${this.recipientState} ${this.recipientPostalCode}`);
    parts.push(this.recipientCountry);
    return parts.join(', ');
  }
}

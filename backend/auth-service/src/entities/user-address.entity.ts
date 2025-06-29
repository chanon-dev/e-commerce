import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { User } from './user.entity';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other',
}

@Entity('user_addresses')
@Index(['user_id'])
@Index(['user_id', 'type'])
@Index(['user_id', 'is_default'])
@Index(['postal_code'])
@Index(['country'])
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME,
  })
  type: AddressType;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company?: string;

  @Column({ type: 'varchar', length: 255 })
  address_line_1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line_2?: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  postal_code: string;

  @Column({ type: 'varchar', length: 2 })
  @Index()
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  is_default: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  delivery_instructions?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deleted_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @Column({ type: 'int', default: 1 })
  version: number;

  // Relationships
  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Virtual/Computed Properties
  @Transform(({ obj }) => `${obj.first_name || ''} ${obj.last_name || ''}`.trim())
  get full_name(): string {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
  }

  get formatted_address(): string {
    let address = this.address_line_1;
    
    if (this.address_line_2) {
      address += `, ${this.address_line_2}`;
    }
    
    address += `, ${this.city}, ${this.state} ${this.postal_code}`;
    
    if (this.country) {
      address += `, ${this.country.toUpperCase()}`;
    }
    
    return address;
  }

  get short_address(): string {
    return `${this.city}, ${this.state} ${this.postal_code}`;
  }

  get is_complete(): boolean {
    return !!(
      this.first_name &&
      this.last_name &&
      this.address_line_1 &&
      this.city &&
      this.state &&
      this.postal_code &&
      this.country
    );
  }

  get is_valid_for_shipping(): boolean {
    return this.is_complete && this.type !== AddressType.BILLING;
  }

  get is_valid_for_billing(): boolean {
    return this.is_complete;
  }

  get has_coordinates(): boolean {
    return !!(this.latitude && this.longitude);
  }

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateAddress() {
    // Trim whitespace
    this.first_name = this.first_name?.trim();
    this.last_name = this.last_name?.trim();
    this.company = this.company?.trim();
    this.address_line_1 = this.address_line_1?.trim();
    this.address_line_2 = this.address_line_2?.trim();
    this.city = this.city?.trim();
    this.state = this.state?.trim();
    this.postal_code = this.postal_code?.trim();
    this.country = this.country?.toUpperCase().trim();
    this.phone = this.phone?.trim();

    // Validate required fields
    if (!this.first_name || !this.last_name) {
      throw new Error('First name and last name are required');
    }

    if (!this.address_line_1) {
      throw new Error('Address line 1 is required');
    }

    if (!this.city || !this.state || !this.postal_code) {
      throw new Error('City, state, and postal code are required');
    }

    if (!this.country || this.country.length !== 2) {
      throw new Error('Valid 2-letter country code is required');
    }

    // Validate coordinates if provided
    if (this.latitude !== null && this.latitude !== undefined) {
      if (this.latitude < -90 || this.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }

    if (this.longitude !== null && this.longitude !== undefined) {
      if (this.longitude < -180 || this.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date();
    this.version += 1;
  }

  // Business Logic Methods
  setAsDefault(): void {
    this.is_default = true;
  }

  removeDefault(): void {
    this.is_default = false;
  }

  updateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude');
    }
    
    this.latitude = latitude;
    this.longitude = longitude;
  }

  clearCoordinates(): void {
    this.latitude = null;
    this.longitude = null;
  }

  updateDeliveryInstructions(instructions: string): void {
    this.delivery_instructions = instructions?.trim() || null;
  }

  updateMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  removeMetadata(key: string): void {
    if (this.metadata && this.metadata[key]) {
      delete this.metadata[key];
    }
  }

  // Validation methods
  isValidPostalCode(): boolean {
    if (!this.postal_code) return false;
    
    // Basic validation - can be enhanced based on country
    const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
    return postalCodeRegex.test(this.postal_code);
  }

  isValidPhoneNumber(): boolean {
    if (!this.phone) return true; // Optional field
    
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(this.phone);
  }

  isValidCountryCode(): boolean {
    if (!this.country) return false;
    
    // List of valid ISO 3166-1 alpha-2 country codes
    const validCountryCodes = [
      'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
      'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL',
      'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE',
      'JP', 'KR', 'CN', 'IN', 'SG', 'MY', 'TH', 'PH', 'ID', 'VN',
      'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY', 'PY', 'BO', 'EC',
      'ZA', 'EG', 'MA', 'NG', 'KE', 'GH', 'TN', 'DZ', 'AO', 'MZ',
      // Add more as needed
    ];
    
    return validCountryCodes.includes(this.country.toUpperCase());
  }

  // Distance calculation (if coordinates are available)
  calculateDistanceTo(otherAddress: UserAddress): number | null {
    if (!this.has_coordinates || !otherAddress.has_coordinates) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(otherAddress.latitude! - this.latitude!);
    const dLon = this.toRadians(otherAddress.longitude! - this.longitude!);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude!)) * 
      Math.cos(this.toRadians(otherAddress.latitude!)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Comparison methods
  isSameAs(otherAddress: UserAddress): boolean {
    return (
      this.address_line_1.toLowerCase() === otherAddress.address_line_1.toLowerCase() &&
      (this.address_line_2 || '').toLowerCase() === (otherAddress.address_line_2 || '').toLowerCase() &&
      this.city.toLowerCase() === otherAddress.city.toLowerCase() &&
      this.state.toLowerCase() === otherAddress.state.toLowerCase() &&
      this.postal_code === otherAddress.postal_code &&
      this.country === otherAddress.country
    );
  }

  // Soft delete
  softDelete(deletedBy?: string): void {
    this.deleted_at = new Date();
    this.deleted_by = deletedBy;
  }

  restore(): void {
    this.deleted_at = null;
    this.deleted_by = null;
  }

  // Serialization
  toJSON(): Partial<UserAddress> {
    return {
      id: this.id,
      type: this.type,
      first_name: this.first_name,
      last_name: this.last_name,
      company: this.company,
      address_line_1: this.address_line_1,
      address_line_2: this.address_line_2,
      city: this.city,
      state: this.state,
      postal_code: this.postal_code,
      country: this.country,
      phone: this.phone,
      is_default: this.is_default,
      delivery_instructions: this.delivery_instructions,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  toShippingLabel(): {
    name: string;
    company?: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  } {
    return {
      name: this.full_name,
      company: this.company,
      address: this.address_line_2 
        ? `${this.address_line_1}, ${this.address_line_2}`
        : this.address_line_1,
      city: this.city,
      state: this.state,
      postal_code: this.postal_code,
      country: this.country,
      phone: this.phone,
    };
  }
}

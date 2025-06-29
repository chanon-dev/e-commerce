import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserAddress } from './user-address.entity';
import { UserSession } from './user-session.entity';
import { UserPreference } from './user-preference.entity';
import { SocialLogin } from './social-login.entity';
import { Role } from './role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone_number'])
@Index(['status', 'deleted_at'])
@Index(['created_at'])
@Index(['last_login_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude({ toPlainOnly: true })
  password_hash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  phone_number?: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth?: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  email_verification_token?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Exclude({ toPlainOnly: true })
  phone_verification_token?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  password_reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  password_reset_expires?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip?: string;

  @Column({ type: 'int', default: 0 })
  login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until?: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @Index()
  status: UserStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'varchar', length: 10, default: 'en-US' })
  locale: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

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
  @OneToMany(() => UserAddress, (address) => address.user, {
    cascade: true,
    eager: false,
  })
  addresses: UserAddress[];

  @OneToMany(() => UserSession, (session) => session.user, {
    cascade: true,
    eager: false,
  })
  sessions: UserSession[];

  @OneToMany(() => UserPreference, (preference) => preference.user, {
    cascade: true,
    eager: false,
  })
  user_preferences: UserPreference[];

  @OneToMany(() => SocialLogin, (social) => social.user, {
    cascade: true,
    eager: false,
  })
  social_logins: SocialLogin[];

  @ManyToMany(() => Role, (role) => role.users, {
    eager: false,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // Virtual/Computed Properties
  @Transform(({ obj }) => `${obj.first_name || ''} ${obj.last_name || ''}`.trim())
  get full_name(): string {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
  }

  get is_locked(): boolean {
    return this.locked_until ? new Date() < this.locked_until : false;
  }

  get age(): number {
    if (!this.date_of_birth) return 0;
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  get is_adult(): boolean {
    return this.age >= 18;
  }

  get can_login(): boolean {
    return (
      this.status === UserStatus.ACTIVE &&
      !this.is_locked &&
      this.is_email_verified
    );
  }

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      this.password_hash = await bcrypt.hash(this.password_hash, 12);
    }
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date();
    this.version += 1;
  }

  @AfterLoad()
  computeVirtualFields() {
    // Any post-load computations can go here
  }

  // Business Logic Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  async setPassword(password: string): Promise<void> {
    this.password_hash = await bcrypt.hash(password, 12);
  }

  lockAccount(duration: number = 30): void {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + duration);
    this.locked_until = lockUntil;
    this.login_attempts = 0;
  }

  unlockAccount(): void {
    this.locked_until = null;
    this.login_attempts = 0;
  }

  incrementLoginAttempts(): void {
    this.login_attempts += 1;
    if (this.login_attempts >= 5) {
      this.lockAccount(30); // Lock for 30 minutes
    }
  }

  resetLoginAttempts(): void {
    this.login_attempts = 0;
    this.locked_until = null;
  }

  updateLastLogin(ipAddress?: string): void {
    this.last_login_at = new Date();
    this.last_login_ip = ipAddress;
    this.resetLoginAttempts();
  }

  verifyEmail(): void {
    this.is_email_verified = true;
    this.email_verification_token = null;
    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE;
    }
  }

  verifyPhone(): void {
    this.is_phone_verified = true;
    this.phone_verification_token = null;
  }

  generateEmailVerificationToken(): string {
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
    this.email_verification_token = token;
    return token;
  }

  generatePhoneVerificationToken(): string {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    this.phone_verification_token = token;
    return token;
  }

  generatePasswordResetToken(): string {
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
    this.password_reset_token = token;
    this.password_reset_expires = new Date(Date.now() + 3600000); // 1 hour
    return token;
  }

  isPasswordResetTokenValid(token: string): boolean {
    return (
      this.password_reset_token === token &&
      this.password_reset_expires &&
      new Date() < this.password_reset_expires
    );
  }

  clearPasswordResetToken(): void {
    this.password_reset_token = null;
    this.password_reset_expires = null;
  }

  suspend(reason?: string): void {
    this.status = UserStatus.SUSPENDED;
    if (reason && this.metadata) {
      this.metadata.suspension_reason = reason;
      this.metadata.suspended_at = new Date().toISOString();
    }
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.unlockAccount();
    if (this.metadata) {
      delete this.metadata.suspension_reason;
      delete this.metadata.suspended_at;
    }
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
  }

  softDelete(deletedBy?: string): void {
    this.status = UserStatus.DELETED;
    this.deleted_at = new Date();
    this.deleted_by = deletedBy;
  }

  restore(): void {
    this.status = UserStatus.ACTIVE;
    this.deleted_at = null;
    this.deleted_by = null;
  }

  updateProfile(data: Partial<User>): void {
    const allowedFields = [
      'first_name',
      'last_name',
      'phone_number',
      'date_of_birth',
      'gender',
      'avatar_url',
      'timezone',
      'locale',
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        this[field] = data[field];
      }
    });
  }

  updatePreferences(preferences: Record<string, any>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  addMetadata(key: string, value: any): void {
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

  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false;
  }

  hasPermission(permission: string): boolean {
    if (!this.roles) return false;
    
    return this.roles.some((role) =>
      role.permissions?.some((perm) => perm.name === permission)
    );
  }

  getDefaultAddress(): UserAddress | null {
    return this.addresses?.find((addr) => addr.is_default) || null;
  }

  getShippingAddresses(): UserAddress[] {
    return this.addresses?.filter(
      (addr) => addr.type === 'shipping' || addr.type === 'home'
    ) || [];
  }

  getBillingAddresses(): UserAddress[] {
    return this.addresses?.filter(
      (addr) => addr.type === 'billing' || addr.type === 'home'
    ) || [];
  }

  getActiveSessions(): UserSession[] {
    return this.sessions?.filter(
      (session) => session.is_active && session.expires_at > new Date()
    ) || [];
  }

  revokeAllSessions(): void {
    if (this.sessions) {
      this.sessions.forEach((session) => {
        session.revoke();
      });
    }
  }

  // Static methods for queries
  static createQueryBuilder(alias?: string) {
    // This would be implemented in the repository
    return null;
  }

  // Validation methods
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isValidPhoneNumber(): boolean {
    if (!this.phone_number) return true; // Optional field
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(this.phone_number);
  }

  isProfileComplete(): boolean {
    return !!(
      this.first_name &&
      this.last_name &&
      this.email &&
      this.is_email_verified
    );
  }

  // Serialization methods
  toJSON(): Partial<User> {
    const { password_hash, email_verification_token, phone_verification_token, 
            password_reset_token, password_reset_expires, ...result } = this;
    return result;
  }

  toPublicProfile(): Partial<User> {
    return {
      id: this.id,
      first_name: this.first_name,
      last_name: this.last_name,
      avatar_url: this.avatar_url,
      created_at: this.created_at,
    };
  }
}

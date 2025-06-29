import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum VerificationTokenStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  TWO_FACTOR = 'two_factor',
}

@Entity('email_verifications')
@Index(['token'])
@Index(['userId'])
@Index(['email'])
@Index(['expiresAt'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
    default: VerificationType.EMAIL,
  })
  type: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationTokenStatus,
    default: VerificationTokenStatus.PENDING,
  })
  status: VerificationTokenStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  code?: string; // For SMS/2FA verification

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ default: 5 })
  maxAttempts: number;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return (
      this.status === VerificationTokenStatus.PENDING &&
      !this.isExpired() &&
      this.attemptCount < this.maxAttempts
    );
  }

  canAttempt(): boolean {
    return this.attemptCount < this.maxAttempts && !this.isExpired();
  }

  incrementAttempt(): void {
    this.attemptCount++;
  }

  markAsVerified(): void {
    this.status = VerificationTokenStatus.VERIFIED;
    this.verifiedAt = new Date();
  }

  markAsExpired(): void {
    this.status = VerificationTokenStatus.EXPIRED;
  }

  getRemainingTime(): number {
    if (this.isExpired()) return 0;
    return this.expiresAt.getTime() - Date.now();
  }

  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attemptCount);
  }
}

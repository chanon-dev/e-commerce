import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ResetTokenStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('password_resets')
@Index(['token'])
@Index(['userId'])
@Index(['expiresAt'])
export class PasswordReset {
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
    enum: ResetTokenStatus,
    default: ResetTokenStatus.PENDING,
  })
  status: ResetTokenStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.status === ResetTokenStatus.PENDING && !this.isExpired();
  }

  markAsUsed(): void {
    this.status = ResetTokenStatus.USED;
    this.usedAt = new Date();
  }

  markAsExpired(): void {
    this.status = ResetTokenStatus.EXPIRED;
  }

  getRemainingTime(): number {
    if (this.isExpired()) return 0;
    return this.expiresAt.getTime() - Date.now();
  }
}

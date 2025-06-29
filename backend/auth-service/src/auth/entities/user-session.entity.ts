import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SessionType {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
  ADMIN = 'admin',
}

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('user_sessions')
@Index(['userId', 'status'])
@Index(['accessToken'])
@Index(['refreshToken'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({ unique: true })
  accessToken: string;

  @Column({ unique: true })
  refreshToken: string;

  @Column({
    type: 'enum',
    enum: SessionType,
    default: SessionType.WEB,
  })
  type: SessionType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column()
  deviceInfo: string;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && !this.isExpired();
  }

  getRemainingTime(): number {
    if (this.isExpired()) return 0;
    return this.expiresAt.getTime() - Date.now();
  }

  updateLastAccessed(): void {
    this.lastAccessedAt = new Date();
  }

  revoke(): void {
    this.status = SessionStatus.REVOKED;
  }

  expire(): void {
    this.status = SessionStatus.EXPIRED;
  }
}

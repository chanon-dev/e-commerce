import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum AuthProviderType {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  LINE = 'line',
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

@Entity('auth_providers')
@Unique(['userId', 'provider'])
@Index(['provider', 'providerId'])
export class AuthProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: AuthProviderType,
  })
  provider: AuthProviderType;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ type: 'jsonb', default: {} })
  providerData: Record<string, any>;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    return new Date() > this.tokenExpiresAt;
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  updateTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    }
  }

  deactivate(): void {
    this.isActive = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { EventPublisherService } from '../../../../infrastructure/kafka/event-publisher.service';

@Injectable()
export class AuthEventService {
  private readonly logger = new Logger(AuthEventService.name);

  constructor(private readonly eventPublisher: EventPublisherService) {}

  async publishUserRegistered(userData: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    registrationMethod: 'email' | 'social' | 'phone';
    isEmailVerified: boolean;
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishUserRegistered({
        ...userData,
        createdAt: new Date().toISOString(),
      }, { correlationId, userId: userData.userId });

      this.logger.log(`👤 User registered event published for user ${userData.userId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish user registered event:`, error);
      throw error;
    }
  }

  async publishUserLogin(loginData: {
    userId: string;
    loginMethod: 'password' | 'social' | 'sso';
    ipAddress: string;
    userAgent: string;
    location?: {
      country: string;
      city: string;
    };
  }, correlationId?: string): Promise<void> {
    try {
      await this.eventPublisher.publishUserLogin({
        ...loginData,
        loginAt: new Date().toISOString(),
      }, { correlationId });

      this.logger.log(`🔐 User login event published for user ${loginData.userId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to publish user login event:`, error);
      throw error;
    }
  }

  // Integration with Auth Service methods
  async onUserRegistered(user: any, registrationMethod: 'email' | 'social' | 'phone'): Promise<void> {
    const userData = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      registrationMethod,
      isEmailVerified: user.isEmailVerified || false,
    };

    await this.publishUserRegistered(userData, user.correlationId);
  }

  async onUserLogin(user: any, loginData: {
    loginMethod: 'password' | 'social' | 'sso';
    ipAddress: string;
    userAgent: string;
    location?: {
      country: string;
      city: string;
    };
  }): Promise<void> {
    const eventData = {
      userId: user.id,
      ...loginData,
    };

    await this.publishUserLogin(eventData, user.correlationId);
  }

  async onPasswordChanged(userId: string, correlationId?: string): Promise<void> {
    // Publish user profile updated event for password change
    // This would require adding the method to EventPublisherService
    this.logger.log(`🔒 Password changed for user ${userId}`);
  }

  async onEmailVerified(userId: string, correlationId?: string): Promise<void> {
    // Publish user profile updated event for email verification
    this.logger.log(`✅ Email verified for user ${userId}`);
  }

  async onAccountLocked(userId: string, reason: string, correlationId?: string): Promise<void> {
    // Publish security event for account lockout
    this.logger.log(`🔒 Account locked for user ${userId}: ${reason}`);
  }

  async onSuspiciousActivity(userId: string, activity: string, ipAddress: string, correlationId?: string): Promise<void> {
    // Publish security event for suspicious activity
    this.logger.warn(`⚠️ Suspicious activity detected for user ${userId}: ${activity} from ${ipAddress}`);
  }
}

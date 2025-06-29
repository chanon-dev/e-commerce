import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserSession, SessionStatus } from '../entities/user-session.entity';
import { UserService } from '../../user/services/user.service';
import { CacheService } from '../../common/services/cache.service';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  isEmailVerified: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private cacheService: CacheService,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload): Promise<any> {
    try {
      const { sub: userId } = payload;

      // Check if user exists and is active
      const user = await this.getUserFromCacheOrDb(userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Extract token from request
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Validate session
      const session = await this.validateSession(token, userId);
      if (!session) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Update session last accessed time
      await this.updateSessionLastAccessed(session);

      // Return user data for request context
      return {
        sub: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        roles: user.roles || [],
        permissions: user.permissions || [],
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        profilePicture: user.profilePicture,
        sessionId: session.id,
        sessionType: session.type,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async getUserFromCacheOrDb(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;
    
    // Try to get from cache first
    let user = await this.cacheService.get(cacheKey);
    
    if (!user) {
      // Get from database
      user = await this.userService.findById(userId);
      
      if (user) {
        // Cache for 5 minutes
        await this.cacheService.set(cacheKey, user, 300);
      }
    }
    
    return user;
  }

  private async validateSession(token: string, userId: string): Promise<UserSession | null> {
    const cacheKey = `session:${token}`;
    
    // Try to get from cache first
    let session = await this.cacheService.get(cacheKey);
    
    if (!session) {
      // Get from database
      session = await this.sessionRepository.findOne({
        where: {
          accessToken: token,
          userId,
          status: SessionStatus.ACTIVE,
        },
      });
      
      if (session && session.isActive()) {
        // Cache for 1 minute
        await this.cacheService.set(cacheKey, session, 60);
      }
    }
    
    return session && session.isActive() ? session : null;
  }

  private async updateSessionLastAccessed(session: UserSession): Promise<void> {
    // Update last accessed time (throttled to avoid too many DB writes)
    const now = new Date();
    const lastUpdate = session.lastAccessedAt || session.createdAt;
    const timeDiff = now.getTime() - lastUpdate.getTime();
    
    // Only update if more than 1 minute has passed
    if (timeDiff > 60000) {
      session.updateLastAccessed();
      
      // Update in background without waiting
      this.sessionRepository.save(session).catch(error => {
        this.logger.error(`Failed to update session last accessed: ${error.message}`);
      });
      
      // Update cache
      const cacheKey = `session:${session.accessToken}`;
      await this.cacheService.set(cacheKey, session, 60);
    }
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CacheService } from '../services/cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      // Check cache first
      const cacheKey = `auth:token:${token}`;
      let user = await this.cacheService.get(cacheKey);

      if (!user) {
        // Validate token with auth service
        user = await this.validateToken(token);
        
        if (user) {
          // Cache for 5 minutes
          await this.cacheService.set(cacheKey, user, 300);
        }
      }

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Add user to request
      request.user = user;
      request.token = token;

      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateToken(token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/api/v1/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }),
      );

      if (response.status === 200 && response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      this.logger.debug(`Token validation failed: ${error.message}`);
      return null;
    }
  }
}

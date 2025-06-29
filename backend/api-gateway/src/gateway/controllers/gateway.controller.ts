import {
  Controller,
  All,
  Req,
  Res,
  Next,
  UseGuards,
  UseInterceptors,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

import { ProxyService } from '../services/proxy.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { RouteResolver } from '../resolvers/route.resolver';

@ApiTags('Gateway')
@Controller()
@UseGuards(RateLimitGuard)
@UseInterceptors(LoggingInterceptor)
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly proxyService: ProxyService,
    private readonly routeResolver: RouteResolver,
  ) {}

  @All('auth/*')
  @ApiExcludeEndpoint()
  async proxyAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('auth-service', req, res, next);
  }

  @All('users/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('user-service', req, res, next);
  }

  @All('products/*')
  @UseInterceptors(CacheInterceptor)
  @ApiExcludeEndpoint()
  async proxyProducts(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('product-service', req, res, next);
  }

  @All('orders/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyOrders(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('order-service', req, res, next);
  }

  @All('payments/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyPayments(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('payment-service', req, res, next);
  }

  @All('cart/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyCart(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('cart-service', req, res, next);
  }

  @All('inventory/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyInventory(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('inventory-service', req, res, next);
  }

  @All('notifications/*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async proxyNotifications(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyRequest('notification-service', req, res, next);
  }

  private async proxyRequest(
    serviceName: string,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Resolve the route and extract service path
      const route = this.routeResolver.resolveRoute(req.path, serviceName);
      if (!route) {
        throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
      }

      // Prepare headers (exclude hop-by-hop headers)
      const headers = this.prepareHeaders(req.headers);

      // Add user context if available
      if (req.user) {
        headers['X-User-ID'] = req.user.sub;
        headers['X-User-Email'] = req.user.email;
        headers['X-User-Roles'] = JSON.stringify(req.user.roles || []);
      }

      // Add request metadata
      headers['X-Request-ID'] = req.headers['x-request-id'] || this.generateRequestId();
      headers['X-Forwarded-For'] = req.ip;
      headers['X-Forwarded-Proto'] = req.protocol;
      headers['X-Forwarded-Host'] = req.get('host');

      // Make the proxy request
      const proxyResponse = await this.proxyService.proxyRequest({
        serviceName,
        path: route.targetPath,
        method: req.method as any,
        headers,
        body: req.body,
        query: req.query as Record<string, any>,
      });

      // Set response headers
      Object.entries(proxyResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add gateway headers
      res.setHeader('X-Gateway-Service', serviceName);
      res.setHeader('X-Response-Time', `${proxyResponse.responseTime}ms`);
      res.setHeader('X-Request-ID', headers['X-Request-ID']);

      // Send response
      res.status(proxyResponse.status).json(proxyResponse.data);
    } catch (error) {
      this.logger.error(
        `Proxy request failed for ${serviceName}: ${error.message}`,
        error.stack,
      );

      // Handle different types of errors
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();
        res.status(status).json(response);
      } else {
        res.status(HttpStatus.BAD_GATEWAY).json({
          success: false,
          message: 'Gateway error',
          error: error.message,
          service: serviceName,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private prepareHeaders(headers: Record<string, any>): Record<string, string> {
    const prepared: Record<string, string> = {};

    // Headers to exclude (hop-by-hop headers)
    const excludeHeaders = [
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
      'host', // Will be set by the proxy
    ];

    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (!excludeHeaders.includes(lowerKey) && value) {
        prepared[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    });

    return prepared;
  }

  private generateRequestId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

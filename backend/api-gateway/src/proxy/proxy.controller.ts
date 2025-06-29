import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('auth/*')
  @ApiOperation({ summary: 'Proxy to Auth Service' })
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'auth-service:3001');
  }

  @All('users/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to User Service' })
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'user-service:3002');
  }

  @All('products/*')
  @ApiOperation({ summary: 'Proxy to Product Service' })
  async proxyProducts(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'product-service:3003');
  }

  @All('orders/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Order Service' })
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'order-service:3004');
  }

  @All('payments/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Payment Service' })
  async proxyPayments(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'payment-service:3005');
  }

  @All('cart/*')
  @ApiOperation({ summary: 'Proxy to Cart Service' })
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'cart-service:3006');
  }

  @All('inventory/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Inventory Service' })
  async proxyInventory(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'inventory-service:3007');
  }

  @All('shipping/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Shipping Service' })
  async proxyShipping(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'shipping-service:3008');
  }

  @All('promotions/*')
  @ApiOperation({ summary: 'Proxy to Promotion Service' })
  async proxyPromotions(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'promotion-service:3009');
  }

  @All('reviews/*')
  @ApiOperation({ summary: 'Proxy to Review Service' })
  async proxyReviews(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'review-service:3010');
  }

  @All('notifications/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Notification Service' })
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'notification-service:3011');
  }

  @All('admin/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy to Admin Service' })
  async proxyAdmin(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'admin-service:3012');
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart contents' })
  @ApiResponse({ status: 200, description: 'Cart contents retrieved successfully' })
  async getCart(@Query('sessionId') sessionId?: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      return {
        items: [],
        total: 0,
        itemCount: 0,
        currency: 'USD',
      };
    }

    return this.cartService.getCart(cartId, !!userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Query('sessionId') sessionId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId || this.generateSessionId();

    return this.cartService.addToCart(cartId, addToCartDto, !!userId);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateCartItem(
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Query('sessionId') sessionId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      throw new Error('Cart not found');
    }

    return this.cartService.updateCartItem(cartId, itemId, updateCartItemDto, !!userId);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 204, description: 'Item removed from cart successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeFromCart(
    @Param('itemId') itemId: string,
    @Query('sessionId') sessionId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      throw new Error('Cart not found');
    }

    return this.cartService.removeFromCart(cartId, itemId, !!userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  async clearCart(@Query('sessionId') sessionId?: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      return;
    }

    return this.cartService.clearCart(cartId, !!userId);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart with user cart after login' })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  async mergeCart(@Body() mergeCartDto: MergeCartDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.cartService.mergeCart(userId, mergeCartDto.guestCartId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count' })
  @ApiResponse({ status: 200, description: 'Cart item count retrieved successfully' })
  async getCartCount(@Query('sessionId') sessionId?: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      return { count: 0 };
    }

    const count = await this.cartService.getCartItemCount(cartId, !!userId);
    return { count };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate cart items (check availability, prices)' })
  @ApiResponse({ status: 200, description: 'Cart validation completed' })
  async validateCart(@Query('sessionId') sessionId?: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      return {
        valid: true,
        issues: [],
      };
    }

    return this.cartService.validateCart(cartId, !!userId);
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply coupon to cart' })
  @ApiResponse({ status: 200, description: 'Coupon applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coupon' })
  async applyCoupon(
    @Body() body: { couponCode: string },
    @Query('sessionId') sessionId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      throw new Error('Cart not found');
    }

    return this.cartService.applyCoupon(cartId, body.couponCode, !!userId);
  }

  @Delete('coupon')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove coupon from cart' })
  @ApiResponse({ status: 204, description: 'Coupon removed successfully' })
  async removeCoupon(@Query('sessionId') sessionId?: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const cartId = userId || sessionId;

    if (!cartId) {
      return;
    }

    return this.cartService.removeCoupon(cartId, !!userId);
  }

  private generateSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

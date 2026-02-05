import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartService, CartItem } from './cart.service';
import { Public } from '../auth/decorators/public.decorator';

class ValidateCartDto {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
}

class ApplyDiscountDto {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  code: string;
}

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Validate cart items and get pricing' })
  @ApiResponse({ status: 200, description: 'Cart validated with pricing' })
  @ApiResponse({ status: 400, description: 'Invalid cart items' })
  async validateCart(@Body() dto: ValidateCartDto) {
    return this.cartService.validateAndEnrichCart(dto.items);
  }

  @Post('apply-discount')
  @Public()
  @ApiOperation({ summary: 'Apply discount code to cart' })
  @ApiResponse({ status: 200, description: 'Discount applied' })
  @ApiResponse({ status: 400, description: 'Invalid discount code' })
  async applyDiscount(@Body() dto: ApplyDiscountDto) {
    const cart = await this.cartService.validateAndEnrichCart(dto.items);
    return this.cartService.applyDiscountCode(cart, dto.code);
  }

  @Get('shipping-rates')
  @Public()
  @ApiOperation({ summary: 'Get shipping rates for cart' })
  async getShippingRates(
    @Query('subtotal') subtotal: number,
    @Query('zip') zip: string,
  ) {
    const cart = {
      items: [],
      itemCount: 0,
      subtotal: Number(subtotal) || 0,
      discountAmount: 0,
      estimatedShipping: 0,
      estimatedTax: 0,
      total: Number(subtotal) || 0,
      totalWeightGrams: 0,
      totalWeightLbs: 0,
    };
    return this.cartService.getShippingRates(cart, zip);
  }

  @Get('volume-discount')
  @Public()
  @ApiOperation({ summary: 'Get volume discount information' })
  getVolumeDiscountInfo() {
    return this.cartService.getVolumeDiscountInfo();
  }
}

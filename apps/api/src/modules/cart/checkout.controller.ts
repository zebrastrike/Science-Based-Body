import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CheckoutService, CreateOrderDto } from './checkout.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class InitCheckoutDto {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
}

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Get('requirements')
  @Public()
  @ApiOperation({ summary: 'Get checkout requirements and configuration' })
  @ApiResponse({ status: 200, description: 'Checkout requirements' })
  getRequirements() {
    return this.checkoutService.getCheckoutRequirements();
  }

  @Post('initialize')
  @Public()
  @ApiOperation({ summary: 'Initialize checkout session with cart validation' })
  @ApiResponse({ status: 200, description: 'Checkout initialized' })
  @ApiResponse({ status: 400, description: 'Invalid cart' })
  async initializeCheckout(@Body() dto: InitCheckoutDto) {
    return this.checkoutService.initializeCheckout(dto.items);
  }

  @Post('create-order')
  @Public() // Allow guest checkout, but validate in service
  @ApiOperation({ summary: 'Create order from checkout' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    return this.checkoutService.createOrder(
      dto,
      userId || null,
      ipAddress,
      userAgent,
    );
  }

  @Post('create-order/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order for authenticated user' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createOrderAuthenticated(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @CurrentUser('id') userId: string,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    return this.checkoutService.createOrder(dto, userId, ipAddress, userAgent);
  }
}

import { Controller, Get, Post, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ReturnReason } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(
    @CurrentUser('id') userId: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    return this.ordersService.create(userId, data, ipAddress, userAgent);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findByUser(userId, page, limit);
  }

  @Public()
  @Get('lookup')
  @ApiOperation({ summary: 'Guest order lookup by order number + email' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  guestLookup(
    @Query('orderNumber') orderNumber: string,
    @Query('email') email: string,
  ) {
    return this.ordersService.lookupByOrderNumberAndEmail(orderNumber, email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.findByIdWithTimeline(id, userId);
  }

  // ===========================================================================
  // RETURNS ENDPOINTS
  // ===========================================================================

  @Post(':id/return')
  @ApiOperation({ summary: 'Request a return for an order' })
  @ApiResponse({ status: 201, description: 'Return request created' })
  @ApiResponse({ status: 400, description: 'Order not eligible for return' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  requestReturn(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() body: {
      reason: ReturnReason;
      reasonDetails?: string;
      items: Array<{ orderItemId: string; quantity: number }>;
    },
  ) {
    return this.ordersService.requestReturn(userId, orderId, body);
  }

  @Get('returns/my')
  @ApiOperation({ summary: 'Get my return requests' })
  @ApiResponse({ status: 200, description: 'List of return requests' })
  getMyReturns(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getMyReturns(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('returns/:returnId')
  @ApiOperation({ summary: 'Get a specific return request' })
  @ApiResponse({ status: 200, description: 'Return request details' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  getReturnById(
    @CurrentUser('id') userId: string,
    @Param('returnId') returnId: string,
  ) {
    return this.ordersService.getReturnById(userId, returnId);
  }

  @Delete('returns/:returnId')
  @ApiOperation({ summary: 'Cancel a return request' })
  @ApiResponse({ status: 200, description: 'Return request cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this return request' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  cancelReturn(
    @CurrentUser('id') userId: string,
    @Param('returnId') returnId: string,
  ) {
    return this.ordersService.cancelReturn(userId, returnId);
  }

  // ===========================================================================
  // EMAIL RESEND
  // ===========================================================================

  @Post(':id/resend-confirmation')
  @ApiOperation({ summary: 'Resend order confirmation email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  resendConfirmation(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.resendOrderConfirmation(orderId, userId);
  }
}

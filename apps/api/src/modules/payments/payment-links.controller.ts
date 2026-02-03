import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentLinksService, PaymentLinkStatus } from './payment-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

// ===========================================================================
// ADMIN ENDPOINTS
// ===========================================================================

@ApiTags('admin/payment-links')
@Controller('admin/payment-links')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminPaymentLinksController {
  constructor(private paymentLinksService: PaymentLinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment link' })
  @ApiResponse({ status: 201, description: 'Payment link created' })
  createPaymentLink(
    @Request() req,
    @Body()
    body: {
      orderId?: string;
      customerEmail: string;
      customerName?: string;
      amount: number;
      expiresInHours?: number;
      paymentMethods?: string[];
      notes?: string;
      sendEmail?: boolean;
    },
  ) {
    return this.paymentLinksService.createPaymentLink(body, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payment links' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentLinkStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Payment links list' })
  getPaymentLinks(
    @Query('status') status?: PaymentLinkStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentLinksService.getPaymentLinks({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend payment link email' })
  @ApiParam({ name: 'id', description: 'Payment link ID' })
  @ApiResponse({ status: 200, description: 'Email resent' })
  resendPaymentLink(@Request() req, @Param('id') id: string) {
    return this.paymentLinksService.resendPaymentLink(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel payment link' })
  @ApiParam({ name: 'id', description: 'Payment link ID' })
  @ApiResponse({ status: 200, description: 'Payment link cancelled' })
  cancelPaymentLink(@Request() req, @Param('id') id: string) {
    return this.paymentLinksService.cancelPaymentLink(id, req.user.id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Manually mark payment link as paid' })
  @ApiParam({ name: 'id', description: 'Payment link ID' })
  @ApiResponse({ status: 200, description: 'Payment marked as paid' })
  markAsPaid(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; proofUrl?: string },
  ) {
    return this.paymentLinksService.markAsPaid(
      id,
      body.paymentMethod,
      req.user.id,
      body.proofUrl,
    );
  }
}

// ===========================================================================
// PUBLIC ENDPOINTS (Customer facing)
// ===========================================================================

@ApiTags('payment-links')
@Controller('pay')
export class PublicPaymentLinksController {
  constructor(private paymentLinksService: PaymentLinksService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Get payment link details by token' })
  @ApiParam({ name: 'token', description: 'Payment link token' })
  @ApiResponse({ status: 200, description: 'Payment link details' })
  @ApiResponse({ status: 404, description: 'Payment link not found' })
  @ApiResponse({ status: 400, description: 'Payment link expired or already used' })
  getPaymentLinkByToken(@Param('token') token: string) {
    return this.paymentLinksService.getPaymentLinkByToken(token);
  }
}

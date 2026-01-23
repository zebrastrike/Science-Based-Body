import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentMethod } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('methods')
  @Public()
  @ApiOperation({ summary: 'Get available payment methods' })
  getPaymentMethods() {
    return this.paymentsService.getAvailablePaymentMethods();
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a payment for an order' })
  async createPayment(
    @Body()
    body: {
      orderId: string;
      method: PaymentMethod;
      amount: number;
    },
    @CurrentUser('email') email: string,
  ) {
    return this.paymentsService.createPayment(
      body.orderId,
      body.method,
      body.amount,
      email,
    );
  }

  @Post(':id/proof')
  @ApiOperation({ summary: 'Submit proof of payment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('proof'))
  async submitProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('referenceNumber') referenceNumber: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.submitPaymentProof(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
      referenceNumber,
      userId,
    );
  }

  @Post(':id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify a payment (Admin only)' })
  async verifyPayment(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.paymentsService.verifyPayment(id, adminId, notes);
  }

  @Post(':id/refund')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Process a refund (Admin only)' })
  async processRefund(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.paymentsService.processRefund(
      id,
      body.amount,
      body.reason,
      adminId,
    );
  }

  @Post('webhook/propello')
  @Public()
  @ApiOperation({ summary: 'Epicor Propello webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-propello-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString() || '';
    return this.paymentsService.handleWebhook(payload, signature);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EpicorPropelloService } from './epicor-propello.service';
import { FilesService } from '../files/files.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private propello: EpicorPropelloService,
    private filesService: FilesService,
  ) {}

  /**
   * Create a payment for an order
   */
  async createPayment(
    orderId: string,
    method: PaymentMethod,
    amount: number,
    customerEmail: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method,
        amount,
        status: 'PENDING',
      },
    });

    // If using Epicor Propello, create payment intent
    if (method === 'EPICOR_PROPELLO' && this.propello.isServiceEnabled()) {
      const paymentIntent = await this.propello.createPaymentIntent({
        amount,
        currency: 'USD',
        orderId,
        customerEmail,
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          propelloPaymentIntentId: paymentIntent.id,
          status: 'PROCESSING',
        },
      });

      return {
        payment: {
          ...payment,
          propelloPaymentIntentId: paymentIntent.id,
        },
        clientSecret: paymentIntent.clientSecret,
      };
    }

    // For manual payment methods, return payment info
    return {
      payment,
      instructions: this.getPaymentInstructions(method, order.orderNumber),
    };
  }

  /**
   * Get payment instructions for manual methods
   */
  private getPaymentInstructions(method: PaymentMethod, orderNumber: string) {
    const fallback = this.propello.getFallbackPaymentMethods();

    switch (method) {
      case 'ZELLE':
        return {
          method: 'Zelle',
          email: fallback.zelle.email,
          instructions: `Send $[amount] via Zelle to ${fallback.zelle.email}. Include order number ${orderNumber} in the memo.`,
        };
      case 'CASHAPP':
        return {
          method: 'CashApp',
          tag: fallback.cashapp.tag,
          instructions: `Send $[amount] via CashApp to ${fallback.cashapp.tag}. Include order number ${orderNumber} in the note.`,
        };
      default:
        return null;
    }
  }

  /**
   * Submit proof of payment (for manual methods)
   */
  async submitPaymentProof(
    paymentId: string,
    proofFile: Buffer,
    fileName: string,
    mimeType: string,
    referenceNumber: string,
    userId: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Payment is no longer pending');
    }

    // Upload proof file
    const file = await this.filesService.uploadFile(
      proofFile,
      fileName,
      mimeType,
      {
        bucketType: 'payment-proofs',
        fileType: 'PAYMENT_PROOF',
        uploadedBy: userId,
      },
    );

    // Update payment
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        proofFileId: file.id,
        referenceNumber,
        status: 'PROCESSING',
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'AWAITING_PAYMENT' },
    });

    return { success: true, message: 'Payment proof submitted for review' };
  }

  /**
   * Verify payment (admin only)
   */
  async verifyPayment(
    paymentId: string,
    adminId: string,
    notes?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        verificationNotes: notes,
      },
    });

    // Update order
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PAYMENT_RECEIVED',
        paidAt: new Date(),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'VERIFY',
        resourceType: 'Payment',
        resourceId: paymentId,
        metadata: {
          orderId: payment.orderId,
          amount: payment.amount.toString(),
          notes,
        },
      },
    });

    return { success: true };
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentId: string,
    amount: number,
    reason: string,
    adminId: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // If Propello payment, process through API
    if (payment.propelloPaymentIntentId && this.propello.isServiceEnabled()) {
      await this.propello.createRefund(payment.propelloPaymentIntentId, amount);
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAmount: amount,
        refundedAt: new Date(),
        refundReason: reason,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'REFUND',
        resourceType: 'Payment',
        resourceId: paymentId,
        metadata: {
          amount: amount.toString(),
          reason,
        },
      },
    });

    return { success: true };
  }

  /**
   * Handle Propello webhook
   */
  async handleWebhook(payload: string, signature: string) {
    if (!this.propello.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = this.propello.parseWebhookEvent(payload);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object.id);
        break;
      case 'payment_intent.failed':
        await this.handlePaymentFailed(event.data.object.id);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { propelloPaymentIntentId: paymentIntentId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          verifiedAt: new Date(),
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAYMENT_RECEIVED',
          paidAt: new Date(),
        },
      });
    }
  }

  private async handlePaymentFailed(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { propelloPaymentIntentId: paymentIntentId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods() {
    const methods = [];

    if (this.propello.isServiceEnabled()) {
      methods.push({
        id: 'EPICOR_PROPELLO',
        name: 'Credit/Debit Card',
        type: 'card',
        enabled: true,
      });
    }

    const fallback = this.propello.getFallbackPaymentMethods();

    if (fallback.zelle.enabled) {
      methods.push({
        id: 'ZELLE',
        name: 'Zelle',
        type: 'manual',
        enabled: true,
      });
    }

    if (fallback.cashapp.enabled) {
      methods.push({
        id: 'CASHAPP',
        name: 'CashApp',
        type: 'manual',
        enabled: true,
      });
    }

    return methods;
  }
}

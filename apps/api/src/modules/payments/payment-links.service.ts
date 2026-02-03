import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ResendService } from '../notifications/resend.service';
import { AuditService } from '../../audit/audit.service';
import { v4 as uuidv4 } from 'uuid';

export enum PaymentLinkStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

interface CreatePaymentLinkDto {
  orderId?: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  expiresInHours?: number;
  paymentMethods?: string[];
  notes?: string;
  sendEmail?: boolean;
}

interface PaymentLinkResponse {
  id: string;
  token: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  status: PaymentLinkStatus;
  paymentMethods: string[];
  expiresAt: Date;
  createdAt: Date;
  order?: {
    id: string;
    orderNumber: string;
  };
}

@Injectable()
export class PaymentLinksService {
  private readonly logger = new Logger(PaymentLinksService.name);
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private resend: ResendService,
    private audit: AuditService,
  ) {
    this.baseUrl = this.config.get('FRONTEND_URL', 'https://sciencebasedbody.com');
  }

  // ===========================================================================
  // CREATE PAYMENT LINK
  // ===========================================================================

  async createPaymentLink(
    data: CreatePaymentLinkDto,
    adminUserId: string,
  ): Promise<PaymentLinkResponse & { url: string }> {
    const {
      orderId,
      customerEmail,
      customerName,
      amount,
      expiresInHours = 48,
      paymentMethods = ['Zelle', 'Wire', 'CashApp', 'Crypto'],
      notes,
      sendEmail = true,
    } = data;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Verify order exists if provided
    let order = null;
    if (orderId) {
      order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, totalAmount: true },
      });
      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }
    }

    // Generate unique token
    const token = `pay_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Create payment link in database
    const paymentLink = await this.prisma.paymentLink.create({
      data: {
        token,
        orderId: orderId || null,
        customerEmail,
        customerName: customerName || null,
        amount,
        status: PaymentLinkStatus.PENDING,
        paymentMethods,
        notes: notes || null,
        expiresAt,
        createdById: adminUserId,
      },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    const paymentUrl = `${this.baseUrl}/pay/${token}`;

    // Send email if requested
    if (sendEmail) {
      await this.resend.sendPaymentLinkEmail({
        customerName,
        customerEmail,
        amount,
        paymentUrl,
        orderNumber: order?.orderNumber,
        expiresAt,
        paymentMethods,
        notes,
      });
    }

    // Audit log
    await this.audit.log({
      action: 'PAYMENT_LINK_CREATED',
      entityType: 'PaymentLink',
      entityId: paymentLink.id,
      userId: adminUserId,
      metadata: {
        customerEmail,
        amount,
        orderId,
        emailSent: sendEmail,
      },
    });

    this.logger.log(`Payment link created: ${token} for ${customerEmail} - $${amount}`);

    return {
      id: paymentLink.id,
      token: paymentLink.token,
      customerEmail: paymentLink.customerEmail,
      customerName: paymentLink.customerName,
      amount: paymentLink.amount,
      status: paymentLink.status as PaymentLinkStatus,
      paymentMethods: paymentLink.paymentMethods as string[],
      expiresAt: paymentLink.expiresAt,
      createdAt: paymentLink.createdAt,
      order: paymentLink.order,
      url: paymentUrl,
    };
  }

  // ===========================================================================
  // GET PAYMENT LINKS
  // ===========================================================================

  async getPaymentLinks(filters?: {
    status?: PaymentLinkStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: PaymentLinkResponse[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters || {};

    // Check for expired links and update them
    await this.expireOldLinks();

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [links, total] = await Promise.all([
      this.prisma.paymentLink.findMany({
        where,
        include: {
          order: {
            select: { id: true, orderNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paymentLink.count({ where }),
    ]);

    return {
      data: links.map(link => ({
        id: link.id,
        token: link.token,
        customerEmail: link.customerEmail,
        customerName: link.customerName,
        amount: link.amount,
        status: link.status as PaymentLinkStatus,
        paymentMethods: link.paymentMethods as string[],
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        paidAt: link.paidAt,
        paymentMethod: link.paymentMethod,
        order: link.order,
      })),
      total,
    };
  }

  // ===========================================================================
  // GET PAYMENT LINK BY TOKEN (Public)
  // ===========================================================================

  async getPaymentLinkByToken(token: string): Promise<PaymentLinkResponse & { url: string; notes?: string }> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { token },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    // Check if expired
    if (link.status === PaymentLinkStatus.PENDING && new Date() > link.expiresAt) {
      await this.prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: PaymentLinkStatus.EXPIRED },
      });
      throw new BadRequestException('Payment link has expired');
    }

    if (link.status === PaymentLinkStatus.EXPIRED) {
      throw new BadRequestException('Payment link has expired');
    }

    if (link.status === PaymentLinkStatus.CANCELLED) {
      throw new BadRequestException('Payment link has been cancelled');
    }

    if (link.status === PaymentLinkStatus.PAID) {
      throw new BadRequestException('Payment link has already been used');
    }

    return {
      id: link.id,
      token: link.token,
      customerEmail: link.customerEmail,
      customerName: link.customerName,
      amount: link.amount,
      status: link.status as PaymentLinkStatus,
      paymentMethods: link.paymentMethods as string[],
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      order: link.order,
      url: `${this.baseUrl}/pay/${link.token}`,
      notes: link.notes,
    };
  }

  // ===========================================================================
  // RESEND PAYMENT LINK
  // ===========================================================================

  async resendPaymentLink(linkId: string, adminUserId: string): Promise<{ success: boolean }> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id: linkId },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (link.status !== PaymentLinkStatus.PENDING) {
      throw new BadRequestException('Can only resend pending payment links');
    }

    if (new Date() > link.expiresAt) {
      throw new BadRequestException('Payment link has expired');
    }

    const paymentUrl = `${this.baseUrl}/pay/${link.token}`;

    await this.resend.sendPaymentLinkEmail({
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      amount: link.amount,
      paymentUrl,
      orderNumber: link.order?.orderNumber,
      expiresAt: link.expiresAt,
      paymentMethods: link.paymentMethods as string[],
      notes: link.notes,
    });

    // Audit log
    await this.audit.log({
      action: 'PAYMENT_LINK_RESENT',
      entityType: 'PaymentLink',
      entityId: link.id,
      userId: adminUserId,
      metadata: { customerEmail: link.customerEmail },
    });

    this.logger.log(`Payment link resent: ${link.token} to ${link.customerEmail}`);

    return { success: true };
  }

  // ===========================================================================
  // CANCEL PAYMENT LINK
  // ===========================================================================

  async cancelPaymentLink(linkId: string, adminUserId: string): Promise<{ success: boolean }> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (link.status !== PaymentLinkStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending payment links');
    }

    await this.prisma.paymentLink.update({
      where: { id: linkId },
      data: { status: PaymentLinkStatus.CANCELLED },
    });

    // Audit log
    await this.audit.log({
      action: 'PAYMENT_LINK_CANCELLED',
      entityType: 'PaymentLink',
      entityId: link.id,
      userId: adminUserId,
    });

    this.logger.log(`Payment link cancelled: ${link.token}`);

    return { success: true };
  }

  // ===========================================================================
  // MARK AS PAID (Admin manual verification)
  // ===========================================================================

  async markAsPaid(
    linkId: string,
    paymentMethod: string,
    adminUserId: string,
    proofUrl?: string,
  ): Promise<{ success: boolean }> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id: linkId },
      include: {
        order: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Payment link not found');
    }

    if (link.status !== PaymentLinkStatus.PENDING) {
      throw new BadRequestException('Can only mark pending payment links as paid');
    }

    // Update payment link
    await this.prisma.paymentLink.update({
      where: { id: linkId },
      data: {
        status: PaymentLinkStatus.PAID,
        paymentMethod,
        paidAt: new Date(),
        proofUrl: proofUrl || null,
      },
    });

    // Update order if linked
    if (link.orderId) {
      await this.prisma.order.update({
        where: { id: link.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          paidAt: new Date(),
        },
      });
    }

    // Send confirmation email
    await this.resend.sendPaymentConfirmationEmail(
      link.customerEmail,
      link.customerName || 'Customer',
      link.amount,
      link.order?.orderNumber,
      paymentMethod,
    );

    // Audit log
    await this.audit.log({
      action: 'PAYMENT_LINK_MARKED_PAID',
      entityType: 'PaymentLink',
      entityId: link.id,
      userId: adminUserId,
      metadata: { paymentMethod, orderId: link.orderId },
    });

    this.logger.log(`Payment link marked as paid: ${link.token} via ${paymentMethod}`);

    return { success: true };
  }

  // ===========================================================================
  // EXPIRE OLD LINKS
  // ===========================================================================

  private async expireOldLinks(): Promise<void> {
    await this.prisma.paymentLink.updateMany({
      where: {
        status: PaymentLinkStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: PaymentLinkStatus.EXPIRED },
    });
  }
}

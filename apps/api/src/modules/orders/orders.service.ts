import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  async create(
    userId: string,
    data: {
      items: Array<{ productId: string; variantId?: string; quantity: number }>;
      shippingAddressId: string;
      billingAddressId: string;
      complianceAck: any;
      customerNotes?: string;
    },
    ipAddress: string,
    userAgent?: string,
  ) {
    // Generate order number
    const orderNumber = `SBB-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      let unitPrice = Number(product.basePrice);
      let variantName = null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice = Number(variant.price);
          variantName = variant.name;
        }
      }

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: product.name,
        variantName,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          subtotal,
          totalAmount: subtotal, // Add shipping/tax later
          customerNotes: data.customerNotes,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // Create compliance acknowledgment
      await this.complianceService.createAcknowledgment(
        data.complianceAck,
        newOrder.id,
        userId,
        ipAddress,
        userAgent,
      );

      return newOrder;
    });

    return order;
  }

  async findById(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
        shipment: true,
        complianceAck: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(orderId: string, status: any, adminId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Order',
        resourceId: orderId,
        metadata: { newStatus: status },
      },
    });

    return order;
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { MailgunService } from '../notifications/mailgun.service';
import { v4 as uuidv4 } from 'uuid';
import { ReturnReason, ReturnStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
    private mailgunService: MailgunService,
  ) {}

  async create(
    userId: string,
    data: {
      items: Array<{ productId: string; variantId?: string; quantity: number }>;
      shippingAddressId: string;
      billingAddressId: string;
      complianceAck: any;
      customerNotes?: string;
      discountCode?: string;
    },
    ipAddress: string,
    userAgent?: string,
  ) {
    // Generate order number
    const orderNumber = `SBB-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

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

    // Calculate shipping - flat rate: $20 standard, FREE over $500
    const shippingCost = subtotal >= 500 ? 0 : 20;
    const totalAmount = subtotal + shippingCost;

    // Get shipping address for email
    const shippingAddress = await this.prisma.address.findUnique({
      where: { id: data.shippingAddressId },
    });

    // Get user for email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          subtotal,
          shippingCost,
          totalAmount,
          discountCode: data.discountCode,
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

    // Send order confirmation email to customer
    if (user?.email) {
      const orderDetails = {
        orderNumber,
        items: orderItems.map((item) => ({
          name: item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
          quantity: item.quantity,
          price: item.totalPrice,
          sku: item.sku,
        })),
        subtotal,
        shipping: shippingCost,
        tax: 0,
        discount: 0,
        total: totalAmount,
        shippingAddress: shippingAddress
          ? {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              street1: shippingAddress.street1,
              street2: shippingAddress.street2 || undefined,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
            }
          : {
              name: 'Customer',
              street1: '',
              city: '',
              state: '',
              postalCode: '',
            },
      };

      // Send customer confirmation email
      this.mailgunService
        .sendOrderConfirmation(user.email, user.firstName || 'Customer', orderDetails)
        .catch((err) => this.logger.error(`Failed to send order confirmation email: ${err.message}`));

      // Send admin notification
      this.mailgunService
        .notifyAdminNewOrder(orderDetails, user.email)
        .catch((err) => this.logger.error(`Failed to send admin notification: ${err.message}`));
    }

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
    // Get current order with items to handle inventory
    const currentOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!currentOrder) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = currentOrder.status;

    // Update order status
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
        ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
      },
      include: {
        user: { select: { email: true, firstName: true } },
        shipment: true,
        items: true,
      },
    });

    // Handle inventory changes based on status transition
    await this.handleInventoryOnStatusChange(order.items, previousStatus, status);

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Order',
        resourceId: orderId,
        previousState: { status: previousStatus },
        newState: { status },
        metadata: { newStatus: status },
      },
    });

    // Send email notification based on status
    if (order.user?.email) {
      const firstName = order.user.firstName || 'Customer';
      const email = order.user.email;

      if (status === OrderStatus.DELIVERED) {
        this.mailgunService
          .sendOrderDelivered(email, firstName, order.orderNumber)
          .catch((err) => this.logger.error(`Failed to send delivery email: ${err.message}`));
      }
    }

    return order;
  }

  /**
   * Handle inventory changes when order status changes
   * - SHIPPED: Convert reserved inventory to sold (deduct from quantity, release reservedQuantity)
   * - CANCELLED/REFUNDED: Release reserved inventory back to available
   */
  private async handleInventoryOnStatusChange(
    items: Array<{ productId: string; variantId: string | null; quantity: number }>,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    // Skip if no meaningful status change for inventory
    const inventoryStatuses: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED];
    if (!inventoryStatuses.includes(newStatus)) {
      return;
    }

    // Skip if already processed (e.g., already shipped, can't ship again)
    if (previousStatus === newStatus) {
      return;
    }

    for (const item of items) {
      const inventoryWhere = item.variantId
        ? { variantId: item.variantId }
        : { productId: item.productId };

      const inventory = await this.prisma.inventory.findFirst({ where: inventoryWhere });

      if (!inventory) {
        this.logger.warn(`No inventory record found for product ${item.productId}`);
        continue;
      }

      if (newStatus === OrderStatus.SHIPPED) {
        // Order shipped: Deduct from quantity, release from reserved
        // Reserved inventory becomes "sold"
        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: Math.max(0, inventory.quantity - item.quantity),
            reservedQuantity: Math.max(0, inventory.reservedQuantity - item.quantity),
          },
        });
        this.logger.log(`Inventory deducted for product ${item.productId}: -${item.quantity}`);
      } else if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.REFUNDED) {
        // Order cancelled/refunded: Release reserved inventory back to available
        // Only release if order was not already shipped
        if (previousStatus !== OrderStatus.SHIPPED && previousStatus !== OrderStatus.DELIVERED) {
          await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              reservedQuantity: Math.max(0, inventory.reservedQuantity - item.quantity),
            },
          });
          this.logger.log(`Reserved inventory released for product ${item.productId}: +${item.quantity}`);
        }
      }
    }
  }

  async addShipment(
    orderId: string,
    shipmentData: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
    },
    adminId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Create shipment and update order status
    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        carrier: shipmentData.carrier,
        trackingNumber: shipmentData.trackingNumber,
        trackingUrl: shipmentData.trackingUrl || this.generateTrackingUrl(shipmentData.carrier, shipmentData.trackingNumber),
        shippingCost: order.shippingCost,
        shippedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'Shipment',
        resourceId: shipment.id,
        metadata: {
          orderId,
          carrier: shipmentData.carrier,
          trackingNumber: shipmentData.trackingNumber,
        },
      },
    });

    // Send shipping notification email
    if (order.user?.email) {
      this.mailgunService
        .sendOrderShipped(
          order.user.email,
          order.user.firstName || 'Customer',
          order.orderNumber,
          shipmentData.trackingNumber,
          shipment.trackingUrl || '',
          shipmentData.carrier,
        )
        .catch((err) => this.logger.error(`Failed to send shipping email: ${err.message}`));
    }

    return shipment;
  }

  private generateTrackingUrl(carrier: string, trackingNumber: string): string {
    const carrierUrls: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FEDEX: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };
    return carrierUrls[carrier.toUpperCase()] || '';
  }

  // ===========================================================================
  // CUSTOMER RETURNS
  // ===========================================================================

  /**
   * Request a return for an order (customer-facing)
   */
  async requestReturn(
    userId: string,
    orderId: string,
    data: {
      reason: ReturnReason;
      reasonDetails?: string;
      items: Array<{ orderItemId: string; quantity: number }>;
    },
  ) {
    // Get the order and verify ownership
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order is eligible for return (delivered within 30 days)
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    if (order.deliveredAt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (order.deliveredAt < thirtyDaysAgo) {
        throw new BadRequestException('Return window has expired (30 days from delivery)');
      }
    }

    // Check if a return already exists for this order
    const existingReturn = await this.prisma.return.findFirst({
      where: {
        orderId,
        status: { notIn: [ReturnStatus.REJECTED, ReturnStatus.COMPLETED] },
      },
    });

    if (existingReturn) {
      throw new BadRequestException('A return request already exists for this order');
    }

    // Build return items from order items
    const returnItems = [];
    let subtotalAmount = 0;

    for (const itemReq of data.items) {
      const orderItem = order.items.find((i) => i.id === itemReq.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item ${itemReq.orderItemId} not found`);
      }
      if (itemReq.quantity > orderItem.quantity) {
        throw new BadRequestException(`Cannot return more than ordered quantity`);
      }

      const itemTotal = Number(orderItem.unitPrice) * itemReq.quantity;
      subtotalAmount += itemTotal;

      returnItems.push({
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        productName: orderItem.productName,
        variantName: orderItem.variantName,
        quantity: itemReq.quantity,
        unitPrice: Number(orderItem.unitPrice),
      });
    }

    // Create the return request
    const returnRequest = await this.prisma.return.create({
      data: {
        orderId,
        orderNumber: order.orderNumber,
        userId,
        customerEmail: order.user.email,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || undefined,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        items: returnItems,
        subtotalAmount,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        resourceType: 'Return',
        resourceId: returnRequest.id,
        metadata: { orderId, reason: data.reason },
      },
    });

    this.logger.log(`Return request created: ${returnRequest.id} for order ${order.orderNumber}`);

    return returnRequest;
  }

  /**
   * Get user's return requests (customer-facing)
   */
  async getMyReturns(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      this.prisma.return.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.return.count({ where: { userId } }),
    ]);

    return {
      returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific return request (customer-facing)
   */
  async getReturnById(userId: string, returnId: string) {
    const returnRequest = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  /**
   * Cancel a return request (customer-facing - only if still in REQUESTED status)
   */
  async cancelReturn(userId: string, returnId: string) {
    const returnRequest = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException('Can only cancel returns that are still pending review');
    }

    await this.prisma.return.delete({
      where: { id: returnId },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        resourceType: 'Return',
        resourceId: returnId,
        metadata: { reason: 'Customer cancelled' },
      },
    });

    return { success: true, message: 'Return request cancelled' };
  }
}

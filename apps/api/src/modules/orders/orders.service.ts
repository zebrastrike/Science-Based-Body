import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { MailgunService } from '../notifications/mailgun.service';
import { v4 as uuidv4 } from 'uuid';
import { ReturnReason, ReturnStatus, OrderStatus, ShipmentStatus } from '@prisma/client';

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

    // Calculate shipping - $25 standard, FREE over $500
    const shippingCost = subtotal >= 500 ? 0 : 25;
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
          shipment: {
            select: {
              id: true,
              status: true,
              carrier: true,
              trackingNumber: true,
              trackingUrl: true,
              estimatedDelivery: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    const ordersWithTimeline = orders.map((order) => ({
      ...order,
      statusTimeline: this.buildStatusTimeline(order),
    }));

    return {
      orders: ordersWithTimeline,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ===========================================================================
  // STATUS TIMELINE
  // ===========================================================================

  /**
   * Build a 5-stage status timeline for order tracking UI.
   * Each stage is marked as 'complete', 'current', or 'pending'.
   */
  private buildStatusTimeline(order: {
    status: OrderStatus;
    createdAt: Date;
    paidAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    shipment?: { status: ShipmentStatus; shippedAt: Date | null; deliveredAt: Date | null } | null;
  }) {
    // Determine current stage number from order + shipment status
    let currentStage = 1;

    if (order.status === OrderStatus.PAYMENT_RECEIVED || order.status === OrderStatus.PROCESSING) {
      currentStage = order.paidAt ? 2 : 2;
      // If PROCESSING with a shipment label, bump to stage 3
      if (
        order.status === OrderStatus.PROCESSING &&
        order.shipment &&
        (order.shipment.status === ShipmentStatus.PENDING || order.shipment.status === ShipmentStatus.LABEL_CREATED)
      ) {
        currentStage = 3;
      } else if (order.status === OrderStatus.PROCESSING) {
        currentStage = 3;
      }
    }

    if (order.status === OrderStatus.SHIPPED) {
      currentStage = 4;
    }

    if (order.status === OrderStatus.DELIVERED) {
      currentStage = 5;
    }

    // For cancelled/refunded, freeze at whatever stage we were at
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      if (order.deliveredAt) currentStage = 5;
      else if (order.shippedAt) currentStage = 4;
      else if (order.paidAt) currentStage = 3;
      else currentStage = 1;
    }

    const stages = [
      { stage: 1, label: 'Order Placed', date: order.createdAt },
      { stage: 2, label: 'Payment Verified', date: order.paidAt },
      { stage: 3, label: 'Preparing Your Order', date: order.paidAt }, // starts when payment verified
      { stage: 4, label: 'Shipped', date: order.shippedAt || (order.shipment?.shippedAt ?? null) },
      { stage: 5, label: 'Delivered', date: order.deliveredAt || (order.shipment?.deliveredAt ?? null) },
    ];

    return stages.map((s) => ({
      stage: s.stage,
      label: s.label,
      status: s.stage < currentStage ? 'complete' : s.stage === currentStage ? 'current' : 'pending',
      date: s.stage <= currentStage && s.date ? s.date : null,
    }));
  }

  /**
   * Get order by ID with status timeline attached
   */
  async findByIdWithTimeline(orderId: string, userId?: string) {
    const order = await this.findById(orderId, userId);
    return {
      ...order,
      statusTimeline: this.buildStatusTimeline(order),
    };
  }

  /**
   * Guest order lookup by order number + email (no auth required)
   */
  async lookupByOrderNumberAndEmail(orderNumber: string, email: string) {
    if (!orderNumber || !email) {
      throw new BadRequestException('Order number and email are required');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase(),
        user: { email: email.toLowerCase() },
      },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        shipment: {
          select: {
            id: true,
            status: true,
            carrier: true,
            trackingNumber: true,
            trackingUrl: true,
            estimatedDelivery: true,
            shippedAt: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('No order found with that order number and email combination');
    }

    return {
      ...order,
      statusTimeline: this.buildStatusTimeline(order),
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
  // REORDER ITEMS
  // ===========================================================================

  /**
   * Get items from a past order formatted for cart re-add
   */
  async getReorderItems(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, isActive: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items
        .filter((item) => item.product.isActive)
        .map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          slug: item.product.slug,
          quantity: item.quantity,
        })),
    };
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

    // Notify admin of new return request (non-blocking)
    this.mailgunService
      .notifyAdminReturnRequest(
        order.orderNumber,
        order.user.email,
        `${data.reason}${data.reasonDetails ? ': ' + data.reasonDetails : ''}`,
        returnItems.map((ri) => ({ name: ri.productName + (ri.variantName ? ` (${ri.variantName})` : ''), quantity: ri.quantity })),
      )
      .catch((err) => this.logger.error('Failed to send admin return notification:', err));

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

  // ===========================================================================
  // EMAIL RESEND FUNCTIONALITY
  // ===========================================================================

  /**
   * Resend order confirmation email (customer can request)
   */
  async resendOrderConfirmation(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        user: { select: { email: true, firstName: true } },
        items: { include: { product: true } },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.user?.email) {
      throw new BadRequestException('No email address found for this order');
    }

    const orderDetails = {
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
        quantity: item.quantity,
        price: Number(item.totalPrice),
        sku: item.sku,
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shippingCost),
      tax: Number(order.taxAmount),
      discount: Number(order.discountAmount),
      total: Number(order.totalAmount),
      shippingAddress: order.shippingAddress
        ? {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            street1: order.shippingAddress.street1,
            street2: order.shippingAddress.street2 || undefined,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
          }
        : {
            name: 'Customer',
            street1: '',
            city: '',
            state: '',
            postalCode: '',
          },
    };

    await this.mailgunService.sendOrderConfirmation(
      order.user.email,
      order.user.firstName || 'Customer',
      orderDetails,
    );

    this.logger.log(`Resent order confirmation email for order ${order.orderNumber}`);

    return { success: true, message: 'Order confirmation email sent' };
  }

  /**
   * Resend shipping notification email (admin only)
   */
  async resendShippingNotification(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, firstName: true } },
        shipment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.shipment) {
      throw new BadRequestException('Order has not been shipped yet');
    }

    if (!order.user?.email) {
      throw new BadRequestException('No email address found for this order');
    }

    await this.mailgunService.sendOrderShipped(
      order.user.email,
      order.user.firstName || 'Customer',
      order.orderNumber,
      order.shipment.trackingNumber || '',
      order.shipment.trackingUrl || '',
      order.shipment.carrier || 'USPS',
    );

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Order',
        resourceId: orderId,
        metadata: { action: 'resent_shipping_email', email: order.user.email },
      },
    });

    this.logger.log(`Resent shipping notification for order ${order.orderNumber}`);

    return { success: true, message: 'Shipping notification email sent' };
  }

  /**
   * Resend delivery notification email (admin only)
   */
  async resendDeliveryNotification(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order has not been delivered yet');
    }

    if (!order.user?.email) {
      throw new BadRequestException('No email address found for this order');
    }

    await this.mailgunService.sendOrderDelivered(
      order.user.email,
      order.user.firstName || 'Customer',
      order.orderNumber,
    );

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Order',
        resourceId: orderId,
        metadata: { action: 'resent_delivery_email', email: order.user.email },
      },
    });

    this.logger.log(`Resent delivery notification for order ${order.orderNumber}`);

    return { success: true, message: 'Delivery notification email sent' };
  }
}

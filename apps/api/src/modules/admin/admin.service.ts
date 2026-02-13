import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, UserStatus, ProductCategory, DiscountType, DiscountStatus, ReturnStatus, ShipmentStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { EasyPostService } from '../shipping/easypost.service';
import { PaymentsService } from '../payments/payments.service';
import { SmtpService } from '../notifications/smtp.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private easypostService: EasyPostService,
    private paymentsService: PaymentsService,
    private mailService: SmtpService,
  ) {}

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      weekOrders,
      pendingOrders,
      todayRevenue,
      weekRevenue,
      lowStockProducts,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.PROCESSING] },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: weekStart },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Inventory"
        WHERE quantity <= "lowStockThreshold"
      `.then((r) => Number(r[0]?.count || 0)),
    ]);

    return {
      ordersToday: todayOrders,
      revenueToday: Number(todayRevenue._sum.totalAmount || 0),
      pendingOrders,
      lowStockProducts,
      ordersThisWeek: weekOrders,
      revenueThisWeek: Number(weekRevenue._sum.totalAmount || 0),
    };
  }

  async getRecentOrders(limit = 10) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        items: {
          select: { productName: true, quantity: true },
        },
        shipment: {
          select: { status: true, trackingNumber: true, labelUrl: true, carrier: true },
        },
      },
    });

    return {
      data: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
        customerEmail: order.user.email,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        shippingStatus: order.shipment?.status || 'NOT_SHIPPED',
        trackingNumber: order.shipment?.trackingNumber || null,
        labelUrl: order.shipment?.labelUrl || null,
        carrier: order.shipment?.carrier || null,
        totalAmount: Number(order.totalAmount),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: order.createdAt,
      })),
    };
  }

  // ==========================================================================
  // ORDERS
  // ==========================================================================

  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: string;
    shippingStatus?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { page = 1, limit = 20, status, paymentStatus, shippingStatus, search, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (shippingStatus === 'NOT_SHIPPED') {
      // Orders without a shipment or with PENDING shipment status
      where.OR = [
        ...(where.OR || []),
        { shipment: null },
        { shipment: { status: 'PENDING' } },
      ];
      // If there was already an OR from search, we need AND logic
      if (search) {
        // Handle separately below
      }
    } else if (shippingStatus) {
      where.shipment = { status: shippingStatus };
    }

    if (search) {
      const searchConditions = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
      if (where.OR) {
        // Combine shipping OR with search OR via AND
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          items: true,
          payments: {
            select: { status: true, method: true },
          },
          shipment: {
            select: { status: true, trackingNumber: true, labelUrl: true, carrier: true },
          },
          shippingAddress: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => {
        const addr = order.shippingAddress;
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
          customerEmail: order.user.email,
          status: order.status,
          paymentStatus: order.paymentStatus || order.payments[0]?.status || 'PENDING',
          paymentMethod: order.payments[0]?.method,
          shippingStatus: order.shipment?.status || 'NOT_SHIPPED',
          trackingNumber: order.shipment?.trackingNumber,
          labelUrl: order.shipment?.labelUrl || null,
          carrier: order.shipment?.carrier || null,
          subtotal: Number(order.subtotal),
          shippingCost: Number(order.shippingCost),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount),
          totalAmount: Number(order.totalAmount),
          itemCount: order.items.length,
          shippingAddress: addr ? {
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country || 'US',
          } : null,
          paidAt: order.paidAt || null,
          createdAt: order.createdAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: { slug: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        payments: true,
        shipment: true,
        shippingAddress: true,
        billingAddress: true,
        complianceAck: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const addr = order.shippingAddress;
    const billAddr = order.billingAddress;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payments[0]?.status || 'PENDING',
      shippingStatus: order.shipment?.status || 'NOT_SHIPPED',
      customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
      customerEmail: order.user.email,
      customerPhone: order.user.phone || addr?.phone || null,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName || null,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        imageUrl: (item.product as any)?.images?.[0]?.url || null,
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discountAmount: Number(order.discountAmount),
      discountCode: order.discountCode || null,
      totalAmount: Number(order.totalAmount),
      shippingAddress: addr ? {
        firstName: addr.firstName,
        lastName: addr.lastName,
        address1: addr.street1,
        address2: addr.street2 || null,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        phone: addr.phone || null,
      } : null,
      billingAddress: billAddr ? {
        firstName: billAddr.firstName,
        lastName: billAddr.lastName,
        address1: billAddr.street1,
        address2: billAddr.street2 || null,
        city: billAddr.city,
        state: billAddr.state,
        postalCode: billAddr.postalCode,
        country: billAddr.country,
        phone: billAddr.phone || null,
      } : null,
      trackingNumber: order.shipment?.trackingNumber || null,
      trackingUrl: order.shipment?.trackingUrl || null,
      labelUrl: order.shipment?.labelUrl || null,
      shippingCarrier: order.shipment?.carrier || null,
      customerNotes: order.customerNotes || null,
      adminNotes: order.adminNotes || null,
      createdAt: order.createdAt,
      paidAt: order.paidAt || null,
      shippedAt: order.shippedAt || null,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, adminId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;

    const updateData: any = { status };

    // Set timestamps based on status
    if (status === OrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    if (notes) {
      updateData.adminNotes = notes;
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE',
          resourceType: 'Order',
          resourceId: orderId,
          previousState: { status: previousStatus },
          newState: { status },
          metadata: { notes },
        },
      }),
    ]);

    return updatedOrder;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string, adminId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousPaymentStatus = order.paymentStatus;
    const updateData: any = { paymentStatus };

    if (paymentStatus === 'PAID') {
      updateData.paidAt = new Date();
    } else if (order.paidAt) {
      updateData.paidAt = null;
    }

    if (notes !== undefined) {
      updateData.adminNotes = notes;
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE',
          resourceType: 'Order',
          resourceId: orderId,
          previousState: { paymentStatus: previousPaymentStatus },
          newState: { paymentStatus },
          metadata: notes ? { notes } : undefined,
        },
      }),
    ]);

    return updatedOrder;
  }

  /**
   * Soft-delete an order: sets status to CANCELLED, logs to audit trail.
   * Also deletes associated order items, payments, and shipment records
   * for test/cleanup purposes. Requires SUPER_ADMIN.
   */
  async deleteOrder(orderId: string, adminId: string, hardDelete = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const orderSnapshot = {
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      customerEmail: order.user?.email,
      customerName: [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' '),
    };

    if (hardDelete) {
      // Hard delete: DB cascades handle OrderItem, Payment, Shipment, ReturnRequest
      await this.prisma.$transaction([
        this.prisma.order.delete({ where: { id: orderId } }),
        this.prisma.auditLog.create({
          data: {
            adminId,
            action: 'DELETE',
            resourceType: 'Order',
            resourceId: orderId,
            previousState: orderSnapshot,
            newState: { deleted: true, hardDelete: true },
            metadata: { reason: 'Admin hard delete' },
          },
        }),
      ]);

      this.logger.warn(`Order ${order.orderNumber} HARD DELETED by admin ${adminId}`);
      return { deleted: true, orderNumber: order.orderNumber, type: 'hard_delete' };
    }

    // Soft delete: cancel the order
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'DELETE',
          resourceType: 'Order',
          resourceId: orderId,
          previousState: orderSnapshot,
          newState: { status: 'CANCELLED' },
          metadata: { reason: 'Admin soft delete' },
        },
      }),
    ]);

    this.logger.log(`Order ${order.orderNumber} soft-deleted (CANCELLED) by admin ${adminId}`);
    return { deleted: true, orderNumber: order.orderNumber, type: 'soft_delete', order: updatedOrder };
  }

  /**
   * Bulk delete orders by customer name(s) — for test data cleanup.
   */
  async bulkDeleteOrdersByCustomerName(names: string[], adminId: string, hardDelete = false) {
    const results: Array<{ orderNumber: string; result: string }> = [];

    for (const name of names) {
      const nameParts = name.trim().toLowerCase().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Find users matching the name
      const andConditions: any[] = [
        { firstName: { contains: firstName, mode: 'insensitive' } },
      ];
      if (lastName) {
        andConditions.push({ lastName: { contains: lastName, mode: 'insensitive' } });
      }

      const orConditions: any[] = [{ AND: andConditions }];
      if (nameParts.length === 1) {
        orConditions.push({ firstName: { equals: firstName, mode: 'insensitive' } });
      }

      const users = await this.prisma.user.findMany({
        where: { OR: orConditions },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (users.length === 0) {
        results.push({ orderNumber: `No users found for "${name}"`, result: 'skipped' });
        continue;
      }

      for (const user of users) {
        const orders = await this.prisma.order.findMany({
          where: { userId: user.id },
          select: { id: true, orderNumber: true },
        });

        for (const order of orders) {
          try {
            await this.deleteOrder(order.id, adminId, hardDelete);
            results.push({ orderNumber: order.orderNumber, result: hardDelete ? 'hard_deleted' : 'cancelled' });
          } catch (err: any) {
            results.push({ orderNumber: order.orderNumber, result: `error: ${err.message}` });
          }
        }
      }
    }

    return { processed: results.length, results };
  }

  // ==========================================================================
  // PRODUCTS
  // ==========================================================================

  async getProducts(options: {
    page?: number;
    limit?: number;
    category?: ProductCategory;
    search?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 20, category, search, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          variants: {
            select: { id: true, sku: true, name: true, price: true, isActive: true },
          },
          inventory: {
            select: { quantity: true, lowStockThreshold: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.shortDescription || '',
        basePrice: Number(product.basePrice),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        categoryName: product.category,
        categorySlug: product.category?.toLowerCase().replace(/_/g, '-'),
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          isActive: v.isActive,
        })),
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        imageUrl: product.images[0]?.url || null,
        stock: product.inventory?.quantity || 0,
        lowStock: product.inventory
          ? product.inventory.quantity <= product.inventory.lowStockThreshold
          : false,
        createdAt: product.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: { inventory: true },
        },
        batches: {
          orderBy: { manufacturingDate: 'desc' },
          include: {
            coaFile: { select: { id: true, filename: true } },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(
    data: {
      sku: string;
      name: string;
      slug: string;
      category: ProductCategory;
      basePrice: number;
      shortDescription?: string;
      longDescription?: string;
      purityPercent?: number;
      molecularWeight?: number;
      sequence?: string;
      casNumber?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      costPerUnit?: number;
      wholesaleOnly?: boolean;
      comingSoon?: boolean;
      subcategory?: string;
    },
    adminId: string,
  ) {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        basePrice: data.basePrice,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'Product',
        resourceId: product.id,
        newState: product as any,
      },
    });

    return product;
  }

  async updateProduct(
    productId: string,
    data: {
      name?: string;
      slug?: string;
      category?: ProductCategory;
      basePrice?: number;
      shortDescription?: string;
      longDescription?: string;
      purityPercent?: number;
      molecularWeight?: number;
      sequence?: string;
      casNumber?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      costPerUnit?: number;
      wholesaleOnly?: boolean;
      comingSoon?: boolean;
      subcategory?: string;
    },
    adminId: string,
  ) {
    const previous = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!previous) {
      throw new NotFoundException('Product not found');
    }

    // Only pick fields that exist on the Product model to avoid Prisma errors
    const allowedFields = [
      'name', 'slug', 'category', 'basePrice', 'shortDescription', 'longDescription',
      'purityPercent', 'molecularWeight', 'sequence', 'casNumber', 'isActive', 'isFeatured',
      'costPerUnit', 'wholesaleOnly', 'comingSoon', 'subcategory', 'compareAtPrice',
    ];
    const cleanData: Record<string, any> = {};
    for (const key of allowedFields) {
      if ((data as any)[key] !== undefined) {
        cleanData[key] = (data as any)[key];
      }
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: cleanData,
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Product',
        resourceId: productId,
        previousState: previous as any,
        newState: product as any,
      },
    });

    return product;
  }

  async deleteProduct(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete - just deactivate
    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE',
        resourceType: 'Product',
        resourceId: productId,
        previousState: product as any,
        metadata: { softDelete: true },
      },
    });

    return { success: true };
  }

  // ==========================================================================
  // USERS
  // ==========================================================================

  async getUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: UserStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          loyaltyPoints: true,
          lifetimeLoyaltyPoints: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            select: { totalAmount: true },
            where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        ordersCount: user._count.orders,
        totalSpent: user.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        kycVerification: true,
        organization: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const validOrders = user.orders.filter(
      (o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REFUNDED,
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      status: user.status,
      role: user.role,
      ordersCount: user.orders.length,
      totalSpent: validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      adminNotes: user.adminNotes,
      addresses: user.addresses.map((a) => ({
        id: a.id,
        label: a.label || null,
        firstName: a.firstName,
        lastName: a.lastName,
        address1: a.street1,
        address2: a.street2 || null,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
        phone: a.phone || null,
      })),
      orders: user.orders.slice(0, 10).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
      })),
    };
  }

  async updateUserStatus(userId: string, status: UserStatus, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousStatus = user.status;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE',
          resourceType: 'User',
          resourceId: userId,
          previousState: { status: previousStatus },
          newState: { status },
          metadata: { reason },
        },
      }),
    ]);

    return { success: true, status: updatedUser.status };
  }

  async patchUser(userId: string, data: { status?: UserStatus; adminNotes?: string }, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Record<string, any> = {};
    const previousState: Record<string, any> = {};
    const newState: Record<string, any> = {};

    if (data.status !== undefined) {
      previousState.status = user.status;
      newState.status = data.status;
      updateData.status = data.status;
    }

    if (data.adminNotes !== undefined) {
      previousState.adminNotes = user.adminNotes;
      newState.adminNotes = data.adminNotes;
      updateData.adminNotes = data.adminNotes;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: updateData }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE',
          resourceType: 'User',
          resourceId: userId,
          previousState,
          newState,
        },
      }),
    ]);

    return {
      success: true,
      status: updatedUser.status,
      adminNotes: updatedUser.adminNotes,
    };
  }

  // ==========================================================================
  // INVENTORY
  // ==========================================================================

  async getLowStockProducts(threshold?: number) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        inventory: {
          quantity: {
            lte: threshold || 10,
          },
        },
      },
      include: {
        inventory: true,
        variants: {
          include: { inventory: true },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      currentStock: p.inventory?.quantity || 0,
      threshold: p.inventory?.lowStockThreshold || 10,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        currentStock: v.inventory?.quantity || 0,
      })),
    }));
  }

  async updateInventory(
    productId: string,
    variantId: string | null,
    quantity: number,
    adminId: string,
    notes?: string,
    lowStockThreshold?: number,
    leadTimeDays?: number,
  ) {
    const where = variantId ? { variantId } : { productId };

    const inventory = await this.prisma.inventory.findFirst({ where });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    const previousQuantity = inventory.quantity;

    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity,
        lastRestockedAt: quantity > previousQuantity ? new Date() : undefined,
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(leadTimeDays !== undefined && { leadTimeDays }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Inventory',
        resourceId: inventory.id,
        previousState: { quantity: previousQuantity },
        newState: { quantity },
        metadata: { productId, variantId, notes },
      },
    });

    return updated;
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  async getAnalytics(options: { period?: string; dateFrom?: Date; dateTo?: Date }) {
    const { period = '30d', dateFrom, dateTo } = options;

    // Calculate date range
    let startDate: Date;
    let endDate = dateTo || new Date();

    if (dateFrom) {
      startDate = dateFrom;
    } else {
      startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '30d':
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
    }

    const [
      totalRevenue,
      totalOrders,
      avgOrderValue,
      newCustomers,
      previousPeriodRevenue,
      ordersByDay,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      // Previous period for comparison
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate,
          },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      // Orders grouped by day
      this.prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as orders, SUM("totalAmount") as revenue
        FROM "Order"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    const currentRev = Number(totalRevenue._sum.totalAmount || 0);
    const previousRev = Number(previousPeriodRevenue._sum.totalAmount || 0);
    const revenueGrowth = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0;
    const avgOV = Number(avgOrderValue._avg.totalAmount || 0);

    // Shape chart data into series the frontend expects
    const chartRows = ordersByDay as any[];
    const revenueSeries = chartRows.map((row: any) => ({
      date: row.date,
      value: Number(row.revenue || 0),
    }));
    const ordersSeries = chartRows.map((row: any) => ({
      date: row.date,
      value: Number(row.orders || 0),
    }));

    return {
      revenueSeries,
      ordersSeries,
      acquisitionSeries: [], // Placeholder - no acquisition tracking yet
      topProducts: [], // Fetched separately via /analytics/top-products
      stats: {
        revenue: currentRev,
        orders: totalOrders,
        avgOrderValue: Math.round(avgOV * 100) / 100,
        conversionRate: 0, // No visitor tracking yet
      },
      // Keep original data too for backward compat
      summary: {
        totalRevenue: currentRev,
        totalOrders,
        averageOrderValue: avgOV,
        newCustomers,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      period: { startDate, endDate },
    };
  }

  async getTopProducts(limit = 10, period?: string) {
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return topProducts.map((item) => ({
      productId: item.productId,
      name: productMap.get(item.productId)?.name || 'Unknown',
      sku: productMap.get(item.productId)?.sku || '',
      unitsSold: item._sum.quantity || 0,
      revenue: Number(item._sum.totalPrice || 0),
    }));
  }

  async getRevenueAnalytics(period?: string) {
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const [byCategory, byPaymentMethod] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT p.category, SUM(oi."totalPrice") as revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${startDate}
        AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
      this.prisma.$queryRaw`
        SELECT pay.method, SUM(pay.amount) as total
        FROM "Payment" pay
        JOIN "Order" o ON pay."orderId" = o.id
        WHERE pay.status = 'COMPLETED'
        AND o."createdAt" >= ${startDate}
        GROUP BY pay.method
      `,
    ]);

    return { byCategory, byPaymentMethod };
  }

  // ==========================================================================
  // DISCOUNTS
  // ==========================================================================

  async getDiscounts(options: { page?: number; limit?: number; status?: DiscountStatus }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [discounts, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return {
      data: discounts.map((d) => ({
        ...d,
        value: Number(d.value),
        minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
        maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getDiscountById(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');

    // Fetch usage analytics: orders that used this discount code
    const [orderCount, totalRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { discountCode: discount.code, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      }),
      this.prisma.order.aggregate({
        where: { discountCode: discount.code, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      ...discount,
      value: Number(discount.value),
      minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : null,
      maxDiscountAmount: discount.maxDiscountAmount ? Number(discount.maxDiscountAmount) : null,
      analytics: {
        ordersUsed: orderCount,
        totalRevenue: totalRevenue._sum.totalAmount ? Number(totalRevenue._sum.totalAmount) : 0,
      },
    };
  }

  /**
   * Auto-expire discounts that have passed their expiresAt date
   * Can be called via cron or admin action
   */
  async expireDiscounts() {
    const result = await this.prisma.discount.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'INACTIVE' },
    });

    return { expired: result.count };
  }

  async createDiscount(
    data: {
      code: string;
      description?: string;
      type: DiscountType;
      value: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      perUserLimit?: number;
      startsAt?: string;
      expiresAt?: string;
      productIds?: string[];
      categoryIds?: string[];
    },
    adminId: string,
  ) {
    const existing = await this.prisma.discount.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Discount code already exists');

    const discount = await this.prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        productIds: data.productIds || [],
        categoryIds: data.categoryIds || [],
        createdById: adminId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'Discount',
        resourceId: discount.id,
        newState: discount as any,
      },
    });

    return discount;
  }

  async updateDiscount(
    id: string,
    data: {
      description?: string;
      value?: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      perUserLimit?: number;
      status?: DiscountStatus;
      expiresAt?: string;
    },
    adminId: string,
  ) {
    const previous = await this.prisma.discount.findUnique({ where: { id } });
    if (!previous) throw new NotFoundException('Discount not found');

    const updateData: any = { ...data };
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

    const discount = await this.prisma.discount.update({ where: { id }, data: updateData });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Discount',
        resourceId: id,
        previousState: previous as any,
        newState: discount as any,
      },
    });

    return discount;
  }

  async deleteDiscount(id: string, adminId: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');

    await this.prisma.discount.update({
      where: { id },
      data: { status: DiscountStatus.INACTIVE },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE',
        resourceType: 'Discount',
        resourceId: id,
        previousState: discount as any,
        metadata: { softDelete: true },
      },
    });

    return { success: true };
  }

  // ==========================================================================
  // RETURNS
  // ==========================================================================

  async getReturns(options: { page?: number; limit?: number; status?: ReturnStatus }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      this.prisma.return.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.return.count({ where }),
    ]);

    return {
      data: returns.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        customerName: r.customerName,
        reason: r.reason,
        status: r.status,
        requestedAt: r.createdAt,
        refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
        subtotalAmount: Number(r.subtotalAmount),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getReturnById(id: string) {
    const returnItem = await this.prisma.return.findUnique({ where: { id } });
    if (!returnItem) throw new NotFoundException('Return not found');
    return {
      ...returnItem,
      subtotalAmount: Number(returnItem.subtotalAmount),
      refundAmount: returnItem.refundAmount ? Number(returnItem.refundAmount) : null,
    };
  }

  async approveReturn(id: string, refundAmount: number, adminId: string, adminNotes?: string) {
    const returnItem = await this.prisma.return.findUnique({ where: { id } });
    if (!returnItem) throw new NotFoundException('Return not found');

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.APPROVED,
        refundAmount,
        processedById: adminId,
        processedAt: new Date(),
        adminNotes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'APPROVE',
        resourceType: 'Return',
        resourceId: id,
        previousState: { status: returnItem.status },
        newState: { status: 'APPROVED', refundAmount },
      },
    });

    // Notify customer their return was approved (non-blocking)
    if (returnItem.customerEmail) {
      const firstName = returnItem.customerName?.split(' ')[0] || 'there';
      this.mailService
        .sendReturnApproved(returnItem.customerEmail, firstName, returnItem.orderNumber, refundAmount)
        .catch((err) => this.logger.error('Failed to send return approved email:', err));
    }

    return updated;
  }

  async rejectReturn(id: string, rejectionReason: string, adminId: string) {
    const returnItem = await this.prisma.return.findUnique({ where: { id } });
    if (!returnItem) throw new NotFoundException('Return not found');

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.REJECTED,
        rejectionReason,
        processedById: adminId,
        processedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'REJECT',
        resourceType: 'Return',
        resourceId: id,
        previousState: { status: returnItem.status },
        newState: { status: 'REJECTED', rejectionReason },
      },
    });

    // Notify customer their return was rejected (non-blocking)
    if (returnItem.customerEmail) {
      const firstName = returnItem.customerName?.split(' ')[0] || 'there';
      this.mailService
        .sendReturnRejected(returnItem.customerEmail, firstName, returnItem.orderNumber, rejectionReason)
        .catch((err) => this.logger.error('Failed to send return rejected email:', err));
    }

    return updated;
  }

  async completeReturn(id: string, adminId: string, refundReference?: string, refundMethod?: string) {
    const returnItem = await this.prisma.return.findUnique({ where: { id } });
    if (!returnItem) throw new NotFoundException('Return not found');

    if (returnItem.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return must be approved before completing');
    }

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.COMPLETED,
        refundReference,
        refundMethod,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'REFUND',
        resourceType: 'Return',
        resourceId: id,
        newState: { status: 'COMPLETED', refundReference, refundMethod },
      },
    });

    return updated;
  }

  // ==========================================================================
  // AUDIT LOG
  // ==========================================================================

  async getAuditLog(options: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    adminId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { page = 1, limit = 50, action, resourceType, adminId, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (adminId) where.adminId = adminId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        userName: log.admin
          ? `${log.admin.firstName || ''} ${log.admin.lastName || ''}`.trim() || log.admin.email
          : 'System',
        action: `${log.action} ${log.resourceType}`,
        details: log.resourceId
          ? `${log.resourceType} ${log.resourceId}`
          : log.resourceType,
        actionType: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        changes: {
          previous: log.previousState,
          new: log.newState,
        },
        metadata: log.metadata,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  async getSettings(category?: string) {
    const where: any = {};
    if (category) {
      where.key = { startsWith: category };
    }

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const setting of settings) {
      const cat = setting.key.split('_')[0];
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        key: setting.key,
        value: this.parseSettingValue(setting.value, setting.type),
        type: setting.type,
        description: setting.description,
      });
    }

    return grouped;
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Setting not found');
    return {
      key: setting.key,
      value: this.parseSettingValue(setting.value, setting.type),
      type: setting.type,
      description: setting.description,
    };
  }

  async updateSetting(
    key: string,
    data: { value: string; type?: string; description?: string },
    adminId: string,
  ) {
    const previous = await this.prisma.setting.findUnique({ where: { key } });

    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: {
        value: data.value,
        type: data.type || previous?.type || 'string',
        description: data.description || previous?.description,
      },
      create: {
        key,
        value: data.value,
        type: data.type || 'string',
        description: data.description,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Setting',
        resourceId: key,
        previousState: previous ? { value: previous.value } : undefined,
        newState: { value: data.value },
      },
    });

    return setting;
  }

  async updateSettingsBulk(settings: Array<{ key: string; value: string }>, adminId: string) {
    const results = await Promise.all(
      settings.map((s) => this.updateSetting(s.key, { value: s.value }, adminId)),
    );
    return { updated: results.length };
  }

  private parseSettingValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  // ==========================================================================
  // SHIPPING (Recent)
  // ==========================================================================

  async getRecentShipments(limit = 20) {
    const shipments = await this.prisma.shipment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return shipments.map((s) => ({
      id: s.id,
      orderNumber: s.order.orderNumber,
      customerName: `${s.order.user.firstName || ''} ${s.order.user.lastName || ''}`.trim() || s.order.user.email,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
    }));
  }

  // ==========================================================================
  // EMAIL RESEND
  // ==========================================================================

  async resendOrderConfirmation(orderId: string, adminId: string) {
    const result = await this.ordersService.resendOrderConfirmation(orderId);

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'Order',
        resourceId: orderId,
        metadata: { action: 'resent_order_confirmation' },
      },
    });

    return result;
  }

  async resendShippingNotification(orderId: string, adminId: string) {
    return this.ordersService.resendShippingNotification(orderId, adminId);
  }

  async resendDeliveryNotification(orderId: string, adminId: string) {
    return this.ordersService.resendDeliveryNotification(orderId, adminId);
  }

  // ==========================================================================
  // PRICE LISTS (Wholesale)
  // ==========================================================================

  async getPriceLists() {
    const priceLists = await this.prisma.priceList.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { items: true, users: true } },
      },
    });

    return {
      data: priceLists.map((pl) => ({
        ...pl,
        itemCount: pl._count.items,
        userCount: pl._count.users,
        _count: undefined,
      })),
    };
  }

  async getPriceListById(id: string) {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, basePrice: true, slug: true },
            },
          },
        },
        users: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!priceList) throw new NotFoundException('Price list not found');

    return {
      ...priceList,
      items: priceList.items.map((item) => ({
        ...item,
        customPrice: item.customPrice ? Number(item.customPrice) : null,
        product: {
          ...item.product,
          basePrice: Number(item.product.basePrice),
        },
      })),
    };
  }

  async createPriceList(
    data: {
      name: string;
      description?: string;
      discountPercent?: number;
      organizationId?: string;
    },
    adminId: string,
  ) {
    const priceList = await this.prisma.priceList.create({
      data: {
        name: data.name,
        description: data.description,
        discountPercent: data.discountPercent,
        organizationId: data.organizationId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'PriceList',
        resourceId: priceList.id,
        newState: priceList as any,
      },
    });

    return priceList;
  }

  async updatePriceList(
    id: string,
    data: {
      name?: string;
      description?: string;
      discountPercent?: number;
      isActive?: boolean;
    },
    adminId: string,
  ) {
    const previous = await this.prisma.priceList.findUnique({ where: { id } });
    if (!previous) throw new NotFoundException('Price list not found');

    const priceList = await this.prisma.priceList.update({ where: { id }, data });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'PriceList',
        resourceId: id,
        previousState: previous as any,
        newState: priceList as any,
      },
    });

    return priceList;
  }

  async upsertPriceListItem(
    priceListId: string,
    data: {
      productId: string;
      customPrice?: number;
      discountPercent?: number;
    },
    adminId: string,
  ) {
    const priceList = await this.prisma.priceList.findUnique({ where: { id: priceListId } });
    if (!priceList) throw new NotFoundException('Price list not found');

    const item = await this.prisma.priceListItem.upsert({
      where: {
        priceListId_productId: { priceListId, productId: data.productId },
      },
      create: {
        priceListId,
        productId: data.productId,
        customPrice: data.customPrice,
        discountPercent: data.discountPercent,
      },
      update: {
        customPrice: data.customPrice,
        discountPercent: data.discountPercent,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'PriceListItem',
        resourceId: item.id,
        newState: item as any,
      },
    });

    return item;
  }

  async deletePriceListItem(priceListId: string, itemId: string, adminId: string) {
    const item = await this.prisma.priceListItem.findFirst({
      where: { id: itemId, priceListId },
    });
    if (!item) throw new NotFoundException('Price list item not found');

    await this.prisma.priceListItem.delete({ where: { id: itemId } });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE',
        resourceType: 'PriceListItem',
        resourceId: itemId,
        previousState: item as any,
      },
    });

    return { success: true };
  }

  // ==========================================================================
  // MARKETING POPUPS
  // ==========================================================================

  async getPopups() {
    const popups = await this.prisma.marketingPopup.findMany({
      orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
    return { popups };
  }

  async getPopupById(id: string) {
    const popup = await this.prisma.marketingPopup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('Popup not found');
    return popup;
  }

  async createPopup(data: {
    name: string;
    headline: string;
    subtitle?: string;
    bodyHtml?: string;
    ctaText?: string;
    ctaLink?: string;
    discountCode?: string;
    discountCode2?: string;
    tier1Label?: string;
    tier1Value?: string;
    tier2Label?: string;
    tier2Value?: string;
    showEmailCapture?: boolean;
    successHeadline?: string;
    successMessage?: string;
    delayMs?: number;
    showOnPages?: string[];
    showFrequency?: string;
    startsAt?: string;
    expiresAt?: string;
    priority?: number;
    isActive?: boolean;
  }, adminId: string) {
    const popup = await this.prisma.marketingPopup.create({
      data: {
        name: data.name,
        headline: data.headline,
        subtitle: data.subtitle,
        bodyHtml: data.bodyHtml,
        ctaText: data.ctaText || 'Unlock',
        ctaLink: data.ctaLink,
        discountCode: data.discountCode,
        discountCode2: data.discountCode2,
        tier1Label: data.tier1Label,
        tier1Value: data.tier1Value,
        tier2Label: data.tier2Label,
        tier2Value: data.tier2Value,
        showEmailCapture: data.showEmailCapture ?? true,
        successHeadline: data.successHeadline,
        successMessage: data.successMessage,
        delayMs: data.delayMs ?? 3500,
        showOnPages: data.showOnPages || [],
        showFrequency: data.showFrequency || 'once',
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? false,
        createdById: adminId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'MarketingPopup',
        resourceId: popup.id,
        newState: popup as any,
      },
    });

    return popup;
  }

  async updatePopup(id: string, data: Record<string, any>, adminId: string) {
    const existing = await this.prisma.marketingPopup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Popup not found');

    // Clean the data — only allow known fields
    const allowed = [
      'name', 'headline', 'subtitle', 'bodyHtml', 'ctaText', 'ctaLink',
      'discountCode', 'discountCode2', 'tier1Label', 'tier1Value',
      'tier2Label', 'tier2Value', 'showEmailCapture', 'successHeadline',
      'successMessage', 'delayMs', 'showOnPages', 'showFrequency',
      'startsAt', 'expiresAt', 'priority', 'isActive',
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        if ((key === 'startsAt' || key === 'expiresAt') && data[key]) {
          updateData[key] = new Date(data[key]);
        } else {
          updateData[key] = data[key];
        }
      }
    }

    const popup = await this.prisma.marketingPopup.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'MarketingPopup',
        resourceId: id,
        previousState: existing as any,
        newState: popup as any,
      },
    });

    return popup;
  }

  async deletePopup(id: string, adminId: string) {
    const existing = await this.prisma.marketingPopup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Popup not found');

    await this.prisma.marketingPopup.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE',
        resourceType: 'MarketingPopup',
        resourceId: id,
        previousState: existing as any,
      },
    });

    return { success: true };
  }

  async togglePopup(id: string, adminId: string) {
    const existing = await this.prisma.marketingPopup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Popup not found');

    const popup = await this.prisma.marketingPopup.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'MarketingPopup',
        resourceId: id,
        previousState: { isActive: existing.isActive } as any,
        newState: { isActive: popup.isActive } as any,
      },
    });

    return popup;
  }

  async getActivePopup(page?: string) {
    const now = new Date();
    const popups = await this.prisma.marketingPopup.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    // Filter: not expired, matches page
    for (const popup of popups) {
      if (popup.expiresAt && popup.expiresAt < now) continue;
      if (popup.showOnPages.length > 0 && page && !popup.showOnPages.includes(page)) continue;

      // Increment impressions (non-blocking)
      this.prisma.marketingPopup.update({
        where: { id: popup.id },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});

      return popup;
    }

    return null;
  }

  async recordPopupConversion(id: string) {
    await this.prisma.marketingPopup.update({
      where: { id },
      data: { conversions: { increment: 1 } },
    }).catch(() => {});
  }

  // ==========================================================================
  // ORDER FULFILLMENT (EasyPost + Manual Payment Approval)
  // ==========================================================================

  /**
   * Admin approves a pending Zelle/Venmo payment.
   * By default, also auto-creates a shipping label (cheapest USPS rate).
   */
  async approvePayment(orderId: string, adminId: string, notes?: string, autoShip = true) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!order) throw new NotFoundException('Order not found');

    const payment = order.payments[0];
    if (!payment) throw new BadRequestException('No payment record found for this order');

    if (payment.status === 'COMPLETED') {
      throw new BadRequestException('Payment is already verified');
    }

    await this.paymentsService.verifyPayment(payment.id, adminId, notes);

    const updated = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, user: { select: { email: true, firstName: true } } },
    });

    // Send payment confirmation email to customer (non-blocking)
    if (updated?.user?.email) {
      this.mailService
        .sendPaymentConfirmed(
          updated.user.email,
          updated.user.firstName || 'there',
          updated.orderNumber,
          Number(updated.totalAmount),
        )
        .catch((err) => this.logger.error('Failed to send payment confirmation email:', err));
    }

    // Auto-create shipping label if enabled (non-blocking — don't fail the payment approval)
    let shippingResult: any = null;
    if (autoShip) {
      try {
        const ratesResult = await this.getShippingRates(orderId);
        if (ratesResult.rates?.length > 0) {
          // Prefer cheapest USPS rate, fallback to cheapest overall
          const uspsRates = ratesResult.rates.filter(
            (r: any) => r.carrier?.toUpperCase().includes('USPS'),
          );
          const selectedRate = uspsRates.length > 0
            ? uspsRates.reduce((cheapest: any, r: any) => r.amount < cheapest.amount ? r : cheapest)
            : ratesResult.rates.reduce((cheapest: any, r: any) => r.amount < cheapest.amount ? r : cheapest);

          shippingResult = await this.createShippingLabel(orderId, selectedRate.id || selectedRate.rateId, adminId);
          this.logger.log(`Auto-shipped order ${order.orderNumber} via ${selectedRate.carrier} (${selectedRate.serviceName})`);
        }
      } catch (err) {
        this.logger.error(`Auto-ship failed for order ${orderId}:`, err);
        shippingResult = { error: 'Auto-ship failed — create label manually from the Shipping page' };
      }
    }

    return {
      success: true,
      message: autoShip && shippingResult?.success ? 'Payment approved & label created' : 'Payment approved',
      order: updated ? {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        paidAt: updated.paidAt,
      } : { id: orderId },
      shipping: shippingResult,
    };
  }

  /**
   * Get live shipping rates from EasyPost for an order
   */
  async getShippingRates(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (!order.shippingAddress) throw new BadRequestException('Order has no shipping address');

    // Weight: 3.6 oz base (box + bac water + 1 vial) + 0.5 oz per extra vial
    const totalVials = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const BASE_WEIGHT_OZ = 3.6; // box + bac water + 1 vial
    const EXTRA_VIAL_OZ = 0.5;  // each additional vial
    const totalWeightOz = BASE_WEIGHT_OZ + Math.max(totalVials - 1, 0) * EXTRA_VIAL_OZ;
    const totalWeightLbs = totalWeightOz / 16;

    const addr = order.shippingAddress;
    const result = await this.easypostService.createShipmentWithRates(
      {
        name: `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
        street1: addr.street1,
        street2: addr.street2 || undefined,
        city: addr.city,
        state: addr.state,
        zip: addr.postalCode,
        country: addr.country || 'US',
        phone: addr.phone || undefined,
      },
      totalWeightLbs,
    );

    // Cache the shipment ID on the order for later label creation
    if (result.shipmentId) {
      await this.prisma.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          externalShipmentId: result.shipmentId,
          shippingCost: 0,
        },
        update: {
          externalShipmentId: result.shipmentId,
        },
      });
    }

    return {
      shipmentId: result.shipmentId,
      rates: result.rates.map((rate: any) => ({
        id: rate.object_id,
        rateId: rate.object_id,
        carrier: rate.provider,
        service: rate.servicelevel?.token || rate.servicelevel_token || rate.provider?.toLowerCase(),
        serviceName: rate.servicelevel?.name || rate.servicelevel_name || rate.service,
        amount: parseFloat(rate.amount) || 0,
        currency: rate.currency || 'USD',
        estimatedDays: parseInt(rate.estimated_days || rate.days, 10) || 0,
        durationTerms: rate.duration_terms,
      })),
    };
  }

  /**
   * Create shipping label from a selected rate
   */
  async createShippingLabel(orderId: string, rateId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, firstName: true } },
        shippingAddress: true,
        shipment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Create label via EasyPost (pass cached shipment ID for resilience)
    const shipmentId = order.shipment?.externalShipmentId || undefined;
    const transaction = await this.easypostService.createLabel(rateId, shipmentId);

    if (transaction.status !== 'SUCCESS') {
      throw new BadRequestException(
        `Shipping label creation failed: ${JSON.stringify(transaction.messages || transaction.status)}`,
      );
    }

    // Update or create shipment record
    const rateAmount = transaction.rate?.amount ? parseFloat(transaction.rate.amount) : 0;
    const shipment = await this.prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        status: ShipmentStatus.LABEL_CREATED,
        carrier: transaction.rate?.provider || 'USPS',
        serviceLevel: transaction.rate?.servicelevel?.name || '',
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        labelUrl: transaction.label_url,
        externalTransactionId: transaction.object_id,
        externalRateId: rateId,
        shippingCost: rateAmount,
        shippedAt: new Date(),
      },
      update: {
        status: ShipmentStatus.LABEL_CREATED,
        carrier: transaction.rate?.provider || 'USPS',
        serviceLevel: transaction.rate?.servicelevel?.name || '',
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        labelUrl: transaction.label_url,
        externalTransactionId: transaction.object_id,
        externalRateId: rateId,
        shippingCost: rateAmount,
        shippedAt: new Date(),
      },
    });

    // Update order status → SHIPPED
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'SHIP',
        resourceType: 'Order',
        resourceId: orderId,
        newState: {
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          labelUrl: shipment.labelUrl,
        },
      },
    });

    // Send branded shipping notification to customer (non-blocking)
    this.mailService
      .sendOrderShipped(
        order.user.email,
        order.user.firstName || 'there',
        order.orderNumber,
        shipment.trackingNumber || '',
        shipment.trackingUrl || '',
        shipment.carrier || 'USPS',
      )
      .catch((err) => this.logger.error('Failed to send shipping notification:', err));

    return {
      success: true,
      message: 'Shipping label created',
      labelUrl: shipment.labelUrl,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      shipment: {
        id: shipment.id,
        carrier: shipment.carrier,
        serviceLevel: shipment.serviceLevel,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        labelUrl: shipment.labelUrl,
      },
    };
  }

  /**
   * One-click fulfillment: approve payment + get rates + create cheapest label
   */
  async fulfillOrder(orderId: string, adminId: string, notes?: string) {
    // Step 1: Approve payment (skip auto-ship — we handle shipping below)
    const paymentResult = await this.approvePayment(orderId, adminId, notes, false);

    // Step 2: Get shipping rates
    const ratesResult = await this.getShippingRates(orderId);

    if (!ratesResult.rates || ratesResult.rates.length === 0) {
      return {
        ...paymentResult,
        shipping: { error: 'No shipping rates available' },
      };
    }

    // Step 3: Pick cheapest rate (prefer USPS, then cheapest overall)
    const uspsRates = ratesResult.rates.filter(
      (r: any) => r.carrier?.toUpperCase().includes('USPS'),
    );
    const selectedRate = uspsRates.length > 0
      ? uspsRates.reduce((cheapest: any, r: any) =>
          r.amount < cheapest.amount ? r : cheapest,
        )
      : ratesResult.rates.reduce((cheapest: any, r: any) =>
          r.amount < cheapest.amount ? r : cheapest,
        );

    // Step 4: Create label
    const labelResult = await this.createShippingLabel(orderId, selectedRate.id || selectedRate.rateId, adminId);

    return {
      payment: paymentResult,
      shipping: labelResult,
      selectedRate: {
        carrier: selectedRate.carrier,
        service: selectedRate.serviceName,
        cost: selectedRate.amount,
      },
    };
  }

  // ==========================================================================
  // PACKING SLIP
  // ==========================================================================

  async getPackingSlipHtml(orderId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true,
        shippingAddress: true,
        shipment: { select: { trackingNumber: true, carrier: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const addr = order.shippingAddress;
    const shipTo = addr
      ? `${addr.firstName || ''} ${addr.lastName || ''}<br>${addr.street1}${addr.street2 ? '<br>' + addr.street2 : ''}<br>${addr.city}, ${addr.state} ${addr.postalCode}`
      : 'No address on file';

    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${item.productName}${item.variantName ? ' — ' + item.variantName : ''}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center;">${item.sku || '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center;">${item.quantity}</td>
          </tr>`,
      )
      .join('');

    const tracking = order.shipment?.trackingNumber
      ? `<p style="margin:4px 0;"><strong>Tracking:</strong> ${order.shipment.carrier || 'USPS'} ${order.shipment.trackingNumber}</p>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Packing Slip — ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1f2a36; padding: 24px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1f2a36; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 700; color: #1f2a36; }
    .logo span { color: #e3a7a1; }
    .order-info { text-align: right; font-size: 12px; }
    .addresses { display: flex; gap: 48px; margin-bottom: 24px; }
    .address-block h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 6px; letter-spacing: 0.5px; }
    .address-block p { line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f7f2ec; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
    th:nth-child(2), th:nth-child(3) { text-align: center; }
    .totals { text-align: right; margin-bottom: 24px; }
    .totals p { margin: 2px 0; }
    .totals .total-line { font-size: 15px; font-weight: 700; }
    .disclaimer { font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; text-align: center; }
    .print-btn { position: fixed; top: 12px; right: 12px; background: #1f2a36; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #e3a7a1; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Packing Slip</button>

  <div class="header">
    <div>
      <div class="logo">SBB <span>Peptides</span></div>
      <p style="font-size:11px;color:#888;margin-top:4px;">Science Based Body — Research Use Only</p>
    </div>
    <div class="order-info">
      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${tracking}
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Ship From</h3>
      <p>Health SBB<br>1001 S Main St<br>Kalispell, MT 59901</p>
    </div>
    <div class="address-block">
      <h3>Ship To</h3>
      <p>${shipTo}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>SKU</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <p>Subtotal: $${Number(order.subtotal).toFixed(2)}</p>
    <p>Shipping: $${Number(order.shippingCost).toFixed(2)}</p>
    ${Number(order.taxAmount) > 0 ? `<p>Tax: $${Number(order.taxAmount).toFixed(2)}</p>` : ''}
    ${Number(order.discountAmount) > 0 ? `<p>Discount: -$${Number(order.discountAmount).toFixed(2)}</p>` : ''}
    <p class="total-line">Total: $${Number(order.totalAmount).toFixed(2)}</p>
  </div>

  <div class="disclaimer">
    <p>All products are intended for research and laboratory use only. Not for human consumption.</p>
    <p style="margin-top:4px;">Thank you for your order! Questions? Contact sales@sbbpeptides.com</p>
  </div>
</body>
</html>`;
  }

  async getOrderLabelUrl(orderId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
      select: { labelUrl: true, trackingNumber: true, carrier: true, status: true },
    });

    if (!shipment || !shipment.labelUrl) {
      throw new NotFoundException('No label found for this order');
    }

    return {
      labelUrl: shipment.labelUrl,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
    };
  }
}

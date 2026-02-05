import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, UserStatus, ProductCategory, DiscountType, DiscountStatus, ReturnStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      monthRevenue,
      totalUsers,
      activeUsers,
      lowStockProducts,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT, OrderStatus.PROCESSING] },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.prisma.inventory.count({
        where: {
          quantity: { lte: this.prisma.inventory.fields.lowStockThreshold },
        },
      }),
    ]);

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: Number(totalRevenue._sum.totalAmount || 0),
        month: Number(monthRevenue._sum.totalAmount || 0),
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      inventory: {
        lowStock: lowStockProducts,
      },
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
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
        email: order.user.email,
      },
      status: order.status,
      total: Number(order.totalAmount),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
    }));
  }

  // ==========================================================================
  // ORDERS
  // ==========================================================================

  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
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
            select: { status: true, trackingNumber: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email,
          email: order.user.email,
        },
        status: order.status,
        paymentStatus: order.payments[0]?.status || 'PENDING',
        paymentMethod: order.payments[0]?.method,
        shippingStatus: order.shipment?.status,
        trackingNumber: order.shipment?.trackingNumber,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shippingCost),
        tax: Number(order.taxAmount),
        discount: Number(order.discountAmount),
        total: Number(order.totalAmount),
        itemCount: order.items.length,
        createdAt: order.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
              select: { slug: true },
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

    return order;
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
      products: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        category: product.category,
        basePrice: Number(product.basePrice),
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        variantCount: product.variants.length,
        stock: product.inventory?.quantity || 0,
        lowStock: product.inventory
          ? product.inventory.quantity <= product.inventory.lowStockThreshold
          : false,
        image: product.images[0]?.url,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    },
    adminId: string,
  ) {
    const previous = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!previous) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data,
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
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        loyaltyPoints: user.loyaltyPoints,
        lifetimeLoyaltyPoints: user.lifetimeLoyaltyPoints,
        orderCount: user._count.orders,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          take: 10,
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

    // Remove sensitive data
    const { passwordHash, governmentId, ...safeUser } = user;

    return safeUser;
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

  // ==========================================================================
  // INVENTORY
  // ==========================================================================

  async getLowStockProducts(threshold?: number) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        inventory: {
          quantity: {
            lte: threshold || this.prisma.inventory.fields.lowStockThreshold,
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
        SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
        FROM "Order"
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    const currentRev = Number(totalRevenue._sum.totalAmount || 0);
    const previousRev = Number(previousPeriodRevenue._sum.totalAmount || 0);
    const revenueGrowth = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0;

    return {
      summary: {
        totalRevenue: currentRev,
        totalOrders,
        averageOrderValue: Number(avgOrderValue._avg.totalAmount || 0),
        newCustomers,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      chartData: ordersByDay,
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
        SELECT p.category, SUM(oi.total_price) as revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi.product_id = p.id
        JOIN "Order" o ON oi.order_id = o.id
        WHERE o.created_at >= ${startDate}
        AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
      this.prisma.$queryRaw`
        SELECT pay.method, SUM(pay.amount) as total
        FROM "Payment" pay
        JOIN "Order" o ON pay.order_id = o.id
        WHERE pay.status = 'COMPLETED'
        AND o.created_at >= ${startDate}
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
      discounts: discounts.map((d) => ({
        ...d,
        value: Number(d.value),
        minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
        maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDiscountById(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');
    return {
      ...discount,
      value: Number(discount.value),
      minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : null,
      maxDiscountAmount: discount.maxDiscountAmount ? Number(discount.maxDiscountAmount) : null,
    };
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
      returns: returns.map((r) => ({
        ...r,
        subtotalAmount: Number(r.subtotalAmount),
        refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        admin: log.admin
          ? {
              email: log.admin.email,
              name: `${log.admin.firstName || ''} ${log.admin.lastName || ''}`.trim(),
            }
          : null,
        changes: {
          previous: log.previousState,
          new: log.newState,
        },
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      customer: {
        name: `${s.order.user.firstName || ''} ${s.order.user.lastName || ''}`.trim() || s.order.user.email,
        email: s.order.user.email,
      },
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
    }));
  }
}

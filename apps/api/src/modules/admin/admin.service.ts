import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, UserStatus, ProductCategory } from '@prisma/client';

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
}

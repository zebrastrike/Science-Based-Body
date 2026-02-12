import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

interface PeriodRange {
  startDate: Date;
  endDate: Date;
  previousStart: Date;
  previousEnd: Date;
}

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period = '30d'): PeriodRange {
    const endDate = new Date();
    const startDate = new Date();
    let days: number;

    switch (period) {
      case '7d':
        days = 7;
        break;
      case '90d':
        days = 90;
        break;
      case '365d':
        days = 365;
        break;
      case '30d':
      default:
        days = 30;
    }

    startDate.setDate(startDate.getDate() - days);

    const previousEnd = new Date(startDate);
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - days);

    return { startDate, endDate, previousStart, previousEnd };
  }

  private pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  // =========================================================================
  // FINANCIAL KPIs
  // =========================================================================

  async getFinancialKpis(period?: string) {
    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(period);
    const validStatuses = { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] as OrderStatus[] };

    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      currentAOV,
      totalRefunds,
      previousRefunds,
      revenueByDay,
      paymentMethodBreakdown,
      shippingRevenue,
      taxCollected,
      discountsGiven,
    ] = await Promise.all([
      // Current period revenue
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      // Previous period revenue
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: previousStart, lt: previousEnd }, status: validStatuses },
      }),
      // Current period order count
      this.prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      // Previous period order count
      this.prisma.order.count({
        where: { createdAt: { gte: previousStart, lt: previousEnd }, status: validStatuses },
      }),
      // Average order value
      this.prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      // Refunds this period
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: startDate, lte: endDate }, status: OrderStatus.REFUNDED },
      }),
      // Refunds previous period
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: previousStart, lt: previousEnd }, status: OrderStatus.REFUNDED },
      }),
      // Revenue by day chart data
      this.prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>`
        SELECT DATE("createdAt") as date,
               COALESCE(SUM("totalAmount"), 0) as revenue,
               COUNT(*)::int as orders
        FROM "Order"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
          AND status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // Payment method breakdown
      this.prisma.$queryRaw<Array<{ method: string; total: number; count: number }>>`
        SELECT p.method,
               COALESCE(SUM(p.amount), 0) as total,
               COUNT(*)::int as count
        FROM "Payment" p
        JOIN "Order" o ON p."orderId" = o.id
        WHERE p.status = 'COMPLETED'
          AND o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
        GROUP BY p.method
        ORDER BY total DESC
      `,
      // Shipping revenue collected
      this.prisma.order.aggregate({
        _sum: { shippingCost: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      // Tax collected
      this.prisma.order.aggregate({
        _sum: { taxAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      // Discounts given
      this.prisma.order.aggregate({
        _sum: { discountAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
    ]);

    const curRev = Number(currentRevenue._sum.totalAmount || 0);
    const prevRev = Number(previousRevenue._sum.totalAmount || 0);
    const curRefundAmt = Number(totalRefunds._sum.totalAmount || 0);
    const prevRefundAmt = Number(previousRefunds._sum.totalAmount || 0);

    return {
      revenue: {
        current: curRev,
        previous: prevRev,
        change: this.pctChange(curRev, prevRev),
      },
      orders: {
        current: currentOrders,
        previous: previousOrders,
        change: this.pctChange(currentOrders, previousOrders),
      },
      averageOrderValue: {
        current: Math.round(Number(currentAOV._avg.totalAmount || 0) * 100) / 100,
      },
      refunds: {
        amount: curRefundAmt,
        count: totalRefunds._count,
        previousAmount: prevRefundAmt,
        previousCount: previousRefunds._count,
        refundRate: currentOrders > 0
          ? Math.round((totalRefunds._count / (currentOrders + totalRefunds._count)) * 10000) / 100
          : 0,
      },
      shipping: {
        collected: Number(shippingRevenue._sum.shippingCost || 0),
      },
      tax: {
        collected: Number(taxCollected._sum.taxAmount || 0),
      },
      discounts: {
        total: Number(discountsGiven._sum.discountAmount || 0),
      },
      paymentMethods: paymentMethodBreakdown.map((p) => ({
        method: p.method,
        total: Number(p.total),
        count: Number(p.count),
      })),
      chartData: revenueByDay.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // CUSTOMER KPIs
  // =========================================================================

  async getCustomerKpis(period?: string) {
    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(period);

    const [
      newCustomers,
      previousNewCustomers,
      totalCustomers,
      activeCustomers,
      repeatCustomers,
      customersByRole,
      topCustomers,
      avgLifetimeValue,
      registrationsByDay,
    ] = await Promise.all([
      // New customers this period
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate }, role: 'CLIENT' },
      }),
      // New customers previous period
      this.prisma.user.count({
        where: { createdAt: { gte: previousStart, lt: previousEnd }, role: 'CLIENT' },
      }),
      // Total customers
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      // Active (ordered recently)
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId")::bigint as count
        FROM "Order"
        WHERE "createdAt" >= ${startDate}
          AND status NOT IN ('CANCELLED', 'REFUNDED')
      `.then((r) => Number(r[0]?.count || 0)),
      // Repeat customers (>1 order ever)
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT "userId" FROM "Order"
          WHERE status NOT IN ('CANCELLED', 'REFUNDED')
          GROUP BY "userId"
          HAVING COUNT(*) > 1
        ) sub
      `.then((r) => Number(r[0]?.count || 0)),
      // Customers by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      // Top 10 customers by lifetime spend
      this.prisma.$queryRaw<Array<{ userId: string; email: string; firstName: string; lastName: string; totalSpent: number; orderCount: number }>>`
        SELECT u.id as "userId", u.email, u."firstName", u."lastName",
               COALESCE(SUM(o."totalAmount"), 0) as "totalSpent",
               COUNT(o.id)::int as "orderCount"
        FROM "User" u
        LEFT JOIN "Order" o ON o."userId" = u.id AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        WHERE u.role = 'CLIENT'
        GROUP BY u.id, u.email, u."firstName", u."lastName"
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,
      // Average lifetime value
      this.prisma.$queryRaw<[{ avg_ltv: number }]>`
        SELECT COALESCE(AVG(customer_total), 0) as avg_ltv FROM (
          SELECT SUM(o."totalAmount") as customer_total
          FROM "User" u
          JOIN "Order" o ON o."userId" = u.id AND o.status NOT IN ('CANCELLED', 'REFUNDED')
          WHERE u.role = 'CLIENT'
          GROUP BY u.id
        ) sub
      `.then((r) => Number(r[0]?.avg_ltv || 0)),
      // Registrations by day
      this.prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
          AND role = 'CLIENT'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    return {
      newCustomers: {
        current: newCustomers,
        previous: previousNewCustomers,
        change: this.pctChange(newCustomers, previousNewCustomers),
      },
      totalCustomers,
      activeCustomers,
      repeatCustomers,
      repeatRate: totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 10000) / 100
        : 0,
      averageLifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
      customersByRole: customersByRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
      topCustomers: topCustomers.map((c) => ({
        userId: c.userId,
        email: c.email,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
        totalSpent: Number(c.totalSpent),
        orderCount: c.orderCount,
      })),
      registrationChart: registrationsByDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // PRODUCT KPIs
  // =========================================================================

  async getProductKpis(period?: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const validStatuses = { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] as OrderStatus[] };

    const [
      topSellingProducts,
      categoryPerformance,
      lowStockItems,
      outOfStockCount,
      totalActiveProducts,
      inventoryValue,
      productsSoldCount,
    ] = await Promise.all([
      // Top 15 products by revenue
      this.prisma.$queryRaw<Array<{ productId: string; name: string; sku: string; unitsSold: number; revenue: number; category: string }>>`
        SELECT oi."productId", oi."productName" as name,
               COALESCE(p.sku, '') as sku,
               SUM(oi.quantity)::int as "unitsSold",
               COALESCE(SUM(oi."totalPrice"), 0) as revenue,
               COALESCE(p.category::text, 'OTHER') as category
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        LEFT JOIN "Product" p ON oi."productId" = p.id
        WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY oi."productId", oi."productName", p.sku, p.category
        ORDER BY revenue DESC
        LIMIT 15
      `,
      // Revenue by category
      this.prisma.$queryRaw<Array<{ category: string; revenue: number; unitsSold: number; orderCount: number }>>`
        SELECT p.category,
               COALESCE(SUM(oi."totalPrice"), 0) as revenue,
               SUM(oi.quantity)::int as "unitsSold",
               COUNT(DISTINCT o.id)::int as "orderCount"
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        JOIN "Product" p ON oi."productId" = p.id
        WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
      // Low stock items
      this.prisma.$queryRaw<Array<{ id: string; name: string; sku: string; quantity: number; threshold: number }>>`
        SELECT p.id, p.name, p.sku, i.quantity, i."lowStockThreshold" as threshold
        FROM "Product" p
        JOIN "Inventory" i ON i."productId" = p.id
        WHERE p."isActive" = true
          AND i.quantity <= i."lowStockThreshold"
        ORDER BY i.quantity ASC
        LIMIT 20
      `,
      // Out of stock count
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "Product" p
        JOIN "Inventory" i ON i."productId" = p.id
        WHERE p."isActive" = true AND i.quantity <= 0
      `.then((r) => Number(r[0]?.count || 0)),
      // Total active products
      this.prisma.product.count({ where: { isActive: true } }),
      // Total inventory value (basePrice * quantity)
      this.prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(p."basePrice" * i.quantity), 0) as total
        FROM "Product" p
        JOIN "Inventory" i ON i."productId" = p.id
        WHERE p."isActive" = true
      `.then((r) => Number(r[0]?.total || 0)),
      // Distinct products sold this period
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT oi."productId") as count
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
      `.then((r) => Number(r[0]?.count || 0)),
    ]);

    return {
      topProducts: topSellingProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        unitsSold: Number(p.unitsSold),
        revenue: Number(p.revenue),
        category: p.category,
      })),
      categoryPerformance: categoryPerformance.map((c) => ({
        category: c.category,
        revenue: Number(c.revenue),
        unitsSold: Number(c.unitsSold),
        orderCount: Number(c.orderCount),
      })),
      inventory: {
        totalActiveProducts,
        outOfStock: outOfStockCount,
        lowStock: lowStockItems.length,
        totalValue: Math.round(inventoryValue * 100) / 100,
        productsSold: productsSoldCount,
      },
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        threshold: item.threshold,
      })),
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // OPERATIONS KPIs
  // =========================================================================

  async getOperationsKpis(period?: string) {
    const { startDate, endDate } = this.getDateRange(period);

    const [
      ordersByStatus,
      avgFulfillmentTime,
      avgDeliveryTime,
      returnStats,
      pendingOrders,
      shippedNotDelivered,
      processingBreakdown,
    ] = await Promise.all([
      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      // Average fulfillment time (created → shipped) in hours
      this.prisma.$queryRaw<[{ avg_hours: number }]>`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("shippedAt" - "createdAt")) / 3600), 0) as avg_hours
        FROM "Order"
        WHERE "shippedAt" IS NOT NULL
          AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      `.then((r) => Number(r[0]?.avg_hours || 0)),
      // Average delivery time (shipped → delivered) in hours
      this.prisma.$queryRaw<[{ avg_hours: number }]>`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "shippedAt")) / 3600), 0) as avg_hours
        FROM "Order"
        WHERE "deliveredAt" IS NOT NULL AND "shippedAt" IS NOT NULL
          AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      `.then((r) => Number(r[0]?.avg_hours || 0)),
      // Return statistics
      this.prisma.return.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      // Pending orders count (need attention)
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT] },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Shipped but not delivered
      this.prisma.order.count({
        where: { status: OrderStatus.SHIPPED },
      }),
      // Processing type breakdown
      this.prisma.order.groupBy({
        by: ['processingType'],
        _count: true,
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalReturns = returnStats.reduce((sum, r) => sum + r._count, 0);
    const totalOrders = ordersByStatus.reduce((sum, o) => sum + o._count, 0);

    return {
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),
      fulfillment: {
        avgFulfillmentHours: Math.round(avgFulfillmentTime * 10) / 10,
        avgFulfillmentDays: Math.round((avgFulfillmentTime / 24) * 10) / 10,
        avgDeliveryHours: Math.round(avgDeliveryTime * 10) / 10,
        avgDeliveryDays: Math.round((avgDeliveryTime / 24) * 10) / 10,
      },
      returns: {
        total: totalReturns,
        byStatus: returnStats.map((r) => ({
          status: r.status,
          count: r._count,
        })),
        returnRate: totalOrders > 0
          ? Math.round((totalReturns / totalOrders) * 10000) / 100
          : 0,
      },
      pendingOrders,
      shippedNotDelivered,
      processingBreakdown: processingBreakdown.map((p) => ({
        type: p.processingType,
        count: p._count,
      })),
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // AFFILIATE KPIs
  // =========================================================================

  async getAffiliateKpis(period?: string) {
    const { startDate, endDate } = this.getDateRange(period);

    const [
      totalAffiliates,
      activeAffiliates,
      topAffiliates,
      totalClicks,
      totalConversions,
      totalCommission,
      pendingPayouts,
      referralsByDay,
    ] = await Promise.all([
      // Total affiliates
      this.prisma.affiliate.count(),
      // Active affiliates
      this.prisma.affiliate.count({ where: { isActive: true } }),
      // Top affiliates by revenue
      this.prisma.$queryRaw<Array<{
        id: string; referralCode: string; email: string; firstName: string; lastName: string;
        totalClicks: number; totalOrders: number; totalRevenue: number; totalCommission: number;
      }>>`
        SELECT a.id, a."referralCode", u.email, u."firstName", u."lastName",
               a."totalClicks", a."totalOrders",
               a."totalRevenue", a."totalCommission"
        FROM "Affiliate" a
        JOIN "User" u ON a."userId" = u.id
        WHERE a."isActive" = true
        ORDER BY a."totalRevenue" DESC
        LIMIT 10
      `,
      // Total clicks this period
      this.prisma.affiliateReferral.count({
        where: { clickedAt: { gte: startDate, lte: endDate } },
      }),
      // Conversions this period
      this.prisma.affiliateReferral.count({
        where: { convertedAt: { gte: startDate, lte: endDate } },
      }),
      // Commission this period
      this.prisma.affiliateReferral.aggregate({
        _sum: { commissionAmount: true },
        where: { convertedAt: { gte: startDate, lte: endDate } },
      }),
      // Pending payouts
      this.prisma.affiliateReferral.aggregate({
        _sum: { commissionAmount: true },
        _count: true,
        where: { paidOut: false, commissionAmount: { gt: 0 } },
      }),
      // Referrals by day
      this.prisma.$queryRaw<Array<{ date: string; clicks: number; conversions: number }>>`
        SELECT DATE("clickedAt") as date,
               COUNT(*)::int as clicks,
               COUNT(CASE WHEN "convertedAt" IS NOT NULL THEN 1 END)::int as conversions
        FROM "AffiliateReferral"
        WHERE "clickedAt" >= ${startDate} AND "clickedAt" <= ${endDate}
        GROUP BY DATE("clickedAt")
        ORDER BY date ASC
      `,
    ]);

    return {
      overview: {
        totalAffiliates,
        activeAffiliates,
      },
      periodMetrics: {
        clicks: totalClicks,
        conversions: totalConversions,
        conversionRate: totalClicks > 0
          ? Math.round((totalConversions / totalClicks) * 10000) / 100
          : 0,
        commissionEarned: Number(totalCommission._sum.commissionAmount || 0),
      },
      pendingPayouts: {
        amount: Number(pendingPayouts._sum.commissionAmount || 0),
        count: pendingPayouts._count,
      },
      topAffiliates: topAffiliates.map((a) => ({
        id: a.id,
        referralCode: a.referralCode,
        email: a.email,
        name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
        totalClicks: a.totalClicks,
        totalOrders: a.totalOrders,
        totalRevenue: Number(a.totalRevenue),
        totalCommission: Number(a.totalCommission),
        conversionRate: a.totalClicks > 0
          ? Math.round((a.totalOrders / a.totalClicks) * 10000) / 100
          : 0,
      })),
      chartData: referralsByDay.map((d) => ({
        date: d.date,
        clicks: Number(d.clicks),
        conversions: Number(d.conversions),
      })),
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // MARKETING KPIs
  // =========================================================================

  async getMarketingKpis(period?: string) {
    const { startDate, endDate } = this.getDateRange(period);

    const [
      popupStats,
      discountUsage,
      emailCaptures,
      topDiscountCodes,
    ] = await Promise.all([
      // Popup performance
      this.prisma.marketingPopup.findMany({
        select: {
          id: true,
          name: true,
          headline: true,
          impressions: true,
          conversions: true,
          isActive: true,
        },
        orderBy: { conversions: 'desc' },
      }),
      // Discount code usage this period
      this.prisma.$queryRaw<Array<{ code: string; usageCount: number; revenue: number; orderCount: number }>>`
        SELECT o."discountCode" as code,
               COUNT(*)::int as "orderCount",
               COALESCE(SUM(o."totalAmount"), 0) as revenue,
               COALESCE(SUM(o."discountAmount"), 0) as "usageCount"
        FROM "Order" o
        WHERE o."discountCode" IS NOT NULL
          AND o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY o."discountCode"
        ORDER BY revenue DESC
        LIMIT 10
      `,
      // Email captures (from popup conversions — rough estimate from MarketingPopup conversions)
      this.prisma.marketingPopup.aggregate({
        _sum: { conversions: true },
      }),
      // Top discount codes all-time
      this.prisma.discount.findMany({
        where: { usageCount: { gt: 0 } },
        select: {
          code: true,
          type: true,
          value: true,
          usageCount: true,
          usageLimit: true,
          status: true,
        },
        orderBy: { usageCount: 'desc' },
        take: 10,
      }),
    ]);

    return {
      popups: {
        total: popupStats.length,
        active: popupStats.filter((p) => p.isActive).length,
        performance: popupStats.map((p) => ({
          id: p.id,
          name: p.name,
          headline: p.headline,
          impressions: p.impressions,
          conversions: p.conversions,
          conversionRate: p.impressions > 0
            ? Math.round((p.conversions / p.impressions) * 10000) / 100
            : 0,
          isActive: p.isActive,
        })),
        totalEmailCaptures: Number(emailCaptures._sum.conversions || 0),
      },
      discounts: {
        usageThisPeriod: discountUsage.map((d) => ({
          code: d.code,
          orderCount: Number(d.orderCount),
          revenue: Number(d.revenue),
          discountGiven: Number(d.usageCount),
        })),
        topCodes: topDiscountCodes.map((d) => ({
          code: d.code,
          type: d.type,
          value: Number(d.value),
          usageCount: d.usageCount,
          usageLimit: d.usageLimit,
          status: d.status,
        })),
      },
      period: { startDate, endDate },
    };
  }

  // =========================================================================
  // AGGREGATE KPI OVERVIEW
  // =========================================================================

  async getKpiOverview(period?: string) {
    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(period);
    const validStatuses = { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] as OrderStatus[] };

    const [
      revenue,
      prevRevenue,
      orders,
      prevOrders,
      newCustomers,
      prevNewCustomers,
      aov,
      pendingOrders,
      lowStockCount,
      totalProducts,
      activeAffiliates,
      pendingReturns,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: previousStart, lt: previousEnd }, status: validStatuses },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: previousStart, lt: previousEnd }, status: validStatuses },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate }, role: 'CLIENT' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: previousStart, lt: previousEnd }, role: 'CLIENT' },
      }),
      this.prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: { createdAt: { gte: startDate, lte: endDate }, status: validStatuses },
      }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT] } },
      }),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Inventory"
        WHERE quantity <= "lowStockThreshold"
      `.then((r) => Number(r[0]?.count || 0)),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.affiliate.count({ where: { isActive: true } }),
      this.prisma.return.count({ where: { status: 'REQUESTED' } }),
    ]);

    const curRev = Number(revenue._sum.totalAmount || 0);
    const prevR = Number(prevRevenue._sum.totalAmount || 0);

    return {
      revenue: {
        value: curRev,
        change: this.pctChange(curRev, prevR),
        label: 'Revenue',
      },
      orders: {
        value: orders,
        change: this.pctChange(orders, prevOrders),
        label: 'Orders',
      },
      newCustomers: {
        value: newCustomers,
        change: this.pctChange(newCustomers, prevNewCustomers),
        label: 'New Customers',
      },
      averageOrderValue: {
        value: Math.round(Number(aov._avg.totalAmount || 0) * 100) / 100,
        label: 'Avg Order Value',
      },
      alerts: {
        pendingOrders,
        lowStockItems: lowStockCount,
        pendingReturns,
      },
      snapshot: {
        totalProducts,
        activeAffiliates,
      },
      period: { startDate, endDate },
    };
  }
}

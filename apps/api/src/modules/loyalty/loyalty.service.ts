import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoyaltyPointType } from '@prisma/client';

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
}

@Injectable()
export class LoyaltyService {
  // Points earned per dollar spent
  private readonly POINTS_PER_DOLLAR = 10;

  // Points value when redeeming (100 points = $1)
  private readonly POINTS_VALUE = 0.01;

  // Minimum points required to redeem
  private readonly MIN_REDEMPTION = 500;

  // Maximum percentage of order that can be paid with points
  private readonly MAX_POINTS_PERCENT = 0.5;

  // Loyalty tiers
  private readonly TIERS: LoyaltyTier[] = [
    {
      name: 'Bronze',
      minPoints: 0,
      multiplier: 1.0,
      benefits: ['10 points per $1 spent', 'Early access to sales'],
    },
    {
      name: 'Silver',
      minPoints: 2500,
      multiplier: 1.25,
      benefits: [
        '12.5 points per $1 spent',
        'Early access to sales',
        'Free shipping on orders $250+',
      ],
    },
    {
      name: 'Gold',
      minPoints: 7500,
      multiplier: 1.5,
      benefits: [
        '15 points per $1 spent',
        'Early access to sales',
        'Free shipping on all orders',
        'Priority support',
      ],
    },
    {
      name: 'Platinum',
      minPoints: 15000,
      multiplier: 2.0,
      benefits: [
        '20 points per $1 spent',
        'Early access to sales',
        'Free express shipping',
        'Priority support',
        'Dedicated account manager',
      ],
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's loyalty balance and tier info
   */
  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        lifetimeLoyaltyPoints: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = this.getTierByPoints(user.lifetimeLoyaltyPoints);
    const nextTier = this.getNextTier(user.lifetimeLoyaltyPoints);

    return {
      currentBalance: user.loyaltyPoints,
      lifetimePoints: user.lifetimeLoyaltyPoints,
      dollarValue: this.pointsToDollars(user.loyaltyPoints),
      tier: {
        name: tier.name,
        multiplier: tier.multiplier,
        benefits: tier.benefits,
      },
      nextTier: nextTier
        ? {
            name: nextTier.name,
            pointsRequired: nextTier.minPoints,
            pointsNeeded: nextTier.minPoints - user.lifetimeLoyaltyPoints,
          }
        : null,
    };
  }

  /**
   * Get points history for a user
   */
  async getHistory(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          order: {
            select: { orderNumber: true },
          },
        },
      }),
      this.prisma.loyaltyTransaction.count({ where: { userId } }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        orderNumber: t.order?.orderNumber,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate points to award for an order
   */
  calculateOrderPoints(userId: string, orderTotal: number): number {
    // Base points calculation
    return Math.floor(orderTotal * this.POINTS_PER_DOLLAR);
  }

  /**
   * Award points for a completed order
   */
  async awardOrderPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
  ): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lifetimeLoyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get tier multiplier
    const tier = this.getTierByPoints(user.lifetimeLoyaltyPoints);
    const basePoints = this.calculateOrderPoints(userId, orderTotal);
    const pointsToAward = Math.floor(basePoints * tier.multiplier);

    // Create transaction and update balance
    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          type: LoyaltyPointType.EARNED,
          points: pointsToAward,
          description: `Points earned from order (${tier.name} tier ${tier.multiplier}x)`,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: pointsToAward },
          lifetimeLoyaltyPoints: { increment: pointsToAward },
        },
      }),
    ]);

    return pointsToAward;
  }

  /**
   * Redeem points for order discount
   */
  async redeemPoints(
    userId: string,
    pointsToRedeem: number,
    orderId?: string,
  ): Promise<{ pointsRedeemed: number; dollarValue: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (pointsToRedeem < this.MIN_REDEMPTION) {
      throw new BadRequestException(
        `Minimum ${this.MIN_REDEMPTION} points required for redemption`,
      );
    }

    if (pointsToRedeem > user.loyaltyPoints) {
      throw new BadRequestException('Insufficient points balance');
    }

    const dollarValue = this.pointsToDollars(pointsToRedeem);

    // Create transaction and update balance
    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          type: LoyaltyPointType.REDEEMED,
          points: -pointsToRedeem,
          description: `Redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)} discount`,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { decrement: pointsToRedeem },
        },
      }),
    ]);

    return { pointsRedeemed: pointsToRedeem, dollarValue };
  }

  /**
   * Calculate maximum points that can be redeemed for an order
   */
  getMaxRedeemablePoints(
    userBalance: number,
    orderSubtotal: number,
  ): { maxPoints: number; maxValue: number } {
    // Maximum value that can be covered by points
    const maxDollarValue = orderSubtotal * this.MAX_POINTS_PERCENT;
    const maxPointsByValue = this.dollarsToPoints(maxDollarValue);

    // Actual max is the lesser of user balance and max by order value
    const maxPoints = Math.min(userBalance, maxPointsByValue);

    // Round down to nearest 100 for cleaner UX
    const roundedMax = Math.floor(maxPoints / 100) * 100;

    return {
      maxPoints: roundedMax,
      maxValue: this.pointsToDollars(roundedMax),
    };
  }

  /**
   * Award bonus points (promotions, referrals, etc.)
   */
  async awardBonusPoints(
    userId: string,
    points: number,
    reason: string,
    adminId?: string,
  ): Promise<number> {
    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          type: LoyaltyPointType.BONUS,
          points,
          description: reason,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points },
          lifetimeLoyaltyPoints: { increment: points },
        },
      }),
    ]);

    // Audit log for admin-granted points
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          action: 'CREATE',
          resourceType: 'LoyaltyTransaction',
          resourceId: userId,
          metadata: {
            event: 'bonus_points_awarded',
            points,
            reason,
          },
        },
      });
    }

    return points;
  }

  /**
   * Expire old points (for scheduled job)
   */
  async expireOldPoints(expirationMonths: number = 12): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() - expirationMonths);

    // Find transactions to expire
    const transactionsToExpire = await this.prisma.loyaltyTransaction.findMany({
      where: {
        type: LoyaltyPointType.EARNED,
        createdAt: { lt: expirationDate },
        points: { gt: 0 },
      },
      select: {
        id: true,
        userId: true,
        points: true,
      },
    });

    // Group by user
    const userPointsMap = new Map<string, number>();
    for (const t of transactionsToExpire) {
      const current = userPointsMap.get(t.userId) || 0;
      userPointsMap.set(t.userId, current + t.points);
    }

    let totalExpired = 0;

    // Process expirations
    for (const [userId, points] of userPointsMap) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      if (user && user.loyaltyPoints > 0) {
        const pointsToExpire = Math.min(points, user.loyaltyPoints);

        await this.prisma.$transaction([
          this.prisma.loyaltyTransaction.create({
            data: {
              userId,
              type: LoyaltyPointType.EXPIRED,
              points: -pointsToExpire,
              description: 'Points expired after 12 months of inactivity',
            },
          }),
          this.prisma.user.update({
            where: { id: userId },
            data: {
              loyaltyPoints: { decrement: pointsToExpire },
            },
          }),
        ]);

        totalExpired += pointsToExpire;
      }
    }

    return totalExpired;
  }

  /**
   * Get loyalty program info (public)
   */
  getProgramInfo() {
    return {
      name: 'SBB Rewards',
      description:
        'Earn points on every purchase and redeem them for discounts on future orders.',
      earnRate: `${this.POINTS_PER_DOLLAR} points per $1 spent`,
      redeemRate: `${Math.round(1 / this.POINTS_VALUE)} points = $1`,
      minimumRedemption: this.MIN_REDEMPTION,
      maxRedemptionPercent: this.MAX_POINTS_PERCENT * 100,
      tiers: this.TIERS.map((t) => ({
        name: t.name,
        minPoints: t.minPoints,
        multiplierDisplay: `${t.multiplier}x points`,
        benefits: t.benefits,
      })),
    };
  }

  // Helper methods
  private getTierByPoints(lifetimePoints: number): LoyaltyTier {
    for (let i = this.TIERS.length - 1; i >= 0; i--) {
      if (lifetimePoints >= this.TIERS[i].minPoints) {
        return this.TIERS[i];
      }
    }
    return this.TIERS[0];
  }

  private getNextTier(lifetimePoints: number): LoyaltyTier | null {
    for (const tier of this.TIERS) {
      if (lifetimePoints < tier.minPoints) {
        return tier;
      }
    }
    return null;
  }

  private pointsToDollars(points: number): number {
    return points * this.POINTS_VALUE;
  }

  private dollarsToPoints(dollars: number): number {
    return Math.floor(dollars / this.POINTS_VALUE);
  }
}

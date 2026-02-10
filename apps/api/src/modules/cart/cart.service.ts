import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType, DiscountStatus } from '@prisma/client';

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    basePrice: number;
    image?: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    strength?: string;
  };
  unitPrice: number;
  lineTotal: number;
  weightGrams?: number; // Weight per unit for Shippo integration
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  estimatedShipping: number;
  estimatedTax: number;
  total: number;
  // Weight tracking for Shippo shipment creation
  totalWeightGrams: number;
  totalWeightLbs: number;
}

@Injectable()
export class CartService {
  // Volume discount threshold: Buy 10+ of same mg - 20% off
  private readonly VOLUME_DISCOUNT_THRESHOLD = 10;
  private readonly VOLUME_DISCOUNT_PERCENT = 0.20;

  constructor(private prisma: PrismaService) {}

  /**
   * Validate and enrich cart items with product data
   * Returns fully computed cart with pricing
   * If userId is provided, checks for wholesale PriceList pricing
   */
  async validateAndEnrichCart(items: Array<{ productId: string; variantId?: string; quantity: number }>, userId?: string): Promise<Cart> {
    if (!items || items.length === 0) {
      return this.emptyCart();
    }

    // Load wholesale price list if user has one
    let priceList: { discountPercent: number | null; items: Map<string, { customPrice: number | null; discountPercent: number | null }> } | null = null;
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { priceListId: true },
      });
      if (user?.priceListId) {
        const pl = await this.prisma.priceList.findUnique({
          where: { id: user.priceListId },
          include: { items: true },
        });
        if (pl && pl.isActive) {
          const itemsMap = new Map<string, { customPrice: number | null; discountPercent: number | null }>();
          for (const item of pl.items) {
            itemsMap.set(item.productId, {
              customPrice: item.customPrice ? Number(item.customPrice) : null,
              discountPercent: item.discountPercent,
            });
          }
          priceList = { discountPercent: pl.discountPercent, items: itemsMap };
        }
      }
    }

    const enrichedItems: CartItem[] = [];
    let subtotal = 0;
    let itemCount = 0;
    let discountAmount = 0;
    let totalWeightGrams = 0;

    // Group items by variant for volume discount calculation
    const variantQuantities = new Map<string, number>();

    for (const item of items) {
      if (item.quantity < 1) continue;

      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: true,
          images: { where: { isPrimary: true }, take: 1 },
          inventory: true,
        },
      });

      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${item.productId} is not available`);
      }

      let unitPrice = Number(product.basePrice);
      let variant = null;
      // Get weight: variant weight overrides product weight
      let itemWeightGrams = product.weightGrams || 0;

      // Apply wholesale pricing if available
      if (priceList) {
        const plItem = priceList.items.get(item.productId);
        if (plItem?.customPrice != null) {
          // Product-specific custom price
          unitPrice = plItem.customPrice;
        } else if (plItem?.discountPercent != null) {
          // Product-specific discount percent
          unitPrice = unitPrice * (1 - plItem.discountPercent / 100);
        } else if (priceList.discountPercent != null) {
          // Global price list discount
          unitPrice = unitPrice * (1 - priceList.discountPercent / 100);
        }
        unitPrice = Math.round(unitPrice * 100) / 100;
      }

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          throw new BadRequestException(`Variant ${item.variantId} is not available`);
        }
        unitPrice = Number(variant.price);
        // Variant weight overrides product weight if set
        if (variant.weightGrams) {
          itemWeightGrams = variant.weightGrams;
        }

        // Track variant quantities for volume discount
        const key = item.variantId;
        variantQuantities.set(key, (variantQuantities.get(key) || 0) + item.quantity);
      }

      // Check inventory — allow special order items (leadTimeDays set) even when stock is 0
      const inventory = product.inventory;
      if (inventory && inventory.quantity < item.quantity && !inventory.leadTimeDays) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;
      totalWeightGrams += itemWeightGrams * item.quantity;

      enrichedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          basePrice: Number(product.basePrice),
          image: product.images[0]?.url,
        },
        variant: variant
          ? {
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              price: Number(variant.price),
              strength: variant.strength || undefined,
            }
          : undefined,
        unitPrice,
        lineTotal,
        weightGrams: itemWeightGrams,
      });
    }

    // Calculate volume discounts (10+ of same variant = 20% off)
    for (const [variantId, qty] of variantQuantities) {
      if (qty >= this.VOLUME_DISCOUNT_THRESHOLD) {
        const item = enrichedItems.find((i) => i.variantId === variantId);
        if (item) {
          const itemDiscount = item.lineTotal * this.VOLUME_DISCOUNT_PERCENT;
          discountAmount += itemDiscount;
        }
      }
    }

    // Free shipping threshold: $500+ = FREE, otherwise $25 flat rate
    const FREE_SHIPPING_THRESHOLD = 500;
    const STANDARD_SHIPPING = 25;
    const estimatedShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

    // Tax calculation - configurable via Settings
    const taxRate = await this.getTaxRate();
    const estimatedTax = Math.round((subtotal - discountAmount) * taxRate * 100) / 100;

    const total = subtotal - discountAmount + estimatedShipping + estimatedTax;

    // Convert grams to pounds for Shippo (1 lb = 453.592 grams)
    const totalWeightLbs = Math.round((totalWeightGrams / 453.592) * 100) / 100;

    return {
      items: enrichedItems,
      itemCount,
      subtotal,
      discountAmount,
      estimatedShipping,
      estimatedTax,
      total,
      totalWeightGrams,
      totalWeightLbs,
    };
  }

  /**
   * Apply discount/promo code to cart
   * Uses the Discount model with full validation
   */
  async applyDiscountCode(cart: Cart, code: string, userId?: string): Promise<Cart> {
    // Lookup discount code in Discount table
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new BadRequestException('Invalid discount code');
    }

    // Validate discount is active
    if (discount.status !== DiscountStatus.ACTIVE) {
      throw new BadRequestException('This discount code is no longer active');
    }

    // Check if discount has started
    if (discount.startsAt > new Date()) {
      throw new BadRequestException('This discount code is not yet active');
    }

    // Check if discount has expired
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('This discount code has expired');
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new BadRequestException('This discount code has reached its usage limit');
    }

    // Check per-user limit (if user is logged in)
    if (userId && discount.perUserLimit) {
      const userUsageCount = await this.prisma.order.count({
        where: {
          userId,
          discountCode: code.toUpperCase(),
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });
      if (userUsageCount >= discount.perUserLimit) {
        throw new BadRequestException('You have already used this discount code the maximum number of times');
      }
    }

    // Check minimum order amount
    if (discount.minOrderAmount && cart.subtotal < Number(discount.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order of $${Number(discount.minOrderAmount).toFixed(2)} required for this discount`,
      );
    }

    // Check product restrictions (if any)
    if (discount.productIds && discount.productIds.length > 0) {
      const eligibleItems = cart.items.filter((item) =>
        discount.productIds.includes(item.productId),
      );
      if (eligibleItems.length === 0) {
        throw new BadRequestException('This discount code does not apply to items in your cart');
      }
    }

    // Check category restrictions (if any)
    if (discount.categoryIds && discount.categoryIds.length > 0) {
      const cartProductIds = cart.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: cartProductIds } },
        select: { id: true, category: true },
      });
      const eligibleProducts = products.filter((p) =>
        discount.categoryIds.includes(p.category),
      );
      if (eligibleProducts.length === 0) {
        throw new BadRequestException('This discount does not apply to product categories in your cart');
      }
    }

    // Check user restrictions (if any)
    if (discount.userIds && discount.userIds.length > 0) {
      if (!userId || !discount.userIds.includes(userId)) {
        throw new BadRequestException('This discount code is not available for your account');
      }
    }

    // Calculate discount amount based on type
    let additionalDiscount = 0;

    switch (discount.type) {
      case DiscountType.PERCENTAGE:
        additionalDiscount = cart.subtotal * (Number(discount.value) / 100);
        // Apply max discount cap if set
        if (discount.maxDiscountAmount) {
          additionalDiscount = Math.min(additionalDiscount, Number(discount.maxDiscountAmount));
        }
        break;

      case DiscountType.FIXED_AMOUNT:
        additionalDiscount = Math.min(Number(discount.value), cart.subtotal);
        break;

      case DiscountType.FREE_SHIPPING:
        // For free shipping, set shipping to 0 and return
        return {
          ...cart,
          discountCode: code.toUpperCase(),
          estimatedShipping: 0,
          total: cart.subtotal - cart.discountAmount + cart.estimatedTax,
        };
    }

    // Round to 2 decimal places
    additionalDiscount = Math.round(additionalDiscount * 100) / 100;

    const newDiscountAmount = cart.discountAmount + additionalDiscount;
    const newTotal = cart.subtotal - newDiscountAmount + cart.estimatedShipping + cart.estimatedTax;

    return {
      ...cart,
      discountCode: code.toUpperCase(),
      discountAmount: newDiscountAmount,
      total: Math.max(0, newTotal),
    };
  }

  /**
   * Validate discount code without applying it
   * Returns discount info or throws error if invalid
   */
  async validateDiscountCode(code: string, subtotal: number, userId?: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new BadRequestException('Invalid discount code');
    }

    if (discount.status !== DiscountStatus.ACTIVE) {
      throw new BadRequestException('This discount code is no longer active');
    }

    if (discount.startsAt > new Date()) {
      throw new BadRequestException('This discount code is not yet active');
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('This discount code has expired');
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new BadRequestException('This discount code has reached its usage limit');
    }

    if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order of $${Number(discount.minOrderAmount).toFixed(2)} required`,
      );
    }

    return {
      valid: true,
      code: discount.code,
      type: discount.type,
      value: Number(discount.value),
      description: discount.description,
    };
  }

  /**
   * Increment discount usage count (call after successful order)
   */
  async incrementDiscountUsage(code: string) {
    await this.prisma.discount.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Get shipping rates for cart
   * Flat Rate: $25 standard, FREE on orders $500+
   * Expedited: $50 (2-day delivery)
   */
  async getShippingRates(cart: Cart, destinationZip: string) {
    const FREE_SHIPPING_THRESHOLD = 500;
    const STANDARD_SHIPPING_RATE = 25;
    const EXPEDITED_SHIPPING_RATE = 50;

    const standardPrice = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE;
    const isFreeShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD;

    const rates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: isFreeShipping
          ? 'FREE Shipping (3-5 business days)'
          : `Flat Rate $${STANDARD_SHIPPING_RATE} (3-5 business days)`,
        price: standardPrice,
        estimatedDays: '3-5',
        isFree: isFreeShipping,
        freeThreshold: FREE_SHIPPING_THRESHOLD,
        freeThresholdMessage: `Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}`,
      },
      {
        id: 'expedited',
        name: 'Expedited Shipping',
        description: '2-Day Express Delivery',
        price: EXPEDITED_SHIPPING_RATE,
        estimatedDays: '1-2',
        isFree: false,
      },
    ];

    return rates;
  }

  /**
   * Get volume discount info for display
   */
  getVolumeDiscountInfo() {
    return {
      threshold: this.VOLUME_DISCOUNT_THRESHOLD,
      discountPercent: this.VOLUME_DISCOUNT_PERCENT * 100,
      message: `Buy ${this.VOLUME_DISCOUNT_THRESHOLD}+ of the same mg — Get ${this.VOLUME_DISCOUNT_PERCENT * 100}% OFF Instantly!`,
    };
  }

  /**
   * Get tax rate from Settings (configurable)
   * Returns decimal rate (e.g., 0.0825 for 8.25%)
   * Research chemicals are typically not taxed, default is 0
   */
  private async getTaxRate(): Promise<number> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'tax_rate' },
      });

      if (setting) {
        const rate = parseFloat(setting.value);
        // Validate the rate is a reasonable percentage (0-100%)
        if (!isNaN(rate) && rate >= 0 && rate <= 1) {
          return rate;
        }
      }
    } catch {
      // If any error, return default
    }

    // Default: 0% tax (research materials)
    return 0;
  }

  /**
   * Get tax configuration for admin
   */
  async getTaxConfig() {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'tax_rate' },
    });

    return {
      taxRate: setting ? parseFloat(setting.value) : 0,
      taxRatePercent: setting ? parseFloat(setting.value) * 100 : 0,
      description: 'Tax rate applied to orders (decimal, e.g., 0.0825 = 8.25%)',
    };
  }

  private emptyCart(): Cart {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountAmount: 0,
      estimatedShipping: 0,
      estimatedTax: 0,
      total: 0,
      totalWeightGrams: 0,
      totalWeightLbs: 0,
    };
  }
}

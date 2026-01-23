import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
   */
  async validateAndEnrichCart(items: Array<{ productId: string; variantId?: string; quantity: number }>): Promise<Cart> {
    if (!items || items.length === 0) {
      return this.emptyCart();
    }

    const enrichedItems: CartItem[] = [];
    let subtotal = 0;
    let itemCount = 0;
    let discountAmount = 0;

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

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          throw new BadRequestException(`Variant ${item.variantId} is not available`);
        }
        unitPrice = Number(variant.price);

        // Track variant quantities for volume discount
        const key = item.variantId;
        variantQuantities.set(key, (variantQuantities.get(key) || 0) + item.quantity);
      }

      // Check inventory
      const inventory = product.inventory;
      if (inventory && inventory.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;

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

    // Free shipping threshold (example: $99+)
    const FREE_SHIPPING_THRESHOLD = 99;
    const STANDARD_SHIPPING = 9.99;
    const estimatedShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

    // Tax calculation (placeholder - would integrate with tax service)
    const TAX_RATE = 0; // Research chemicals typically not taxed
    const estimatedTax = (subtotal - discountAmount) * TAX_RATE;

    const total = subtotal - discountAmount + estimatedShipping + estimatedTax;

    return {
      items: enrichedItems,
      itemCount,
      subtotal,
      discountAmount,
      estimatedShipping,
      estimatedTax,
      total,
    };
  }

  /**
   * Apply discount/promo code to cart
   */
  async applyDiscountCode(cart: Cart, code: string): Promise<Cart> {
    // Lookup discount code in settings or dedicated table
    const setting = await this.prisma.setting.findUnique({
      where: { key: `discount_code_${code.toUpperCase()}` },
    });

    if (!setting) {
      throw new BadRequestException('Invalid discount code');
    }

    const discountConfig = JSON.parse(setting.value);

    // Check if code is active and not expired
    if (discountConfig.expiresAt && new Date(discountConfig.expiresAt) < new Date()) {
      throw new BadRequestException('Discount code has expired');
    }

    let additionalDiscount = 0;

    if (discountConfig.type === 'percent') {
      additionalDiscount = cart.subtotal * (discountConfig.value / 100);
    } else if (discountConfig.type === 'fixed') {
      additionalDiscount = Math.min(discountConfig.value, cart.subtotal);
    }

    return {
      ...cart,
      discountCode: code.toUpperCase(),
      discountAmount: cart.discountAmount + additionalDiscount,
      total: cart.total - additionalDiscount,
    };
  }

  /**
   * Get shipping rates for cart
   */
  async getShippingRates(cart: Cart, destinationZip: string) {
    // Free shipping for orders over threshold
    const FREE_SHIPPING_THRESHOLD = 99;

    const rates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: 'FREE & Fast Shipping (3-5 business days)',
        price: cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99,
        estimatedDays: '3-5',
        isFree: cart.subtotal >= FREE_SHIPPING_THRESHOLD,
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '2-Day Express',
        price: 19.99,
        estimatedDays: '1-2',
        isFree: false,
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next Business Day',
        price: 39.99,
        estimatedDays: '1',
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

  private emptyCart(): Cart {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountAmount: 0,
      estimatedShipping: 0,
      estimatedTax: 0,
      total: 0,
    };
  }
}

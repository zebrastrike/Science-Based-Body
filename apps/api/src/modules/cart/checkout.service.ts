import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService, Cart } from './cart.service';
import { ComplianceService } from '../compliance/compliance.service';
import { PaymentsService } from '../payments/payments.service';
import { MailgunService } from '../notifications/mailgun.service';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod } from '@prisma/client';
import { CreateOrderDto, ResolveCartItemDto } from './dto/create-order.dto';

export { CreateOrderDto };

@Injectable()
export class CheckoutService {
  private readonly minimumAge: number;

  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private complianceService: ComplianceService,
    private paymentsService: PaymentsService,
    private mailgunService: MailgunService,
    private config: ConfigService,
  ) {
    this.minimumAge = this.config.get('MINIMUM_AGE', 18);
  }

  /**
   * Initialize checkout session
   */
  async initializeCheckout(
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
  ): Promise<{ cart: Cart; complianceConfig: any; shippingRates: any }> {
    const cart = await this.cartService.validateAndEnrichCart(items);
    const complianceConfig = this.complianceService.getCheckboxConfig();
    const shippingRates = await this.cartService.getShippingRates(cart, '');

    return {
      cart,
      complianceConfig,
      shippingRates,
    };
  }

  /**
   * Create order from checkout
   */
  async createOrder(
    dto: CreateOrderDto,
    userId: string | null,
    ipAddress: string,
    userAgent?: string,
  ) {
    // 1. Validate compliance acknowledgment
    this.validateComplianceCheckboxes(dto.compliance);

    // 2. Validate and enrich cart
    let cart = await this.cartService.validateAndEnrichCart(dto.items);

    // 3. Apply discount code if provided
    if (dto.discountCode) {
      cart = await this.cartService.applyDiscountCode(cart, dto.discountCode);
    }

    // 4. Calculate shipping
    const shippingRates = await this.cartService.getShippingRates(cart, dto.shippingAddress.postalCode);
    const selectedRate = shippingRates.find((r) => r.id === dto.shippingMethod);
    if (!selectedRate) {
      throw new BadRequestException('Invalid shipping method');
    }

    const shippingCost = selectedRate.price;
    const totalAmount = cart.subtotal - cart.discountAmount + shippingCost;

    // 5. Generate order number
    const orderNumber = this.generateOrderNumber();

    // 6. Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create or get user
      let orderUserId = userId;

      if (!orderUserId && dto.guestEmail) {
        // Check if guest email exists
        let guestUser = await tx.user.findUnique({
          where: { email: dto.guestEmail.toLowerCase() },
        });

        if (!guestUser) {
          // Create guest user account
          guestUser = await tx.user.create({
            data: {
              email: dto.guestEmail.toLowerCase(),
              passwordHash: '', // Guest - no password
              status: 'PENDING_VERIFICATION',
            },
          });
        }
        orderUserId = guestUser.id;
      }

      if (!orderUserId) {
        throw new UnauthorizedException('User authentication required');
      }

      // Create shipping address
      const shippingAddr = await tx.address.create({
        data: {
          userId: orderUserId,
          ...dto.shippingAddress,
          isShipping: true,
        },
      });

      // Create billing address
      const billingAddr = dto.sameAsShipping
        ? shippingAddr
        : await tx.address.create({
            data: {
              userId: orderUserId,
              ...(dto.billingAddress || dto.shippingAddress),
              isBilling: true,
              isShipping: false,
            },
          });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: orderUserId,
          status: 'PENDING',
          shippingAddressId: shippingAddr.id,
          billingAddressId: billingAddr.id,
          subtotal: cart.subtotal,
          shippingCost,
          discountAmount: cart.discountAmount,
          totalAmount,
          discountCode: dto.discountCode,
          customerNotes: dto.customerNotes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product!.name,
              variantName: item.variant?.name,
              sku: item.variant?.sku || item.product!.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      // Create compliance acknowledgment
      await tx.complianceAcknowledgment.create({
        data: {
          orderId: newOrder.id,
          userId: orderUserId,
          researchPurposeOnly: dto.compliance.researchPurposeOnly,
          ageConfirmation: dto.compliance.ageConfirmation,
          noHumanConsumption: dto.compliance.noHumanConsumption,
          responsibilityAccepted: dto.compliance.responsibilityAccepted,
          termsAccepted: dto.compliance.termsAccepted,
          ipAddress,
          userAgent,
        },
      });

      // Reserve inventory
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: {
              reservedQuantity: { increment: item.quantity },
            },
          });
        } else {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: {
              reservedQuantity: { increment: item.quantity },
            },
          });
        }
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: orderUserId,
          action: 'CREATE',
          resourceType: 'Order',
          resourceId: newOrder.id,
          ipAddress,
          userAgent,
          metadata: {
            orderNumber,
            totalAmount,
            itemCount: cart.itemCount,
          },
        },
      });

      return newOrder;
    });

    // 7. Create payment
    const email = dto.guestEmail || (await this.getUserEmail(userId!));
    const paymentResult = await this.paymentsService.createPayment(
      order.id,
      dto.paymentMethod,
      totalAmount,
      email,
    );

    // 8. Send order confirmation email to customer
    const orderDetails = {
      orderNumber,
      items: cart.items.map((item) => ({
        name: item.product!.name,
        quantity: item.quantity,
        price: item.unitPrice,
        variant: item.variant?.name,
      })),
      subtotal: cart.subtotal,
      shipping: shippingCost,
      discount: cart.discountAmount,
      total: totalAmount,
      shippingAddress: dto.shippingAddress,
    };

    const firstName = dto.shippingAddress.firstName;

    // Send customer confirmation (non-blocking)
    this.mailgunService
      .sendOrderConfirmation(email, firstName, orderDetails)
      .catch((err) => console.error('Failed to send order confirmation email:', err));

    // 9. Notify admin of new order (non-blocking)
    this.mailgunService
      .notifyAdminNewOrder(orderDetails, email)
      .catch((err) => console.error('Failed to send admin notification:', err));

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount,
        itemCount: cart.itemCount,
      },
      payment: paymentResult,
    };
  }

  /**
   * Validate all compliance checkboxes are checked
   */
  private validateComplianceCheckboxes(compliance: CreateOrderDto['compliance']) {
    const errors: string[] = [];

    if (!compliance.researchPurposeOnly) {
      errors.push('You must confirm products are for research purposes only');
    }
    if (!compliance.ageConfirmation) {
      errors.push(`You must confirm you are ${this.minimumAge} years of age or older`);
    }
    if (!compliance.noHumanConsumption) {
      errors.push('You must acknowledge products are not for human consumption');
    }
    if (!compliance.responsibilityAccepted) {
      errors.push('You must accept responsibility for proper handling');
    }
    if (!compliance.termsAccepted) {
      errors.push('You must accept the Terms of Service');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Compliance requirements not met',
        errors,
      });
    }
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().slice(0, 4).toUpperCase();
    return `SBB-${timestamp}-${random}`;
  }

  /**
   * Get user email by ID
   */
  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  }

  /**
   * Get checkout requirements summary
   */
  getCheckoutRequirements() {
    return {
      minimumAge: this.minimumAge,
      complianceCheckboxes: this.complianceService.getCheckboxConfig(),
      disclaimers: this.complianceService.getDisclaimers(),
      acceptedPaymentMethods: this.paymentsService.getAvailablePaymentMethods(),
      volumeDiscount: this.cartService.getVolumeDiscountInfo(),
      freeShippingThreshold: 500,
      policies: {
        termsOfService: '/policies/terms',
        privacyPolicy: '/policies/privacy',
        refundPolicy: '/policies/refund',
        shippingPolicy: '/policies/shipping',
      },
    };
  }

  /**
   * Resolve cart items from frontend slugs to database IDs
   */
  async resolveCartItems(items: ResolveCartItemDto[]) {
    const resolved: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      productName: string;
      variantName?: string;
      unitPrice: number;
    }> = [];
    const unresolved: Array<{
      cartId: string;
      name: string;
      reason: string;
    }> = [];

    for (const item of items) {
      let product = null;

      // Strategy 1: Exact slug match on cartId
      product = await this.prisma.product.findFirst({
        where: { slug: item.cartId, isActive: true },
        include: { variants: { where: { isActive: true } } },
      });

      // Strategy 2: Strip variant suffix and try slug match
      if (!product) {
        const slugParts = item.cartId.split('-');
        for (let len = slugParts.length - 1; len >= 1; len--) {
          const partialSlug = slugParts.slice(0, len).join('-');
          product = await this.prisma.product.findFirst({
            where: { slug: partialSlug, isActive: true },
            include: { variants: { where: { isActive: true } } },
          });
          if (product) break;
        }
      }

      // Strategy 3: Name match (case-insensitive)
      if (!product) {
        product = await this.prisma.product.findFirst({
          where: {
            name: { equals: item.name, mode: 'insensitive' },
            isActive: true,
          },
          include: { variants: { where: { isActive: true } } },
        });
      }

      if (!product) {
        unresolved.push({
          cartId: item.cartId,
          name: item.name,
          reason: 'Product not found',
        });
        continue;
      }

      // Find variant if specified
      let variant = null;
      if (item.variant && product.variants.length > 0) {
        variant = product.variants.find(
          (v) =>
            v.name.toLowerCase() === item.variant!.toLowerCase() ||
            v.strength?.toLowerCase() === item.variant!.toLowerCase(),
        );
      }

      // If product has variants but none matched, use first variant
      if (!variant && product.variants.length > 0) {
        variant = product.variants[0];
      }

      resolved.push({
        productId: product.id,
        variantId: variant?.id,
        quantity: item.quantity,
        productName: product.name,
        variantName: variant?.name,
        unitPrice: variant ? Number(variant.price) : Number(product.basePrice),
      });
    }

    return { resolvedItems: resolved, unresolvedItems: unresolved };
  }
}

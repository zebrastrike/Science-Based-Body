import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductCategory } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('wholesale')
@Controller('wholesale')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BRAND_PARTNER', 'ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class WholesaleController {
  constructor(
    private catalogService: CatalogService,
    private cartService: CartService,
    private prisma: PrismaService,
  ) {}

  @Get('browse')
  @Roles('BRAND_PARTNER', 'AFFILIATE', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Browse full product catalog (no prices, broker-style)' })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Full catalog without pricing' })
  async browse(
    @Query('category') category?: ProductCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const catalog = await this.catalogService.findAll({
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : 200,
      includeWholesaleOnly: true,
    });

    // Strip all price data — broker-style, sales agent handles pricing
    const products = catalog.products.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      category: product.category,
      subcategory: product.subcategory,
      comingSoon: product.comingSoon,
      hasVariants: product.hasVariants,
      variantCount: product.variantCount,
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        strength: v.strength,
        wholesaleOnly: v.wholesaleOnly,
      })),
      primaryImage: product.primaryImage,
      images: product.images,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      leadTimeDays: product.leadTimeDays,
      isFeatured: product.isFeatured,
    }));

    return {
      products,
      pagination: catalog.pagination,
      filters: { category },
    };
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get wholesale product catalog with partner pricing' })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Wholesale catalog with pricing' })
  @ApiResponse({ status: 403, description: 'Not a brand partner' })
  async getCatalog(
    @Request() req: AuthenticatedRequest,
    @Query('category') category?: ProductCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { priceListId: true },
    });

    if (!user?.priceListId) {
      throw new ForbiddenException('No wholesale pricing assigned to your account');
    }

    const priceList = await this.prisma.priceList.findUnique({
      where: { id: user.priceListId },
      include: { items: true },
    });

    if (!priceList || !priceList.isActive) {
      throw new ForbiddenException('Your wholesale pricing is not currently active');
    }

    // Get full catalog including wholesale-only products
    const catalog = await this.catalogService.findAll({
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      includeWholesaleOnly: true,
    });

    // Build price list item lookup
    const plItems = new Map<string, { customPrice: number | null; discountPercent: number | null }>();
    for (const item of priceList.items) {
      plItems.set(item.productId, {
        customPrice: item.customPrice ? Number(item.customPrice) : null,
        discountPercent: item.discountPercent,
      });
    }

    // Apply wholesale pricing to catalog products
    const wholesaleProducts = catalog.products.map((product: any) => {
      const retailPrice = Number(product.basePrice);
      let wholesalePrice = retailPrice;

      const plItem = plItems.get(product.id);
      if (plItem?.customPrice != null) {
        wholesalePrice = plItem.customPrice;
      } else if (plItem?.discountPercent != null) {
        wholesalePrice = retailPrice * (1 - plItem.discountPercent / 100);
      } else if (priceList.discountPercent != null) {
        wholesalePrice = retailPrice * (1 - priceList.discountPercent / 100);
      }
      wholesalePrice = Math.round(wholesalePrice * 100) / 100;

      return {
        ...product,
        retailPrice,
        wholesalePrice,
        savings: Math.round((retailPrice - wholesalePrice) * 100) / 100,
        savingsPercent: Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100),
      };
    });

    return {
      ...catalog,
      products: wholesaleProducts,
      priceList: {
        name: priceList.name,
        globalDiscount: priceList.discountPercent,
      },
    };
  }

  @Post('cart/validate')
  @ApiOperation({ summary: 'Validate wholesale cart with partner pricing (admin-configurable minimum)' })
  @ApiResponse({ status: 200, description: 'Wholesale cart validated with pricing' })
  @ApiResponse({ status: 400, description: 'Order below minimum' })
  async validateWholesaleCart(
    @Request() req: AuthenticatedRequest,
    @Body() body: { items: Array<{ productId: string; variantId?: string; quantity: number }> },
  ) {
    const result = await this.cartService.validateAndEnrichCart(body.items, req.user.id);

    // Read wholesale minimum from admin-configurable settings (fallback $30K)
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'wholesale_minimum_order' },
    });
    const WHOLESALE_MINIMUM = setting ? Number(setting.value) : 30000;

    const total = result.total ?? result.subtotal ?? 0;
    if (Number(total) < WHOLESALE_MINIMUM) {
      throw new ForbiddenException(
        `Wholesale orders require a minimum of $${WHOLESALE_MINIMUM.toLocaleString()}. Current total: $${Number(total).toLocaleString()}`,
      );
    }

    return result;
  }

  @Get('account')
  @ApiOperation({ summary: 'Get wholesale account info' })
  @ApiResponse({ status: 200, description: 'Wholesale account details' })
  async getAccount(@Request() req: AuthenticatedRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organization: { select: { id: true, name: true, type: true } },
        priceList: {
          select: {
            id: true,
            name: true,
            discountPercent: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Account not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
      },
      organization: user.organization,
      priceList: user.priceList,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductCategory, Prisma } from '@prisma/client';

export type SortOption =
  | 'default'
  | 'popularity'
  | 'rating'
  | 'latest'
  | 'price_low'
  | 'price_high'
  | 'name_asc'
  | 'name_desc';

export interface CatalogFilters {
  category?: ProductCategory;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
  includeWholesaleOnly?: boolean;
}

export interface CatalogOptions extends CatalogFilters {
  page?: number;
  limit?: number;
  sort?: SortOption;
}

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get products with full filtering, sorting, and pagination
   * Matches reference UI: Sort dropdown, price filter, categories
   */
  async findAll(options: CatalogOptions) {
    const {
      category,
      subcategory,
      minPrice,
      maxPrice,
      inStock,
      featured,
      search,
      includeWholesaleOnly = false,
      page = 1,
      limit = 20,
      sort = 'default',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Exclude wholesale-only products from public queries
    if (!includeWholesaleOnly) {
      where.wholesaleOnly = false;
    }

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) {
        where.basePrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.basePrice.lte = maxPrice;
      }
    }

    // Build order by clause
    const orderBy = this.buildOrderBy(sort);

    // Execute query
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' }, take: 3 },
          inventory: true,
        },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Filter by stock if needed (post-query due to relation)
    let filteredProducts = products;
    if (inStock === true) {
      filteredProducts = products.filter(
        (p) => p.inventory && p.inventory.quantity > p.inventory.reservedQuantity,
      );
    }

    // Transform products for frontend
    const transformedProducts = filteredProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      category: product.category,
      subcategory: product.subcategory,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      comingSoon: product.comingSoon,
      // Price range for variant products (exclude wholesale-only variants from public range)
      priceRange: this.getPriceRange(product, !includeWholesaleOnly),
      hasVariants: product.variants.length > 0,
      variantCount: product.variants.length,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        strength: v.strength,
        price: Number(v.price),
        wholesaleOnly: v.wholesaleOnly,
      })),
      primaryImage: product.images[0]?.url || null,
      images: product.images,
      inStock: product.inventory
        ? product.inventory.quantity > product.inventory.reservedQuantity
        : true,
      stockQuantity: product.inventory?.quantity || 0,
      leadTimeDays: product.inventory?.leadTimeDays || null,
      isFeatured: product.isFeatured,
    }));

    return {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        inStock,
        featured,
        search,
      },
      sort,
      availableSorts: this.getAvailableSorts(),
    };
  }

  /**
   * Get bestselling products
   * Based on order count (simplified - would use analytics in production)
   */
  async getBestsellers(limit = 4) {
    // In production, this would aggregate from OrderItem counts
    // For now, use featured products as proxy
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true, wholesaleOnly: false },
      take: limit,
      include: {
        variants: { where: { isActive: true } },
        images: { where: { isPrimary: true } },
        inventory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceRange: this.getPriceRange(p),
      primaryImage: p.images[0]?.url || null,
      hasVariants: p.variants.length > 0,
    }));
  }

  /**
   * Get product by slug with full details
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        batches: {
          where: { isActive: true, coaFileId: { not: null } },
          orderBy: { manufacturingDate: 'desc' },
          take: 1,
        },
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Strip internal fields (costPerUnit) — never expose to public API
    const { costPerUnit: _cpu, ...safeProduct } = product as any;

    return {
      ...safeProduct,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      priceRange: this.getPriceRange(product),
      variants: product.variants.map((v) => {
        const { costPerUnit: _vCpu, ...safeVariant } = v as any;
        return {
          ...safeVariant,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        };
      }),
      currentBatch: product.batches[0] || null,
      inStock: product.inventory
        ? product.inventory.quantity > product.inventory.reservedQuantity
        : true,
      stockQuantity: product.inventory?.quantity || 0,
      leadTimeDays: product.inventory?.leadTimeDays || null,
    };
  }

  /**
   * Get product by ID
   */
  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: true,
        batches: { where: { isActive: true } },
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get all categories with product counts
   */
  async getCategories() {
    const categoryCounts = await this.prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true, wholesaleOnly: false },
      _count: { category: true },
    });

    const categories = Object.values(ProductCategory).map((category) => {
      const count = categoryCounts.find((c) => c.category === category)?._count.category || 0;
      return {
        id: category,
        name: this.formatCategoryName(category),
        slug: category.toLowerCase().replace(/_/g, '-'),
        productCount: count,
      };
    });

    return categories.filter((c) => c.productCount > 0);
  }

  /**
   * Get featured products for homepage
   */
  async getFeatured(limit = 4) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true, wholesaleOnly: false },
      take: limit,
      include: {
        images: { where: { isPrimary: true } },
        variants: { where: { isActive: true } },
        inventory: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      priceRange: this.getPriceRange(p),
      primaryImage: p.images[0]?.url || null,
      hasVariants: p.variants.length > 0,
      inStock: p.inventory ? p.inventory.quantity > 0 : true,
    }));
  }

  /**
   * Search products
   */
  async search(query: string, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        wholesaleOnly: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { casNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.images[0]?.url || null,
    }));
  }

  /**
   * Get related products for a product (accepts slug or ID)
   */
  async getRelatedProducts(slugOrId: string, limit = 4) {
    // Try slug first (controller passes slug from URL), fall back to ID
    let product = await this.prisma.product.findUnique({
      where: { slug: slugOrId },
      select: { id: true, category: true },
    });

    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { id: slugOrId },
        select: { id: true, category: true },
      });
    }

    if (!product) {
      return [];
    }

    const related = await this.prisma.product.findMany({
      where: {
        isActive: true,
        wholesaleOnly: false,
        category: product.category,
        id: { not: product.id },
      },
      take: limit,
      include: {
        images: { where: { isPrimary: true } },
        variants: { where: { isActive: true } },
      },
    });

    return related.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceRange: this.getPriceRange(p),
      primaryImage: p.images[0]?.url || null,
      hasVariants: p.variants.length > 0,
    }));
  }

  /**
   * Get price range for products page
   */
  async getPriceRangeFilter() {
    const result = await this.prisma.product.aggregate({
      where: { isActive: true },
      _min: { basePrice: true },
      _max: { basePrice: true },
    });

    return {
      min: Number(result._min.basePrice) || 0,
      max: Number(result._max.basePrice) || 1000,
    };
  }

  // ========== Helper Methods ==========

  private getPriceRange(product: any, excludeWholesale = false): { min: number; max: number } | null {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    let variants = product.variants;
    if (excludeWholesale) {
      variants = variants.filter((v: any) => !v.wholesaleOnly);
      if (variants.length === 0) return null;
    }

    const prices = variants.map((v: any) => Number(v.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  private buildOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'latest':
        return [{ createdAt: 'desc' }];
      case 'price_low':
        return [{ basePrice: 'asc' }];
      case 'price_high':
        return [{ basePrice: 'desc' }];
      case 'name_asc':
        return [{ name: 'asc' }];
      case 'name_desc':
        return [{ name: 'desc' }];
      case 'popularity':
        // Would use order count in production
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
      case 'rating':
        // Would use review ratings in production
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
      default:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }

  private getAvailableSorts() {
    return [
      { id: 'default', label: 'Default sorting' },
      { id: 'popularity', label: 'Sort by popularity' },
      { id: 'rating', label: 'Sort by average rating' },
      { id: 'latest', label: 'Sort by latest' },
      { id: 'price_low', label: 'Sort by price: low to high' },
      { id: 'price_high', label: 'Sort by price: high to low' },
    ];
  }

  private formatCategoryName(category: string): string {
    return category
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}

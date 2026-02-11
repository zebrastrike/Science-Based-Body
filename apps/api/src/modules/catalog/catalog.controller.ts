import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CatalogService, SortOption } from './catalog.service';
import { Public } from '../auth/decorators/public.decorator';
import { ProductCategory } from '@prisma/client';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Get all products with filtering and sorting' })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['default', 'popularity', 'rating', 'latest', 'price_low', 'price_high', 'name_asc', 'name_desc'],
    description: 'Sort order',
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filter to in-stock only' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  findAll(
    @Query('category') category?: ProductCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('featured') featured?: boolean,
    @Query('sort') sort?: SortOption,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
  ) {
    return this.catalogService.findAll({
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      featured: featured !== undefined ? (featured === true || featured === 'true' as any) : undefined,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock !== undefined ? (inStock === true || inStock === 'true' as any) : undefined,
    });
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products by name or description' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 10)' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.search(query, limit ? Number(limit) : undefined);
  }

  @Get('bestsellers')
  @Public()
  @ApiOperation({ summary: 'Get bestselling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 4)' })
  @ApiResponse({ status: 200, description: 'Bestselling products' })
  getBestsellers(@Query('limit') limit?: number) {
    return this.catalogService.getBestsellers(limit ? Number(limit) : undefined);
  }

  @Get('price-range')
  @Public()
  @ApiOperation({ summary: 'Get min/max price range for filters' })
  @ApiResponse({ status: 200, description: 'Price range data' })
  getPriceRange() {
    return this.catalogService.getPriceRangeFilter();
  }

  @Get('products/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiParam({ name: 'slug', description: 'Product URL slug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.catalogService.findBySlug(slug);
  }

  @Get('products/:slug/related')
  @Public()
  @ApiOperation({ summary: 'Get related products' })
  @ApiParam({ name: 'slug', description: 'Product URL slug' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 4)' })
  @ApiResponse({ status: 200, description: 'Related products' })
  getRelatedProducts(
    @Param('slug') slug: string,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.getRelatedProducts(slug, limit ? Number(limit) : undefined);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Category list' })
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 8)' })
  @ApiResponse({ status: 200, description: 'Featured products' })
  getFeatured(@Query('limit') limit?: number) {
    return this.catalogService.getFeatured(limit ? Number(limit) : undefined);
  }
}

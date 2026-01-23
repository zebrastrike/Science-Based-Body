import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, UserStatus, ProductCategory } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/recent-orders')
  @ApiOperation({ summary: 'Get recent orders for dashboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent orders' })
  getRecentOrders(@Query('limit') limit?: number) {
    return this.adminService.getRecentOrders(limit ? Number(limit) : undefined);
  }

  // ==========================================================================
  // ORDERS
  // ==========================================================================

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getOrders({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; notes?: string },
  ) {
    return this.adminService.updateOrderStatus(id, body.status, req.user.id, body.notes);
  }

  // ==========================================================================
  // PRODUCTS
  // ==========================================================================

  @Get('products')
  @ApiOperation({ summary: 'Get all products with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: ProductCategory,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.adminService.getProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
      search,
      isActive: isActive === true || isActive === 'true' as any,
    });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  createProduct(
    @Request() req,
    @Body()
    body: {
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
  ) {
    return this.adminService.createProduct(body, req.user.id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body()
    body: {
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
  ) {
    return this.adminService.updateProduct(id, body, req.user.id);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete (deactivate) product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  deleteProduct(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteProduct(id, req.user.id);
  }

  // ==========================================================================
  // USERS
  // ==========================================================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      status,
      search,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: UserStatus; reason?: string },
  ) {
    return this.adminService.updateUserStatus(id, body.status, req.user.id, body.reason);
  }

  // ==========================================================================
  // INVENTORY
  // ==========================================================================

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Low stock products' })
  getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.adminService.getLowStockProducts(threshold ? Number(threshold) : undefined);
  }

  @Put('inventory/:productId')
  @ApiOperation({ summary: 'Update inventory quantity' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'variantId', required: false, description: 'Variant ID if updating variant' })
  @ApiResponse({ status: 200, description: 'Inventory updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateInventory(
    @Request() req,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
    @Body() body?: { quantity: number; notes?: string },
  ) {
    return this.adminService.updateInventory(
      productId,
      variantId || null,
      body.quantity,
      req.user.id,
      body.notes,
    );
  }
}

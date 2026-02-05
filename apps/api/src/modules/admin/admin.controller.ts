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
import { OrderStatus, UserStatus, ProductCategory, DiscountType, DiscountStatus, ReturnStatus } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
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
  deleteProduct(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() body: { quantity: number; notes?: string },
    @Query('variantId') variantId?: string,
  ) {
    return this.adminService.updateInventory(
      productId,
      variantId || null,
      body.quantity,
      req.user.id,
      body.notes,
    );
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiQuery({ name: 'period', required: false, description: '7d, 30d, 90d, or custom' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  getAnalytics(
    @Query('period') period?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getAnalytics({
      period,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('analytics/top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Top products' })
  getTopProducts(
    @Query('limit') limit?: number,
    @Query('period') period?: string,
  ) {
    return this.adminService.getTopProducts(limit ? Number(limit) : 10, period);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue breakdown' })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Revenue data' })
  getRevenueAnalytics(@Query('period') period?: string) {
    return this.adminService.getRevenueAnalytics(period);
  }

  // ==========================================================================
  // DISCOUNTS
  // ==========================================================================

  @Get('discounts')
  @ApiOperation({ summary: 'Get all discount codes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DiscountStatus })
  @ApiResponse({ status: 200, description: 'Discount list' })
  getDiscounts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DiscountStatus,
  ) {
    return this.adminService.getDiscounts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('discounts/:id')
  @ApiOperation({ summary: 'Get discount details' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount details' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  getDiscountById(@Param('id') id: string) {
    return this.adminService.getDiscountById(id);
  }

  @Post('discounts')
  @ApiOperation({ summary: 'Create discount code' })
  @ApiResponse({ status: 201, description: 'Discount created' })
  createDiscount(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      code: string;
      description?: string;
      type: DiscountType;
      value: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      perUserLimit?: number;
      startsAt?: string;
      expiresAt?: string;
      productIds?: string[];
      categoryIds?: string[];
    },
  ) {
    return this.adminService.createDiscount(body, req.user.id);
  }

  @Put('discounts/:id')
  @ApiOperation({ summary: 'Update discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  updateDiscount(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      description?: string;
      value?: number;
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      perUserLimit?: number;
      status?: DiscountStatus;
      expiresAt?: string;
    },
  ) {
    return this.adminService.updateDiscount(id, body, req.user.id);
  }

  @Delete('discounts/:id')
  @ApiOperation({ summary: 'Deactivate discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount deactivated' })
  deleteDiscount(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteDiscount(id, req.user.id);
  }

  // ==========================================================================
  // RETURNS
  // ==========================================================================

  @Get('returns')
  @ApiOperation({ summary: 'Get all returns' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ReturnStatus })
  @ApiResponse({ status: 200, description: 'Returns list' })
  getReturns(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ReturnStatus,
  ) {
    return this.adminService.getReturns({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get return details' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  @ApiResponse({ status: 200, description: 'Return details' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  getReturnById(@Param('id') id: string) {
    return this.adminService.getReturnById(id);
  }

  @Put('returns/:id/approve')
  @ApiOperation({ summary: 'Approve return request' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  @ApiResponse({ status: 200, description: 'Return approved' })
  approveReturn(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { refundAmount: number; adminNotes?: string },
  ) {
    return this.adminService.approveReturn(id, body.refundAmount, req.user.id, body.adminNotes);
  }

  @Put('returns/:id/reject')
  @ApiOperation({ summary: 'Reject return request' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  @ApiResponse({ status: 200, description: 'Return rejected' })
  rejectReturn(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
  ) {
    return this.adminService.rejectReturn(id, body.rejectionReason, req.user.id);
  }

  @Put('returns/:id/complete')
  @ApiOperation({ summary: 'Mark return as completed (refund issued)' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  @ApiResponse({ status: 200, description: 'Return completed' })
  completeReturn(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { refundReference?: string; refundMethod?: string },
  ) {
    return this.adminService.completeReturn(id, req.user.id, body.refundReference, body.refundMethod);
  }

  // ==========================================================================
  // AUDIT LOG
  // ==========================================================================

  @Get('audit-log')
  @ApiOperation({ summary: 'Get audit log entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'adminId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  getAuditLog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('adminId') adminId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getAuditLog({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      action,
      resourceType,
      adminId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  @Get('settings')
  @ApiOperation({ summary: 'Get all settings' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category prefix' })
  @ApiResponse({ status: 200, description: 'Settings list' })
  getSettings(@Query('category') category?: string) {
    return this.adminService.getSettings(category);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting value' })
  getSettingByKey(@Param('key') key: string) {
    return this.adminService.getSettingByKey(key);
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  updateSetting(
    @Request() req: AuthenticatedRequest,
    @Param('key') key: string,
    @Body() body: { value: string; type?: string; description?: string },
  ) {
    return this.adminService.updateSetting(key, body, req.user.id);
  }

  @Post('settings/bulk')
  @ApiOperation({ summary: 'Update multiple settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  updateSettingsBulk(
    @Request() req: AuthenticatedRequest,
    @Body() body: { settings: Array<{ key: string; value: string }> },
  ) {
    return this.adminService.updateSettingsBulk(body.settings, req.user.id);
  }

  // ==========================================================================
  // SHIPPING (Recent Shipments)
  // ==========================================================================

  @Get('shipping/recent')
  @ApiOperation({ summary: 'Get recent shipments' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent shipments' })
  getRecentShipments(@Query('limit') limit?: number) {
    return this.adminService.getRecentShipments(limit ? Number(limit) : 20);
  }
}

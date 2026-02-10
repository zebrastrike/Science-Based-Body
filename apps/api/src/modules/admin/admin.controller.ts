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

  @Post('orders/:id/resend-confirmation')
  @ApiOperation({ summary: 'Resend order confirmation email to customer' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  resendOrderConfirmation(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.resendOrderConfirmation(id, req.user.id);
  }

  @Post('orders/:id/resend-shipping')
  @ApiOperation({ summary: 'Resend shipping notification email to customer' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Order not shipped yet' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  resendShippingNotification(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.resendShippingNotification(id, req.user.id);
  }

  @Post('orders/:id/resend-delivery')
  @ApiOperation({ summary: 'Resend delivery notification email to customer' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Order not delivered yet' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  resendDeliveryNotification(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.resendDeliveryNotification(id, req.user.id);
  }

  // ==========================================================================
  // ORDER FULFILLMENT (Shippo + Manual Payment Approval)
  // ==========================================================================

  @Post('orders/:id/approve-payment')
  @ApiOperation({ summary: 'Approve Zelle/Venmo payment for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment approved' })
  @ApiResponse({ status: 400, description: 'Payment already verified or no payment found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  approvePayment(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.approvePayment(id, req.user.id, body?.notes);
  }

  @Get('orders/:id/shipping-rates')
  @ApiOperation({ summary: 'Get live Shippo shipping rates for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Shipping rates from Shippo' })
  @ApiResponse({ status: 400, description: 'Order has no shipping address' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getShippingRates(@Param('id') id: string) {
    return this.adminService.getShippingRates(id);
  }

  @Post('orders/:id/create-label')
  @ApiOperation({ summary: 'Create Shippo shipping label for a selected rate' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Label created with tracking info' })
  @ApiResponse({ status: 400, description: 'Label creation failed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  createShippingLabel(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { rateId: string },
  ) {
    return this.adminService.createShippingLabel(id, body.rateId, req.user.id);
  }

  @Post('orders/:id/fulfill')
  @ApiOperation({ summary: 'One-click fulfillment: approve payment + cheapest rate + label' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order fully fulfilled' })
  @ApiResponse({ status: 400, description: 'Fulfillment step failed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  fulfillOrder(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.fulfillOrder(id, req.user.id, body?.notes);
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

  @Post('discounts/expire')
  @ApiOperation({ summary: 'Auto-expire discounts past their expiry date' })
  @ApiResponse({ status: 200, description: 'Number of expired discounts' })
  expireDiscounts() {
    return this.adminService.expireDiscounts();
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
  // PRICE LISTS (Wholesale)
  // ==========================================================================

  @Get('price-lists')
  @ApiOperation({ summary: 'Get all price lists' })
  @ApiResponse({ status: 200, description: 'Price list data' })
  getPriceLists() {
    return this.adminService.getPriceLists();
  }

  @Get('price-lists/:id')
  @ApiOperation({ summary: 'Get price list details with items' })
  @ApiParam({ name: 'id', description: 'PriceList ID' })
  @ApiResponse({ status: 200, description: 'Price list details' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  getPriceListById(@Param('id') id: string) {
    return this.adminService.getPriceListById(id);
  }

  @Post('price-lists')
  @ApiOperation({ summary: 'Create price list' })
  @ApiResponse({ status: 201, description: 'Price list created' })
  createPriceList(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      description?: string;
      discountPercent?: number;
      organizationId?: string;
    },
  ) {
    return this.adminService.createPriceList(body, req.user.id);
  }

  @Put('price-lists/:id')
  @ApiOperation({ summary: 'Update price list' })
  @ApiParam({ name: 'id', description: 'PriceList ID' })
  @ApiResponse({ status: 200, description: 'Price list updated' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  updatePriceList(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      discountPercent?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updatePriceList(id, body, req.user.id);
  }

  @Post('price-lists/:id/items')
  @ApiOperation({ summary: 'Add or update product pricing in price list' })
  @ApiParam({ name: 'id', description: 'PriceList ID' })
  @ApiResponse({ status: 200, description: 'Price list item saved' })
  upsertPriceListItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      productId: string;
      customPrice?: number;
      discountPercent?: number;
    },
  ) {
    return this.adminService.upsertPriceListItem(id, body, req.user.id);
  }

  @Delete('price-lists/:id/items/:itemId')
  @ApiOperation({ summary: 'Remove product from price list' })
  @ApiParam({ name: 'id', description: 'PriceList ID' })
  @ApiParam({ name: 'itemId', description: 'PriceListItem ID' })
  @ApiResponse({ status: 200, description: 'Price list item removed' })
  deletePriceListItem(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.adminService.deletePriceListItem(id, itemId, req.user.id);
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

  // ==========================================================================
  // MARKETING POPUPS
  // ==========================================================================

  @Get('popups')
  @ApiOperation({ summary: 'List all marketing popups' })
  @ApiResponse({ status: 200, description: 'Marketing popups list' })
  getPopups() {
    return this.adminService.getPopups();
  }

  @Get('popups/:id')
  @ApiOperation({ summary: 'Get marketing popup by ID' })
  @ApiParam({ name: 'id', description: 'Popup ID' })
  @ApiResponse({ status: 200, description: 'Marketing popup details' })
  getPopupById(@Param('id') id: string) {
    return this.adminService.getPopupById(id);
  }

  @Post('popups')
  @ApiOperation({ summary: 'Create a new marketing popup' })
  @ApiResponse({ status: 201, description: 'Marketing popup created' })
  createPopup(
    @Request() req: AuthenticatedRequest,
    @Body() body: {
      name: string;
      headline: string;
      subtitle?: string;
      bodyHtml?: string;
      ctaText?: string;
      ctaLink?: string;
      discountCode?: string;
      discountCode2?: string;
      tier1Label?: string;
      tier1Value?: string;
      tier2Label?: string;
      tier2Value?: string;
      showEmailCapture?: boolean;
      successHeadline?: string;
      successMessage?: string;
      delayMs?: number;
      showOnPages?: string[];
      showFrequency?: string;
      startsAt?: string;
      expiresAt?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.createPopup(body, req.user.id);
  }

  @Put('popups/:id')
  @ApiOperation({ summary: 'Update a marketing popup' })
  @ApiParam({ name: 'id', description: 'Popup ID' })
  @ApiResponse({ status: 200, description: 'Marketing popup updated' })
  updatePopup(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.adminService.updatePopup(id, body, req.user.id);
  }

  @Delete('popups/:id')
  @ApiOperation({ summary: 'Delete a marketing popup' })
  @ApiParam({ name: 'id', description: 'Popup ID' })
  @ApiResponse({ status: 200, description: 'Marketing popup deleted' })
  deletePopup(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.deletePopup(id, req.user.id);
  }

  @Post('popups/:id/toggle')
  @ApiOperation({ summary: 'Toggle popup active/inactive' })
  @ApiParam({ name: 'id', description: 'Popup ID' })
  @ApiResponse({ status: 200, description: 'Popup toggled' })
  togglePopup(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.adminService.togglePopup(id, req.user.id);
  }
}

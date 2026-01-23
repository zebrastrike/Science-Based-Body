import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('shipping')
@ApiBearerAuth()
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get('rates/:orderId')
  @ApiOperation({ summary: 'Get shipping rates for an order' })
  getRates(@Param('orderId') orderId: string) {
    return this.shippingService.getShippingRates(orderId);
  }

  @Post('create')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create shipment and label' })
  createShipment(
    @Body() body: { orderId: string; rateId: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.shippingService.createShipment(body.orderId, body.rateId, adminId);
  }

  @Get('track/:carrier/:trackingNumber')
  @ApiOperation({ summary: 'Track a shipment' })
  track(
    @Param('carrier') carrier: string,
    @Param('trackingNumber') trackingNumber: string,
  ) {
    return this.shippingService.trackShipment(trackingNumber, carrier);
  }
}

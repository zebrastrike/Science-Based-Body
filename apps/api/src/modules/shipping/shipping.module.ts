import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippoService } from './shippo.service';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService, ShippoService],
  exports: [ShippingService, ShippoService],
})
export class ShippingModule {}

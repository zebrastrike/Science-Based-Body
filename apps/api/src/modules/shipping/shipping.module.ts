import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippoService } from './shippo.service';
import { EasyPostService } from './easypost.service';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingService,
    EasyPostService,
    // Alias: any injection of ShippoService resolves to EasyPostService
    { provide: ShippoService, useExisting: EasyPostService },
  ],
  exports: [ShippingService, ShippoService, EasyPostService],
})
export class ShippingModule {}

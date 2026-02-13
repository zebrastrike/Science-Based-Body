import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { EasyPostService } from './easypost.service';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService, EasyPostService],
  exports: [ShippingService, EasyPostService],
})
export class ShippingModule {}

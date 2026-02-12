import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { KpiService } from './kpi.service';
import { OrdersModule } from '../orders/orders.module';
import { ShippingModule } from '../shipping/shipping.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    ShippingModule,
    PaymentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, KpiService],
  exports: [AdminService, KpiService],
})
export class AdminModule {}

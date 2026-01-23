import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { ComplianceModule } from '../compliance/compliance.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ComplianceModule, PaymentsModule, NotificationsModule],
  controllers: [CartController, CheckoutController],
  providers: [CartService, CheckoutService],
  exports: [CartService, CheckoutService],
})
export class CartModule {}

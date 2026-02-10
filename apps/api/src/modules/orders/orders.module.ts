import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ComplianceModule } from '../compliance/compliance.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ComplianceModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

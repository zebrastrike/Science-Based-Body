import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { EpicorPropelloService } from './epicor-propello.service';
import { PaymentLinksService } from './payment-links.service';
import {
  AdminPaymentLinksController,
  PublicPaymentLinksController,
} from './payment-links.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [ConfigModule, FilesModule],
  controllers: [PaymentsController, AdminPaymentLinksController, PublicPaymentLinksController],
  providers: [PaymentsService, EpicorPropelloService, PaymentLinksService],
  exports: [PaymentsService, EpicorPropelloService, PaymentLinksService],
})
export class PaymentsModule {}

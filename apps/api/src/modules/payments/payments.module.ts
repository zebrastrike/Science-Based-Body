import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { EpicorPropelloService } from './epicor-propello.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [ConfigModule, FilesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, EpicorPropelloService],
  exports: [PaymentsService, EpicorPropelloService],
})
export class PaymentsModule {}

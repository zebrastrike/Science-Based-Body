import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController, AdminPartnersController } from './partners.controller';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [FilesModule, NotificationsModule],
  controllers: [PartnersController, AdminPartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}

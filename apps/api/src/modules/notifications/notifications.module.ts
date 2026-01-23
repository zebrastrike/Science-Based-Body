import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailgunService } from './mailgun.service';
import { EmailTemplatesService } from './email-templates.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailTemplatesService, MailgunService],
  exports: [MailgunService],
})
export class NotificationsModule {}

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailgunService } from './mailgun.service';
import { ResendService } from './resend.service';
import { EmailTemplatesService } from './email-templates.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailTemplatesService, MailgunService, ResendService],
  exports: [MailgunService, ResendService],
})
export class NotificationsModule {}

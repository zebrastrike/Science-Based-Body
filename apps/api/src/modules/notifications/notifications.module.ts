import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmtpService } from './smtp.service';
import { EmailTemplatesService } from './email-templates.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    EmailTemplatesService,
    SmtpService,
  ],
  exports: [SmtpService, EmailTemplatesService],
})
export class NotificationsModule {}

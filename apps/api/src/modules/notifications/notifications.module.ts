import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailgunService } from './mailgun.service';
import { SmtpService } from './smtp.service';
import { ResendService } from './resend.service';
import { EmailTemplatesService } from './email-templates.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    EmailTemplatesService,
    SmtpService,
    // Alias SmtpService as MailgunService so all existing imports work
    { provide: MailgunService, useExisting: SmtpService },
    ResendService,
  ],
  exports: [SmtpService, MailgunService, ResendService],
})
export class NotificationsModule {}

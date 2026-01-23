import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from './email-templates.service';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
}

@Injectable()
export class MailgunService {
  private readonly logger = new Logger(MailgunService.name);
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly adminEmail: string;
  private readonly isEnabled: boolean;

  constructor(
    private config: ConfigService,
    private templates: EmailTemplatesService,
  ) {
    this.apiKey = this.config.get('MAILGUN_API_KEY', '');
    this.domain = this.config.get('MAILGUN_DOMAIN', '');
    this.fromEmail = this.config.get('MAILGUN_FROM_EMAIL', 'noreply@sciencebasedbody.com');
    this.fromName = this.config.get('MAILGUN_FROM_NAME', 'Science Based Body');
    this.adminEmail = this.config.get('ADMIN_EMAIL', 'admin@sciencebasedbody.com');
    this.isEnabled = !!this.apiKey && !!this.domain;

    if (!this.isEnabled) {
      this.logger.warn('Mailgun is not configured - emails will be logged only');
    }
  }

  // ===========================================================================
  // CORE EMAIL SENDING
  // ===========================================================================

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const { to, subject, html, text, replyTo, tags } = options;
    const recipients = Array.isArray(to) ? to : [to];

    if (!this.isEnabled) {
      this.logger.log(`[DEV] Email would be sent to: ${recipients.join(', ')}`);
      this.logger.log(`[DEV] Subject: ${subject}`);
      return { success: true, id: 'dev-mode' };
    }

    try {
      const formData = new FormData();
      formData.append('from', `${this.fromName} <${this.fromEmail}>`);
      recipients.forEach(r => formData.append('to', r));
      formData.append('subject', subject);
      formData.append('html', html);
      if (text) formData.append('text', text);
      if (replyTo) formData.append('h:Reply-To', replyTo);
      if (tags) tags.forEach(tag => formData.append('o:tag', tag));

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        this.logger.error(`Mailgun error: ${JSON.stringify(result)}`);
        return { success: false, error: result.message || 'Failed to send email' };
      }

      this.logger.log(`Email sent to ${recipients.join(', ')}: ${result.id}`);
      return { success: true, id: result.id };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // ===========================================================================
  // ACCOUNT EMAILS
  // ===========================================================================

  async sendWelcomeEmail(to: string, firstName: string) {
    const { subject, html, text } = this.templates.welcomeEmail(firstName);
    return this.sendEmail({ to, subject, html, text, tags: ['welcome', 'account'] });
  }

  async sendEmailVerification(to: string, firstName: string, verificationToken: string) {
    const verificationUrl = `https://sciencebasedbody.com/verify-email?token=${verificationToken}`;
    const { subject, html, text } = this.templates.emailVerification(firstName, verificationUrl);
    return this.sendEmail({ to, subject, html, text, tags: ['verification', 'account'] });
  }

  async sendPasswordReset(to: string, firstName: string, resetToken: string) {
    const resetUrl = `https://sciencebasedbody.com/reset-password?token=${resetToken}`;
    const { subject, html, text } = this.templates.passwordReset(firstName, resetUrl);
    return this.sendEmail({ to, subject, html, text, tags: ['password-reset', 'account'] });
  }

  // ===========================================================================
  // ORDER EMAILS
  // ===========================================================================

  async sendOrderConfirmation(to: string, firstName: string, orderDetails: any) {
    const { subject, html, text } = this.templates.orderConfirmation(firstName, orderDetails);
    return this.sendEmail({ to, subject, html, text, tags: ['order', 'confirmation'] });
  }

  async sendOrderShipped(
    to: string,
    firstName: string,
    orderNumber: string,
    trackingNumber: string,
    trackingUrl: string,
    carrier: string,
  ) {
    const { subject, html, text } = this.templates.orderShipped(
      firstName,
      orderNumber,
      trackingNumber,
      trackingUrl,
      carrier,
    );
    return this.sendEmail({ to, subject, html, text, tags: ['order', 'shipped'] });
  }

  async sendOrderDelivered(to: string, firstName: string, orderNumber: string) {
    const { subject, html, text } = this.templates.orderDelivered(firstName, orderNumber);
    return this.sendEmail({ to, subject, html, text, tags: ['order', 'delivered'] });
  }

  // ===========================================================================
  // ADMIN NOTIFICATIONS
  // ===========================================================================

  async notifyAdminNewOrder(orderDetails: any, customerEmail: string) {
    const { subject, html, text } = this.templates.adminNewOrder(orderDetails, customerEmail);
    return this.sendEmail({
      to: this.adminEmail,
      subject,
      html,
      text,
      tags: ['admin', 'new-order'],
    });
  }

  async notifyAdminLowStock(productName: string, sku: string, currentStock: number, threshold: number) {
    const { subject, html, text } = this.templates.adminLowStock(productName, sku, currentStock, threshold);
    return this.sendEmail({
      to: this.adminEmail,
      subject,
      html,
      text,
      tags: ['admin', 'low-stock'],
    });
  }

  // ===========================================================================
  // CONTACT & SUPPORT
  // ===========================================================================

  async sendContactFormToAdmin(name: string, email: string, subject: string, message: string, type?: string) {
    const template = this.templates.contactFormReceived(name, email, subject, message, type);
    return this.sendEmail({
      to: this.adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: email,
      tags: ['contact', type || 'general'],
    });
  }

  async sendContactFormConfirmation(to: string, firstName: string) {
    const { subject, html, text } = this.templates.contactFormConfirmation(firstName);
    return this.sendEmail({ to, subject, html, text, tags: ['contact', 'confirmation'] });
  }

  // ===========================================================================
  // NEWSLETTER
  // ===========================================================================

  async sendNewsletterWelcome(to: string) {
    const { subject, html, text } = this.templates.newsletterWelcome(to);
    return this.sendEmail({ to, subject, html, text, tags: ['newsletter', 'welcome'] });
  }
}

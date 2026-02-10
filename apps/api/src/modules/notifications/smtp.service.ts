import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplatesService } from './email-templates.service';

interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
  attachments?: Attachment[];
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly adminEmail: string;
  private readonly isEnabled: boolean;
  private readonly testEmailRedirect: string;
  private readonly testEmailDomains = ['@test.com', '@example.com', '@test.local'];

  constructor(
    private config: ConfigService,
    private templates: EmailTemplatesService,
  ) {
    const host = this.config.get('SMTP_HOST', 'smtp.gmail.com');
    const port = this.config.get('SMTP_PORT', 587);
    const user = this.config.get('SMTP_USER', '');
    const pass = this.config.get('SMTP_PASS', '');
    this.fromEmail = this.config.get('SMTP_FROM_EMAIL', 'noreply@sbbpeptides.com');
    this.fromName = this.config.get('SMTP_FROM_NAME', 'Science Based Body');
    this.adminEmail = this.config.get('ADMIN_EMAIL', 'sales@sbbpeptides.com');
    this.testEmailRedirect = this.config.get('TEST_EMAIL_REDIRECT', '');
    this.isEnabled = !!user && !!pass;

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    if (!this.isEnabled) {
      this.logger.warn('SMTP is not configured - emails will be logged only');
    } else {
      this.logger.log(`SMTP configured: ${host}:${port} as ${user}`);
    }
  }

  // ===========================================================================
  // CORE EMAIL SENDING
  // ===========================================================================

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const { to, subject, html, text, replyTo, attachments } = options;
    let recipients = Array.isArray(to) ? to : [to];

    // Redirect test account emails to the configured test inbox
    if (this.testEmailRedirect) {
      const redirected = recipients.some((r) =>
        this.testEmailDomains.some((d) => r.toLowerCase().endsWith(d)),
      );
      if (redirected) {
        this.logger.log(`[TEST] Redirecting email for ${recipients.join(', ')} → ${this.testEmailRedirect}`);
        recipients = [this.testEmailRedirect];
      }
    }

    if (!this.isEnabled) {
      this.logger.log(`[DEV] Email would be sent to: ${recipients.join(', ')}`);
      this.logger.log(`[DEV] Subject: ${subject}`);
      return { success: true, id: 'dev-mode' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipients.join(', '),
        subject,
        html,
        text,
        replyTo,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      this.logger.log(`Email sent to ${recipients.join(', ')}: ${info.messageId}`);
      return { success: true, id: info.messageId };
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

  async sendPaymentConfirmed(to: string, firstName: string, orderNumber: string, amount: number) {
    const { subject, html, text } = this.templates.paymentConfirmed(firstName, orderNumber, amount);
    return this.sendEmail({ to, subject, html, text, tags: ['order', 'payment-confirmed'] });
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
  // RETURNS & REFUNDS
  // ===========================================================================

  async sendReturnApproved(
    to: string,
    firstName: string,
    orderNumber: string,
    refundAmount: number,
  ) {
    const { subject, html, text } = this.templates.returnApproved(
      firstName,
      orderNumber,
      refundAmount,
    );
    return this.sendEmail({ to, subject, html, text, tags: ['return', 'approved'] });
  }

  async sendReturnRejected(
    to: string,
    firstName: string,
    orderNumber: string,
    reason: string,
  ) {
    const { subject, html, text } = this.templates.returnRejected(
      firstName,
      orderNumber,
      reason,
    );
    return this.sendEmail({ to, subject, html, text, tags: ['return', 'rejected'] });
  }

  async sendReturnReceived(
    to: string,
    firstName: string,
    orderNumber: string,
  ) {
    const { subject, html, text } = this.templates.returnReceived(
      firstName,
      orderNumber,
    );
    return this.sendEmail({ to, subject, html, text, tags: ['return', 'received'] });
  }

  async sendRefundIssued(
    to: string,
    firstName: string,
    orderNumber: string,
    refundAmount: number,
    refundMethod: string,
  ) {
    const { subject, html, text } = this.templates.refundIssued(
      firstName,
      orderNumber,
      refundAmount,
      refundMethod,
    );
    return this.sendEmail({ to, subject, html, text, tags: ['refund', 'issued'] });
  }

  async notifyAdminReturnRequest(
    orderNumber: string,
    customerEmail: string,
    reason: string,
    items: Array<{ name: string; quantity: number }>,
  ) {
    const { subject, html, text } = this.templates.adminReturnRequest(
      orderNumber,
      customerEmail,
      reason,
      items,
    );
    return this.sendEmail({
      to: this.adminEmail,
      subject,
      html,
      text,
      tags: ['admin', 'return-request'],
    });
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

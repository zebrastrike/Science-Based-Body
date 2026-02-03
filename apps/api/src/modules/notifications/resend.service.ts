import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

interface PaymentLinkEmailData {
  customerName?: string;
  customerEmail: string;
  amount: number;
  paymentUrl: string;
  orderNumber?: string;
  expiresAt: Date;
  paymentMethods: string[];
  notes?: string;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('RESEND_API_KEY', '');
    this.fromEmail = this.config.get('RESEND_FROM_EMAIL', 'noreply@sciencebasedbody.com');
    this.fromName = this.config.get('RESEND_FROM_NAME', 'Science Based Body');
    this.isEnabled = !!this.apiKey;

    if (!this.isEnabled) {
      this.logger.warn('Resend is not configured - payment link emails will be logged only');
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
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: recipients,
          subject,
          html,
          text,
          reply_to: replyTo,
          tags,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error(`Resend error: ${JSON.stringify(result)}`);
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
  // PAYMENT LINK EMAILS
  // ===========================================================================

  async sendPaymentLinkEmail(data: PaymentLinkEmailData): Promise<{ success: boolean; id?: string; error?: string }> {
    const { customerName, customerEmail, amount, paymentUrl, orderNumber, expiresAt, paymentMethods, notes } = data;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    const expiresFormatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(expiresAt);

    const subject = orderNumber
      ? `Payment Link for Order ${orderNumber} - ${formattedAmount}`
      : `Your Payment Link - ${formattedAmount}`;

    const html = this.generatePaymentLinkEmailHtml({
      customerName: customerName || 'Valued Customer',
      amount: formattedAmount,
      paymentUrl,
      orderNumber,
      expiresFormatted,
      paymentMethods,
      notes,
    });

    const text = this.generatePaymentLinkEmailText({
      customerName: customerName || 'Valued Customer',
      amount: formattedAmount,
      paymentUrl,
      orderNumber,
      expiresFormatted,
      paymentMethods,
      notes,
    });

    return this.sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'payment-link' },
        ...(orderNumber ? [{ name: 'order', value: orderNumber }] : []),
      ],
    });
  }

  private generatePaymentLinkEmailHtml(data: {
    customerName: string;
    amount: string;
    paymentUrl: string;
    orderNumber?: string;
    expiresFormatted: string;
    paymentMethods: string[];
    notes?: string;
  }): string {
    const { customerName, amount, paymentUrl, orderNumber, expiresFormatted, paymentMethods, notes } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Link</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 16px; border: 1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 48px; height: 48px; background-color: #4ade80; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #000; font-weight: bold; font-size: 14px;">SBB</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Payment Requested</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello ${customerName},
              </p>
              ${orderNumber ? `
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                A payment is requested for your order <strong style="color: #ffffff;">${orderNumber}</strong>.
              </p>
              ` : `
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                A payment has been requested from Science Based Body.
              </p>
              `}
            </td>
          </tr>

          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #1f1f1f; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #27272a;">
                <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
                <p style="margin: 0; color: #4ade80; font-size: 36px; font-weight: 700;">${amount}</p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${paymentUrl}" style="display: inline-block; background-color: #4ade80; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                Complete Payment
              </a>
            </td>
          </tr>

          ${notes ? `
          <!-- Notes -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #1f1f1f; border-radius: 12px; padding: 16px; border: 1px solid #27272a;">
                <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Note</p>
                <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.5;">${notes}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Payment Methods -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 12px; color: #71717a; font-size: 14px;">Accepted Payment Methods:</p>
              <p style="margin: 0; color: #ffffff; font-size: 14px;">${paymentMethods.join(' • ')}</p>
            </td>
          </tr>

          <!-- Expiration -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #422006; border-radius: 8px; padding: 12px 16px; border: 1px solid #78350f;">
                <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                  ⏰ This link expires on ${expiresFormatted}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #27272a;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-align: center;">
                If you didn't expect this email, please contact us at support@sciencebasedbody.com
              </p>
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Science Based Body. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private generatePaymentLinkEmailText(data: {
    customerName: string;
    amount: string;
    paymentUrl: string;
    orderNumber?: string;
    expiresFormatted: string;
    paymentMethods: string[];
    notes?: string;
  }): string {
    const { customerName, amount, paymentUrl, orderNumber, expiresFormatted, paymentMethods, notes } = data;

    let text = `Hello ${customerName},\n\n`;

    if (orderNumber) {
      text += `A payment is requested for your order ${orderNumber}.\n\n`;
    } else {
      text += `A payment has been requested from Science Based Body.\n\n`;
    }

    text += `AMOUNT DUE: ${amount}\n\n`;
    text += `Click here to complete your payment:\n${paymentUrl}\n\n`;

    if (notes) {
      text += `Note: ${notes}\n\n`;
    }

    text += `Accepted Payment Methods: ${paymentMethods.join(', ')}\n\n`;
    text += `This link expires on ${expiresFormatted}\n\n`;
    text += `---\n`;
    text += `If you didn't expect this email, please contact us at support@sciencebasedbody.com\n`;
    text += `© ${new Date().getFullYear()} Science Based Body. All rights reserved.`;

    return text;
  }

  // ===========================================================================
  // PAYMENT CONFIRMATION
  // ===========================================================================

  async sendPaymentConfirmationEmail(
    customerEmail: string,
    customerName: string,
    amount: number,
    orderNumber?: string,
    paymentMethod?: string,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    const subject = orderNumber
      ? `Payment Received - Order ${orderNumber}`
      : `Payment Received - ${formattedAmount}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 16px; border: 1px solid #27272a;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: #166534; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #4ade80; font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0 0 16px; color: #ffffff; font-size: 24px;">Payment Received!</h1>
              <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 16px;">
                Thank you, ${customerName}. Your payment of <strong style="color: #4ade80;">${formattedAmount}</strong> has been received.
              </p>
              ${orderNumber ? `<p style="margin: 0; color: #71717a; font-size: 14px;">Order: ${orderNumber}</p>` : ''}
              ${paymentMethod ? `<p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">Paid via: ${paymentMethod}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #27272a;">
              <p style="margin: 0; color: #52525b; font-size: 12px;">
                Your order will be processed shortly. You'll receive tracking information once it ships.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `Payment Received!\n\nThank you, ${customerName}. Your payment of ${formattedAmount} has been received.${orderNumber ? `\nOrder: ${orderNumber}` : ''}${paymentMethod ? `\nPaid via: ${paymentMethod}` : ''}\n\nYour order will be processed shortly. You'll receive tracking information once it ships.`;

    return this.sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'payment-confirmation' },
        ...(orderNumber ? [{ name: 'order', value: orderNumber }] : []),
      ],
    });
  }
}

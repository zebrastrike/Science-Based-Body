import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailgunService {
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('MAILGUN_API_KEY', '');
    this.domain = this.config.get('MAILGUN_DOMAIN', '');
    this.fromEmail = this.config.get('MAILGUN_FROM_EMAIL', '');
    this.fromName = this.config.get('MAILGUN_FROM_NAME', 'Science Based Body');
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    const formData = new FormData();
    formData.append('from', `${this.fromName} <${this.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    if (text) formData.append('text', text);

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

    return response.json();
  }

  async sendOrderConfirmation(to: string, orderNumber: string, orderDetails: any) {
    const subject = `Order Confirmation - ${orderNumber}`;
    const html = `
      <h1>Thank you for your order!</h1>
      <p>Your order <strong>${orderNumber}</strong> has been received.</p>
      <p>We will notify you when your order ships.</p>
      <hr>
      <p><small>All products are sold for research purposes only.</small></p>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendShippingNotification(to: string, orderNumber: string, trackingNumber: string, trackingUrl: string) {
    const subject = `Your Order Has Shipped - ${orderNumber}`;
    const html = `
      <h1>Your order is on the way!</h1>
      <p>Order <strong>${orderNumber}</strong> has shipped.</p>
      <p>Tracking Number: <strong>${trackingNumber}</strong></p>
      <p><a href="${trackingUrl}">Track Your Package</a></p>
    `;
    return this.sendEmail(to, subject, html);
  }
}

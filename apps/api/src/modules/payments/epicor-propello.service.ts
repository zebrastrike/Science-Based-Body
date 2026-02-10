import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

interface WebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      metadata?: Record<string, string>;
    };
  };
}

@Injectable()
export class EpicorPropelloService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly merchantId: string;
  private readonly webhookSecret: string;
  private readonly isEnabled: boolean;
  private readonly isSandbox: boolean;

  constructor(private config: ConfigService) {
    this.isEnabled = this.config.get('EPICOR_PROPELLO_ENABLED') === 'true';
    this.isSandbox = this.config.get('EPICOR_PROPELLO_SANDBOX') === 'true';
    this.apiUrl = this.config.get(
      'EPICOR_PROPELLO_API_URL',
      'https://api.epicorpropello.com/v1',
    );
    this.apiKey = this.config.get('EPICOR_PROPELLO_API_KEY', '');
    this.merchantId = this.config.get('EPICOR_PROPELLO_MERCHANT_ID', '');
    this.webhookSecret = this.config.get('EPICOR_PROPELLO_WEBHOOK_SECRET', '');
  }

  /**
   * Check if Epicor Propello is enabled
   */
  isServiceEnabled(): boolean {
    return this.isEnabled && !!this.apiKey && !!this.merchantId;
  }

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntent> {
    if (!this.isServiceEnabled()) {
      throw new BadRequestException('Epicor Propello is not configured');
    }

    try {
      const response = await fetch(`${this.apiUrl}/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-ID': this.merchantId,
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // Convert to cents
          currency: params.currency.toLowerCase(),
          merchant_id: this.merchantId,
          customer_email: params.customerEmail,
          metadata: {
            order_id: params.orderId,
            ...params.metadata,
          },
          capture_method: 'automatic',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Epicor Propello error:', error);
        throw new InternalServerErrorException('Failed to create payment intent');
      }

      const data = await response.json();

      return {
        id: data.id,
        clientSecret: data.client_secret,
        amount: data.amount / 100,
        currency: data.currency.toUpperCase(),
        status: data.status,
      };
    } catch (error) {
      console.error('Epicor Propello API error:', error);
      throw new InternalServerErrorException('Payment service unavailable');
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.isServiceEnabled()) {
      throw new BadRequestException('Epicor Propello is not configured');
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/payment-intents/${paymentIntentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-Merchant-ID': this.merchantId,
          },
        },
      );

      if (!response.ok) {
        throw new InternalServerErrorException('Failed to retrieve payment intent');
      }

      const data = await response.json();

      return {
        id: data.id,
        clientSecret: data.client_secret,
        amount: data.amount / 100,
        currency: data.currency.toUpperCase(),
        status: data.status,
      };
    } catch (error) {
      console.error('Epicor Propello API error:', error);
      throw new InternalServerErrorException('Payment service unavailable');
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    if (!this.isServiceEnabled()) {
      throw new BadRequestException('Epicor Propello is not configured');
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/payment-intents/${paymentIntentId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-Merchant-ID': this.merchantId,
          },
        },
      );

      if (!response.ok) {
        throw new InternalServerErrorException('Failed to cancel payment intent');
      }
    } catch (error) {
      console.error('Epicor Propello API error:', error);
      throw new InternalServerErrorException('Payment service unavailable');
    }
  }

  /**
   * Process a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<{ id: string; status: string; amount: number }> {
    if (!this.isServiceEnabled()) {
      throw new BadRequestException('Epicor Propello is not configured');
    }

    try {
      const response = await fetch(`${this.apiUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-ID': this.merchantId,
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        }),
      });

      if (!response.ok) {
        throw new InternalServerErrorException('Failed to create refund');
      }

      const data = await response.json();

      return {
        id: data.id,
        status: data.status,
        amount: data.amount / 100,
      };
    } catch (error) {
      console.error('Epicor Propello API error:', error);
      throw new InternalServerErrorException('Refund service unavailable');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured');
      return false;
    }

    // Implement HMAC verification based on Epicor Propello's webhook signature format
    // This is a placeholder - actual implementation depends on Propello's signature method
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): WebhookEvent {
    return JSON.parse(payload);
  }

  /**
   * Get fallback payment methods (when Propello is disabled)
   */
  getFallbackPaymentMethods() {
    return {
      zelle: {
        enabled: true,
        name: this.config.get('PAYMENT_ZELLE_NAME') || 'HEALTH SBB',
        phone: this.config.get('PAYMENT_ZELLE_PHONE') || '702-686-5343',
        email: this.config.get('PAYMENT_ZELLE_EMAIL'),
        instructions:
          'Send payment via Zelle to the recipient provided. Include your invoice number in the memo.',
      },
      venmo: {
        enabled: true,
        username: this.config.get('PAYMENT_VENMO_USERNAME') || '@healthsbb',
        phone: this.config.get('PAYMENT_VENMO_PHONE') || '702-686-5343',
        instructions:
          'Send payment via Venmo to the username provided. Include your invoice number in the note.',
      },
      cashapp: {
        enabled: true,
        tag: this.config.get('PAYMENT_CASHAPP_TAG'),
        instructions:
          'Send payment via CashApp to the tag provided. Include your invoice number in the note.',
      },
    };
  }
}

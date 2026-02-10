import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TaxLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface TaxCalculationRequest {
  toState: string;
  toZip: string;
  toCity: string;
  toCountry: string;
  shipping: number;
  lineItems: TaxLineItem[];
}

export interface TaxCalculationResult {
  taxAmount: number;
  taxRate: number;
  taxableAmount: number;
  breakdown?: {
    stateTax: number;
    countyTax: number;
    cityTax: number;
    specialTax: number;
  };
}

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.taxjar.com/v2';
  private readonly isEnabled: boolean;
  private readonly fromStreet: string;
  private readonly fromCity: string;
  private readonly fromState: string;
  private readonly fromZip: string;
  private readonly fromCountry: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('TAXJAR_API_KEY', '');
    this.isEnabled = !!this.apiKey;
    this.fromStreet = this.config.get('TAXJAR_FROM_STREET', '');
    this.fromCity = this.config.get('TAXJAR_FROM_CITY', '');
    this.fromState = this.config.get('TAXJAR_FROM_STATE', 'AZ');
    this.fromZip = this.config.get('TAXJAR_FROM_ZIP', '');
    this.fromCountry = this.config.get('TAXJAR_FROM_COUNTRY', 'US');

    if (!this.isEnabled) {
      this.logger.warn('TaxJar is not configured - tax will be $0');
    }
  }

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    if (!this.isEnabled) {
      return { taxAmount: 0, taxRate: 0, taxableAmount: 0 };
    }

    const lineItemTotal = request.lineItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    try {
      const body = {
        from_country: this.fromCountry,
        from_zip: this.fromZip,
        from_state: this.fromState,
        from_city: this.fromCity,
        from_street: this.fromStreet,
        to_country: request.toCountry || 'US',
        to_zip: request.toZip,
        to_state: request.toState,
        to_city: request.toCity,
        amount: lineItemTotal,
        shipping: request.shipping,
        line_items: request.lineItems.map((item, index) => ({
          id: item.productId || String(index),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      const response = await fetch(`${this.apiUrl}/taxes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        this.logger.error(`TaxJar error: ${response.status} ${JSON.stringify(err)}`);
        return { taxAmount: 0, taxRate: 0, taxableAmount: lineItemTotal };
      }

      const data = await response.json();
      const tax = data.tax || {};

      return {
        taxAmount: tax.amount_to_collect || 0,
        taxRate: tax.rate || 0,
        taxableAmount: tax.taxable_amount || lineItemTotal,
        breakdown: tax.breakdown
          ? {
              stateTax: tax.breakdown.state_tax_collectable || 0,
              countyTax: tax.breakdown.county_tax_collectable || 0,
              cityTax: tax.breakdown.city_tax_collectable || 0,
              specialTax: tax.breakdown.special_district_tax_collectable || 0,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Tax calculation failed: ${error.message}`);
      return { taxAmount: 0, taxRate: 0, taxableAmount: lineItemTotal };
    }
  }

  async recordTransaction(order: {
    orderId: string;
    orderDate: string;
    toState: string;
    toZip: string;
    toCity: string;
    toCountry: string;
    shipping: number;
    salesTax: number;
    lineItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const body = {
        transaction_id: order.orderId,
        transaction_date: order.orderDate,
        from_country: this.fromCountry,
        from_zip: this.fromZip,
        from_state: this.fromState,
        from_city: this.fromCity,
        to_country: order.toCountry || 'US',
        to_zip: order.toZip,
        to_state: order.toState,
        to_city: order.toCity,
        amount: order.shipping + order.lineItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        shipping: order.shipping,
        sales_tax: order.salesTax,
        line_items: order.lineItems.map((item, index) => ({
          id: item.productId || String(index),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };

      const response = await fetch(`${this.apiUrl}/transactions/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        this.logger.error(`TaxJar transaction error: ${response.status} ${JSON.stringify(err)}`);
        return false;
      }

      this.logger.log(`Tax transaction recorded for order ${order.orderId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to record tax transaction: ${error.message}`);
      return false;
    }
  }
}

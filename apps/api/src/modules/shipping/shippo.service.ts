import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShippoService {
  private readonly apiKey: string;
  private readonly returnAddress: any;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('SHIPPO_API_KEY', '');
    this.returnAddress = {
      name: this.config.get('SHIPPO_RETURN_NAME'),
      street1: this.config.get('SHIPPO_RETURN_STREET'),
      city: this.config.get('SHIPPO_RETURN_CITY'),
      state: this.config.get('SHIPPO_RETURN_STATE'),
      zip: this.config.get('SHIPPO_RETURN_ZIP'),
      country: this.config.get('SHIPPO_RETURN_COUNTRY'),
      phone: this.config.get('SHIPPO_RETURN_PHONE'),
    };
  }

  async getRates(toAddress: any, parcel: any) {
    // Shippo API integration
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_from: this.returnAddress,
        address_to: toAddress,
        parcels: [parcel],
        async: false,
      }),
    });

    const data = await response.json();
    return data.rates || [];
  }

  async createLabel(rateId: string, shipmentId?: string) {
    const response = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: rateId,
        label_file_type: 'PDF',
        async: false,
      }),
    });

    return response.json();
  }

  async trackShipment(carrier: string, trackingNumber: string) {
    const response = await fetch(
      `https://api.goshippo.com/tracks/${carrier}/${trackingNumber}`,
      {
        headers: {
          Authorization: `ShippoToken ${this.apiKey}`,
        },
      },
    );

    return response.json();
  }

  /**
   * Build parcel object for Shippo from order weight
   * Weight can be overridden when manually weighed on scale
   * Default dimensions for peptide packages
   */
  buildParcel(options: {
    weightLbs?: number;
    weightOz?: number;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
  }) {
    // Default small box dimensions for peptide vials
    const DEFAULT_LENGTH = 6;
    const DEFAULT_WIDTH = 4;
    const DEFAULT_HEIGHT = 2;

    return {
      length: options.lengthIn || DEFAULT_LENGTH,
      width: options.widthIn || DEFAULT_WIDTH,
      height: options.heightIn || DEFAULT_HEIGHT,
      distance_unit: 'in',
      weight: options.weightLbs || (options.weightOz ? options.weightOz / 16 : 0.5),
      mass_unit: 'lb',
    };
  }

  /**
   * Create shipment and get rates for an order
   * Uses calculated weight from cart/order or manually entered weight
   */
  async createShipmentWithRates(
    toAddress: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
      phone?: string;
    },
    weightLbs: number,
    dimensions?: { lengthIn: number; widthIn: number; heightIn: number },
  ) {
    const parcel = this.buildParcel({
      weightLbs,
      ...(dimensions || {}),
    });

    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_from: this.returnAddress,
        address_to: {
          ...toAddress,
          country: toAddress.country || 'US',
        },
        parcels: [parcel],
        async: false,
      }),
    });

    const data = await response.json();
    return {
      shipmentId: data.object_id,
      rates: data.rates || [],
      parcel,
    };
  }
}

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

  async createLabel(rateId: string) {
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
}

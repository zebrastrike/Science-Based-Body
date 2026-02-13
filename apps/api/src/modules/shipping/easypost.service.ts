import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EasyPostService {
  private readonly logger = new Logger(EasyPostService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.easypost.com/v2';
  private readonly returnAddress: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };

  // Cache rateId -> shipmentId so createLabel can find the parent shipment
  private rateToShipmentMap = new Map<string, string>();

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('EASYPOST_API_KEY', '');
    this.returnAddress = {
      name: this.config.get('RETURN_ADDRESS_NAME', 'Health SBB'),
      street1: this.config.get('RETURN_ADDRESS_STREET', '1001 S Main St'),
      city: this.config.get('RETURN_ADDRESS_CITY', 'Kalispell'),
      state: this.config.get('RETURN_ADDRESS_STATE', 'MT'),
      zip: this.config.get('RETURN_ADDRESS_ZIP', '59901'),
      country: this.config.get('RETURN_ADDRESS_COUNTRY', 'US'),
      phone: this.config.get('RETURN_ADDRESS_PHONE', '7026865343'),
    };
  }

  private get authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
  }

  async getRates(toAddress: any, parcel: any) {
    const weightOz =
      parcel.mass_unit === 'lb'
        ? parseFloat(parcel.weight) * 16
        : parseFloat(parcel.weight);

    const response = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipment: {
          from_address: this.returnAddress,
          to_address: toAddress,
          parcel: {
            length: parcel.length,
            width: parcel.width,
            height: parcel.height,
            weight: weightOz,
          },
          customs_info: {
            contents_type: 'merchandise',
            eel_pfc: 'NOEEI 30.37(a)',
            customs_certify: true,
            customs_signer: this.returnAddress.name,
            customs_items: [
              {
                description: 'Research chemicals',
                quantity: 1,
                weight: weightOz,
                value: 25,
                origin_country: 'US',
              },
            ],
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      this.logger.error('EasyPost getRates error:', data.error);
      return [];
    }

    // Cache rate -> shipment mappings
    for (const rate of data.rates || []) {
      this.rateToShipmentMap.set(rate.id, data.id);
    }

    // Transform EasyPost rates to standard shape
    return (data.rates || []).map((rate: any) => ({
      object_id: rate.id,
      provider: rate.carrier,
      servicelevel: { name: rate.service },
      servicelevel_name: rate.service,
      amount: rate.rate,
      currency: rate.currency,
      estimated_days: rate.delivery_days,
      duration_terms: rate.delivery_date_guaranteed ? 'Guaranteed' : '',
    }));
  }

  async createLabel(rateId: string, shipmentId?: string) {
    const resolvedShipmentId =
      shipmentId || this.rateToShipmentMap.get(rateId);

    if (!resolvedShipmentId) {
      throw new Error(
        'EasyPost shipment ID not found for rate. Rates may have expired — please re-fetch rates.',
      );
    }

    const response = await fetch(
      `${this.baseUrl}/shipments/${resolvedShipmentId}/buy`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rate: { id: rateId },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      this.logger.error('EasyPost createLabel error:', data.error);
      return {
        status: 'ERROR',
        messages: [{ text: data.error.message || JSON.stringify(data.error) }],
      };
    }

    // Transform EasyPost buy response to standard label shape
    return {
      status: 'SUCCESS',
      object_id: data.id,
      tracking_number: data.tracking_code,
      tracking_url_provider:
        data.tracker?.public_url || '',
      label_url:
        data.postage_label?.label_url || '',
      rate: {
        provider: data.selected_rate?.carrier || '',
        amount: data.selected_rate?.rate || '0',
        servicelevel: { name: data.selected_rate?.service || '' },
      },
    };
  }

  async trackShipment(carrier: string, trackingNumber: string) {
    const response = await fetch(`${this.baseUrl}/trackers`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_code: trackingNumber,
        carrier,
      }),
    });

    return response.json();
  }

  buildParcel(options: {
    weightLbs?: number;
    weightOz?: number;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
  }) {
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

    const weightOz = parcel.weight * 16;

    const response = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipment: {
          from_address: this.returnAddress,
          to_address: {
            ...toAddress,
            country: toAddress.country || 'US',
          },
          parcel: {
            length: parcel.length,
            width: parcel.width,
            height: parcel.height,
            weight: weightOz,
          },
          customs_info: {
            contents_type: 'merchandise',
            eel_pfc: 'NOEEI 30.37(a)',
            customs_certify: true,
            customs_signer: this.returnAddress.name,
            customs_items: [
              {
                description: 'Research chemicals',
                quantity: 1,
                weight: weightOz,
                value: 25,
                origin_country: 'US',
              },
            ],
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      this.logger.error('EasyPost createShipmentWithRates error:', data.error);
      return { shipmentId: null, rates: [], parcel };
    }

    // Cache rate -> shipment mappings
    for (const rate of data.rates || []) {
      this.rateToShipmentMap.set(rate.id, data.id);
    }

    // Transform EasyPost rates to standard shape
    const rates = (data.rates || []).map((rate: any) => ({
      object_id: rate.id,
      provider: rate.carrier,
      servicelevel: { name: rate.service },
      servicelevel_name: rate.service,
      amount: rate.rate,
      currency: rate.currency,
      estimated_days: rate.delivery_days,
      duration_terms: rate.delivery_date_guaranteed ? 'Guaranteed' : '',
    }));

    return {
      shipmentId: data.id,
      rates,
      parcel,
    };
  }
}

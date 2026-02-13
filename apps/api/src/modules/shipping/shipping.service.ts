import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EasyPostService } from './easypost.service';

@Injectable()
export class ShippingService {
  constructor(
    private prisma: PrismaService,
    private easypost: EasyPostService,
  ) {}

  async getShippingRates(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, items: true },
    });

    if (!order) throw new Error('Order not found');

    const parcel = {
      length: '10',
      width: '8',
      height: '4',
      distance_unit: 'in',
      weight: '1',
      mass_unit: 'lb',
    };

    return this.easypost.getRates(
      {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        street1: order.shippingAddress.street1,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zip: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      parcel,
    );
  }

  async createShipment(orderId: string, rateId: string, adminId: string) {
    const label = await this.easypost.createLabel(rateId);

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        carrier: label.rate?.provider || 'UNKNOWN',
        serviceLevel: label.rate?.servicelevel?.name,
        trackingNumber: label.tracking_number,
        trackingUrl: label.tracking_url_provider,
        labelUrl: label.label_url,
        shippingCost: label.rate?.amount || 0,
        status: 'LABEL_CREATED',
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED', shippedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'SHIP',
        resourceType: 'Order',
        resourceId: orderId,
        metadata: { trackingNumber: label.tracking_number },
      },
    });

    return shipment;
  }

  async trackShipment(trackingNumber: string, carrier: string) {
    return this.easypost.trackShipment(carrier, trackingNumber);
  }
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderForShipping {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
  shippingAddress: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paidAt: string;
}

export default function ShippingPage() {
  const [ordersToShip, setOrdersToShip] = useState<OrderForShipping[]>([]);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShippingData();
  }, []);

  const fetchShippingData = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      // Fetch orders needing shipping
      const ordersResponse = await fetch(`${API_BASE_URL}/admin/orders?paymentStatus=PAID&shippingStatus=NOT_SHIPPED`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const data = await ordersResponse.json();
        setOrdersToShip(data.data || []);
      }

      // Fetch recent shipments
      const shipmentsResponse = await fetch(`${API_BASE_URL}/admin/shipping/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (shipmentsResponse.ok) {
        const data = await shipmentsResponse.json();
        setRecentShipments(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch shipping data:', error);
      // Demo data
      setOrdersToShip([
        {
          id: '1',
          orderNumber: 'SBB-2024-0001',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          totalAmount: 249.99,
          itemCount: 2,
          shippingAddress: {
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
          paidAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          orderNumber: 'SBB-2024-0002',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          totalAmount: 499.99,
          itemCount: 3,
          shippingAddress: {
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
          paidAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
      setRecentShipments([
        {
          id: 's1',
          orderNumber: 'SBB-2024-0003',
          customerName: 'Alice Johnson',
          carrier: 'USPS',
          trackingNumber: '9400111899223547891234',
          shippedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'IN_TRANSIT',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  };

  const getTimeSincePaid = (paidAt: string) => {
    const hours = Math.floor((Date.now() - new Date(paidAt).getTime()) / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Shipping</h1>
        <p className="text-zinc-400 mt-1">Create shipping labels and track shipments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Awaiting Shipment</p>
              <p className="text-3xl font-bold text-white mt-1">{ordersToShip.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">In Transit</p>
              <p className="text-3xl font-bold text-white mt-1">
                {recentShipments.filter(s => s.status === 'IN_TRANSIT').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Delivered This Week</p>
              <p className="text-3xl font-bold text-white mt-1">
                {recentShipments.filter(s => s.status === 'DELIVERED').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Awaiting Shipment */}
      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-white">Orders Awaiting Shipment</h2>
          <span className="text-sm text-zinc-400">{ordersToShip.length} orders</span>
        </div>

        {ordersToShip.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-zinc-400">All orders have been shipped!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ordersToShip.map((order) => (
              <div key={order.id} className="p-4 hover:bg-background-tertiary transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-white hover:text-brand-primary">
                          {order.orderNumber}
                        </Link>
                        <span className="text-sm text-yellow-400">Paid {getTimeSincePaid(order.paidAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {order.customerName} • {order.itemCount} items • {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/shipping/${order.id}`}
                    className="px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
                  >
                    Create Label
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Shipments */}
      {recentShipments.length > 0 && (
        <div className="bg-background-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-white">Recent Shipments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Carrier</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Tracking</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Shipped</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{shipment.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{shipment.customerName}</td>
                    <td className="px-4 py-3 text-zinc-400">{shipment.carrier}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-brand-primary">{shipment.trackingNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(shipment.shippedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        shipment.status === 'DELIVERED'
                          ? 'bg-green-500/10 text-green-400'
                          : shipment.status === 'IN_TRANSIT'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {shipment.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

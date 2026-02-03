'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  serviceName: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  carrierLogo?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    variantName?: string;
    quantity: number;
  }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  totalAmount: number;
}

interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  weightUnit: 'oz' | 'lb';
  dimensionUnit: 'in' | 'cm';
}

export default function CreateShippingLabelPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [packageDimensions, setPackageDimensions] = useState<PackageDimensions>({
    length: 6,
    width: 4,
    height: 2,
    weight: 4,
    weightUnit: 'oz',
    dimensionUnit: 'in',
  });

  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      // Demo data
      setOrder({
        id: orderId,
        orderNumber: 'SBB-2024-0001',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        items: [
          { productName: 'Semaglutide', variantName: '5mg', quantity: 2 },
          { productName: 'BPC-157', variantName: '5mg', quantity: 1 },
        ],
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '123 Research Blvd',
          address2: 'Suite 100',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US',
          phone: '+1 (555) 123-4567',
        },
        totalAmount: 249.97,
      });
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const getRates = async () => {
    setIsLoadingRates(true);
    setShowRates(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/shipping/${orderId}/rates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package: packageDimensions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRates(data.rates || []);
      }
    } catch (error) {
      console.error('Failed to get rates:', error);
      // Demo rates
      setRates([
        {
          id: 'rate_1',
          carrier: 'USPS',
          service: 'usps_priority',
          serviceName: 'Priority Mail',
          amount: 8.95,
          currency: 'USD',
          estimatedDays: 2,
        },
        {
          id: 'rate_2',
          carrier: 'USPS',
          service: 'usps_priority_express',
          serviceName: 'Priority Mail Express',
          amount: 26.35,
          currency: 'USD',
          estimatedDays: 1,
        },
        {
          id: 'rate_3',
          carrier: 'UPS',
          service: 'ups_ground',
          serviceName: 'UPS Ground',
          amount: 12.45,
          currency: 'USD',
          estimatedDays: 4,
        },
        {
          id: 'rate_4',
          carrier: 'UPS',
          service: 'ups_next_day_air',
          serviceName: 'UPS Next Day Air',
          amount: 42.80,
          currency: 'USD',
          estimatedDays: 1,
        },
        {
          id: 'rate_5',
          carrier: 'FedEx',
          service: 'fedex_ground',
          serviceName: 'FedEx Ground',
          amount: 11.20,
          currency: 'USD',
          estimatedDays: 4,
        },
      ]);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const purchaseLabel = async () => {
    if (!selectedRate) return;
    setIsPurchasing(true);

    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/shipping/${orderId}/label`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rateId: selectedRate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabelUrl(data.labelUrl);
      }
    } catch (error) {
      console.error('Failed to purchase label:', error);
      // Demo label
      setLabelUrl('https://example.com/label.pdf');
      alert('Label purchased successfully! (Demo mode)');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Order not found</p>
        <Link href="/admin/shipping" className="text-brand-primary hover:underline mt-4 inline-block">
          Back to Shipping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/shipping"
          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Shipping Label</h1>
          <p className="text-zinc-400">Order {order.orderNumber}</p>
        </div>
      </div>

      {labelUrl ? (
        // Label Created Success
        <div className="bg-background-card rounded-xl border border-green-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Label Created Successfully!</h2>
          <p className="text-zinc-400 mb-6">Your shipping label is ready to download and print.</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Label
            </a>
            <Link
              href="/admin/shipping"
              className="px-6 py-3 text-zinc-400 hover:text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors"
            >
              Back to Shipping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-background-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <span className="text-white">{item.productName}</span>
                      {item.variantName && <span className="text-zinc-500 ml-2">({item.variantName})</span>}
                    </div>
                    <span className="text-zinc-400">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Package Dimensions */}
            <div className="bg-background-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-white mb-4">Package Dimensions</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Length</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={packageDimensions.length}
                      onChange={(e) => setPackageDimensions({ ...packageDimensions, length: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">in</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Width</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={packageDimensions.width}
                      onChange={(e) => setPackageDimensions({ ...packageDimensions, width: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">in</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Height</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={packageDimensions.height}
                      onChange={(e) => setPackageDimensions({ ...packageDimensions, height: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">in</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Weight</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={packageDimensions.weight}
                      onChange={(e) => setPackageDimensions({ ...packageDimensions, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                    <select
                      value={packageDimensions.weightUnit}
                      onChange={(e) => setPackageDimensions({ ...packageDimensions, weightUnit: e.target.value as 'oz' | 'lb' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-zinc-500 text-sm cursor-pointer"
                    >
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={getRates}
                disabled={isLoadingRates}
                className="w-full px-4 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
              >
                {isLoadingRates ? 'Getting Rates...' : 'Get Shipping Rates'}
              </button>
            </div>

            {/* Shipping Rates */}
            {showRates && (
              <div className="bg-background-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-white mb-4">Select Shipping Rate</h2>

                {isLoadingRates ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-zinc-400">Fetching rates from carriers...</p>
                  </div>
                ) : rates.length === 0 ? (
                  <p className="text-zinc-400 text-center py-4">No rates available. Please check package dimensions.</p>
                ) : (
                  <div className="space-y-3">
                    {rates.map((rate) => (
                      <label
                        key={rate.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedRate === rate.id
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-border hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingRate"
                          value={rate.id}
                          checked={selectedRate === rate.id}
                          onChange={(e) => setSelectedRate(e.target.value)}
                          className="w-4 h-4 text-brand-primary bg-background-secondary border-border focus:ring-brand-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{rate.carrier}</span>
                            <span className="text-zinc-400">{rate.serviceName}</span>
                          </div>
                          <p className="text-sm text-zinc-500">
                            Estimated {rate.estimatedDays} day{rate.estimatedDays !== 1 ? 's' : ''} delivery
                          </p>
                        </div>
                        <span className="font-semibold text-brand-primary">{formatCurrency(rate.amount)}</span>
                      </label>
                    ))}
                  </div>
                )}

                {selectedRate && (
                  <button
                    onClick={purchaseLabel}
                    disabled={isPurchasing}
                    className="w-full mt-4 px-4 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                  >
                    {isPurchasing ? 'Purchasing Label...' : 'Purchase Label'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="space-y-6">
            <div className="bg-background-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-white mb-4">Ship To</h2>
              <div className="text-zinc-300">
                <p className="font-medium text-white">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="mt-3 text-zinc-400">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>

            <div className="bg-background-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-white mb-4">Ship From</h2>
              <div className="text-zinc-300">
                <p className="font-medium text-white">Science Based Body</p>
                <p>123 Lab Way</p>
                <p>Suite 456</p>
                <p>Research City, CA 90210</p>
                <p>United States</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h3 className="font-medium text-yellow-400 mb-2">Important</h3>
              <p className="text-sm text-yellow-400/80">
                Ensure package is properly sealed and labeled. All shipments must comply with research material handling guidelines.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

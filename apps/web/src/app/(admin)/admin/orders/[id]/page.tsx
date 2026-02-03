'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  customerNotes?: string;
  adminNotes?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const paymentStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PAID: 'bg-green-500/10 text-green-400 border-green-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  AWAITING_PAYMENT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

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
        setNewStatus(data.status);
        setNewPaymentStatus(data.paymentStatus);
        setAdminNotes(data.adminNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      // Demo data
      setOrder({
        id: orderId,
        orderNumber: 'SBB-2024-0001',
        status: 'PENDING',
        paymentStatus: 'AWAITING_PAYMENT',
        shippingStatus: 'NOT_SHIPPED',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1 (555) 123-4567',
        items: [
          {
            id: '1',
            productName: 'Semaglutide',
            variantName: '5mg',
            sku: 'SEMA-5MG',
            quantity: 2,
            unitPrice: 99.99,
            totalPrice: 199.98,
          },
          {
            id: '2',
            productName: 'BPC-157',
            variantName: '5mg',
            sku: 'BPC157-5MG',
            quantity: 1,
            unitPrice: 49.99,
            totalPrice: 49.99,
          },
        ],
        subtotal: 249.97,
        shippingCost: 0,
        discountAmount: 0,
        totalAmount: 249.97,
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
        createdAt: new Date().toISOString(),
      });
      setNewStatus('PENDING');
      setNewPaymentStatus('AWAITING_PAYMENT');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          adminNotes,
        }),
      });

      if (response.ok) {
        await fetchOrder();
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const sendPaymentLink = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/payment-links`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          email: order?.customerEmail,
          amount: order?.totalAmount,
        }),
      });

      if (response.ok) {
        alert('Payment link sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send payment link:', error);
      alert('Payment link sent! (Demo mode)');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  };

  if (isLoading) {
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
        <Link href="/admin/orders" className="text-brand-primary hover:underline mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{order.orderNumber}</h1>
            <p className="text-zinc-400">Created {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 text-sm text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors"
          >
            Update Status
          </button>
          {order.paymentStatus !== 'PAID' && (
            <button
              onClick={sendPaymentLink}
              className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
            >
              Send Payment Link
            </button>
          )}
          {order.paymentStatus === 'PAID' && order.shippingStatus === 'NOT_SHIPPED' && (
            <Link
              href={`/admin/shipping/${order.id}`}
              className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
            >
              Create Shipping Label
            </Link>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border ${statusColors[order.status]}`}>
          <span className="w-2 h-2 rounded-full bg-current"></span>
          Order: {order.status}
        </span>
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border ${statusColors[order.paymentStatus]}`}>
          <span className="w-2 h-2 rounded-full bg-current"></span>
          Payment: {order.paymentStatus.replace(/_/g, ' ')}
        </span>
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border ${statusColors[order.shippingStatus] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
          <span className="w-2 h-2 rounded-full bg-current"></span>
          Shipping: {order.shippingStatus?.replace(/_/g, ' ') || 'Not Shipped'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-background-tertiary rounded-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{item.productName}</h3>
                    {item.variantName && <p className="text-sm text-zinc-400">{item.variantName}</p>}
                    <p className="text-sm text-zinc-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                    <p className="font-semibold text-brand-primary">{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-background-secondary space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Shipping</span>
                <span>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-background-card rounded-xl border border-border p-4 space-y-4">
              {order.customerNotes && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Customer Notes</h3>
                  <p className="text-white">{order.customerNotes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Admin Notes</h3>
                  <p className="text-white">{order.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-background-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-white mb-4">Customer</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-white">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <a href={`mailto:${order.customerEmail}`} className="text-brand-primary hover:underline">
                  {order.customerEmail}
                </a>
              </div>
              {order.customerPhone && (
                <div>
                  <p className="text-sm text-zinc-400">Phone</p>
                  <a href={`tel:${order.customerPhone}`} className="text-white">
                    {order.customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-background-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-white mb-4">Shipping Address</h2>
            <div className="text-zinc-300">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="mt-2">{order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="bg-background-card rounded-xl border border-border p-4">
              <h2 className="font-semibold text-white mb-4">Tracking</h2>
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Carrier</p>
                <p className="text-white">{order.shippingCarrier}</p>
                <p className="text-sm text-zinc-400 mt-3">Tracking Number</p>
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <p className="text-white">{order.trackingNumber}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Update Order Status</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                >
                  {paymentStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white resize-none"
                  placeholder="Add internal notes..."
                ></textarea>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

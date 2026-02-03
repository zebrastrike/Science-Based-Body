'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
}

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledOrderId = searchParams.get('orderId');

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const [formData, setFormData] = useState({
    orderId: prefilledOrderId || '',
    customerEmail: '',
    customerName: '',
    amount: '',
    expiresIn: '48', // hours
    paymentMethods: ['Zelle', 'Wire', 'CashApp', 'Crypto'],
    notes: '',
    sendEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdLink, setCreatedLink] = useState<{ token: string; url: string } | null>(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (formData.orderId && orders.length > 0) {
      const selectedOrder = orders.find(o => o.id === formData.orderId);
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          customerEmail: selectedOrder.customerEmail,
          customerName: selectedOrder.customerName,
          amount: selectedOrder.totalAmount.toFixed(2),
        }));
      }
    }
  }, [formData.orderId, orders]);

  const fetchPendingOrders = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders?paymentStatus=AWAITING_PAYMENT&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Demo data
      setOrders([
        { id: '1', orderNumber: 'SBB-2024-0001', customerEmail: 'jane@example.com', customerName: 'Jane Smith', totalAmount: 249.99 },
        { id: '2', orderNumber: 'SBB-2024-0002', customerEmail: 'john@example.com', customerName: 'John Doe', totalAmount: 499.99 },
      ]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerEmail?.trim()) newErrors.customerEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) newErrors.customerEmail = 'Invalid email format';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (formData.paymentMethods.length === 0) newErrors.paymentMethods = 'At least one payment method required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSending(true);
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
          orderId: formData.orderId || undefined,
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          amount: parseFloat(formData.amount),
          expiresInHours: parseInt(formData.expiresIn),
          paymentMethods: formData.paymentMethods,
          notes: formData.notes,
          sendEmail: formData.sendEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedLink({
          token: data.token,
          url: `${window.location.origin}/pay/${data.token}`,
        });
      }
    } catch (error) {
      console.error('Failed to create payment link:', error);
      // Demo success
      const demoToken = `pay_${Date.now().toString(36)}`;
      setCreatedLink({
        token: demoToken,
        url: `${window.location.origin}/pay/${demoToken}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    const methods = formData.paymentMethods.includes(method)
      ? formData.paymentMethods.filter(m => m !== method)
      : [...formData.paymentMethods, method];
    setFormData({ ...formData, paymentMethods: methods });
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.url);
    }
  };

  if (createdLink) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-background-card rounded-xl border border-green-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Payment Link Created!</h2>
          <p className="text-zinc-400 mb-6">
            {formData.sendEmail
              ? `An email has been sent to ${formData.customerEmail} with the payment link.`
              : 'Copy the link below to share with the customer.'}
          </p>

          <div className="bg-background-secondary rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Payment Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={createdLink.url}
                readOnly
                className="flex-1 px-4 py-2.5 bg-background-tertiary border border-border rounded-lg text-white font-mono text-sm"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-400">Amount</p>
                <p className="text-white font-medium">${formData.amount}</p>
              </div>
              <div>
                <p className="text-zinc-400">Expires In</p>
                <p className="text-white font-medium">{formData.expiresIn} hours</p>
              </div>
              <div>
                <p className="text-zinc-400">Customer</p>
                <p className="text-white font-medium">{formData.customerName || formData.customerEmail}</p>
              </div>
              <div>
                <p className="text-zinc-400">Payment Methods</p>
                <p className="text-white font-medium">{formData.paymentMethods.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/admin/payments"
              className="px-6 py-2.5 text-zinc-400 hover:text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors"
            >
              Back to Payment Links
            </Link>
            <button
              onClick={() => {
                setCreatedLink(null);
                setFormData({
                  orderId: '',
                  customerEmail: '',
                  customerName: '',
                  amount: '',
                  expiresIn: '48',
                  paymentMethods: ['Zelle', 'Wire', 'CashApp', 'Crypto'],
                  notes: '',
                  sendEmail: true,
                });
              }}
              className="px-6 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/payments"
          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Payment Link</h1>
          <p className="text-zinc-400">Send a payment link to a customer via email</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Link to Order (Optional) */}
        <div className="bg-background-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-white mb-4">Link to Order (Optional)</h2>
          <select
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="">No linked order - Create standalone link</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.customerName} (${order.totalAmount.toFixed(2)})
              </option>
            ))}
          </select>
          <p className="text-sm text-zinc-500 mt-2">
            Linking to an order will auto-fill customer details and associate the payment.
          </p>
        </div>

        {/* Customer Information */}
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Customer Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className={`w-full px-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                  errors.customerEmail ? 'border-red-500' : 'border-border'
                } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
                placeholder="customer@example.com"
              />
              {errors.customerEmail && <p className="text-sm text-red-400 mt-1">{errors.customerEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="Jane Smith"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Payment Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full pl-8 pr-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                    errors.amount ? 'border-red-500' : 'border-border'
                  } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-sm text-red-400 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Link Expires In</label>
              <select
                value={formData.expiresIn}
                onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">7 days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Accepted Payment Methods <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['Zelle', 'Wire', 'CashApp', 'Crypto', 'Venmo'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.paymentMethods.includes(method)
                      ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                      : 'border-border text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {errors.paymentMethods && <p className="text-sm text-red-400 mt-1">{errors.paymentMethods}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Notes (included in email)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="Optional message to include in the payment email..."
            ></textarea>
          </div>
        </div>

        {/* Email Options */}
        <div className="bg-background-card rounded-xl border border-border p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sendEmail}
              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-background-secondary text-brand-primary focus:ring-brand-primary"
            />
            <div>
              <span className="font-medium text-white">Send email to customer</span>
              <p className="text-sm text-zinc-500">
                The customer will receive an email with the payment link and instructions.
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/payments"
            className="px-6 py-2.5 text-zinc-400 hover:text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSending}
            className="px-6 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
          >
            {isSending ? 'Creating...' : formData.sendEmail ? 'Create & Send Link' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  );
}

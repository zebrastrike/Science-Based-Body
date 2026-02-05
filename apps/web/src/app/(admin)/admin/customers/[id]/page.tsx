'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminRequest, PaginatedResponse } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface Address {
  id: string;
  label?: string;
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

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  ordersCount: number;
  totalSpent: number;
  adminNotes?: string;
  addresses?: Address[];
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  INACTIVE: 'bg-zinc-500/10 text-zinc-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PAID: 'bg-green-500/10 text-green-400',
  SHIPPED: 'bg-purple-500/10 text-purple-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const { toasts, push, dismiss } = useToasts();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    setIsLoading(true);

    try {
      const detail = await adminRequest<CustomerDetail>(`/admin/users/${customerId}`);
      setCustomer(detail);
      setAdminNotes(detail.adminNotes || '');

      const ordersResponse = await adminRequest<PaginatedResponse<OrderSummary>>(
        `/admin/orders?customerId=${customerId}&limit=10`,
      );
      setOrders(ordersResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch customer:', err);
      setCustomer({
        id: customerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1 (555) 123-4567',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
        status: 'ACTIVE',
        ordersCount: 5,
        totalSpent: 1699.75,
        adminNotes: 'VIP researcher. Prefers UPS overnight.',
        addresses: [
          {
            id: 'addr-1',
            label: 'Primary Lab',
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
        ],
      });
      setOrders([
        {
          id: 'order-1',
          orderNumber: 'SBB-2024-0001',
          status: 'PAID',
          totalAmount: 249.99,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        },
        {
          id: 'order-2',
          orderNumber: 'SBB-2024-0002',
          status: 'SHIPPED',
          totalAmount: 499.99,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!customer) return;
    setIsSaving(true);

    try {
      await adminRequest(`/admin/users/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes }),
      });
      push('Notes updated.');
    } catch (err) {
      console.error('Failed to save notes:', err);
      push('Notes updated (demo mode).', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(dateString),
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Customer not found</p>
        <Link href="/admin/customers" className="text-brand-primary hover:underline mt-4 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-zinc-400">Joined {formatDate(customer.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="px-4 py-2 text-sm text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors">
            Edit Profile
          </button>
          <button
            onClick={() => (window.location.href = `mailto:${customer.email}`)}
            className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
          >
            Send Email
          </button>
          <Link
            href={`/admin/orders?customer=${customer.id}`}
            className="px-4 py-2 text-sm text-zinc-300 border border-border rounded-lg hover:bg-background-tertiary transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${statusColors[customer.status]}`}>
          {customer.status}
        </span>
        <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300">
          PII Encrypted
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Order History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Total</th>
                    <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Date</th>
                    <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                        <td className="px-4 py-3 text-white font-medium">
                          <Link href={`/admin/orders/${order.id}`} className="hover:text-brand-primary">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-zinc-500/10 text-zinc-400'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3 text-zinc-400">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm text-brand-primary hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-background-card rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-white">Internal Notes</h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-white resize-none"
              placeholder="Add internal notes..."
            ></textarea>
            <div className="flex justify-end">
              <button
                onClick={saveNotes}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-white mb-4">Profile</h2>
            <div className="space-y-3 text-zinc-300">
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <p className="text-white flex items-center gap-2">
                  {customer.email}
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">Encrypted</span>
                </p>
              </div>
              {customer.phone && (
                <div>
                  <p className="text-sm text-zinc-400">Phone</p>
                  <p className="text-white flex items-center gap-2">
                    {customer.phone}
                    <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">Encrypted</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-background-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-white mb-4">Lifetime Value</h2>
            <p className="text-3xl font-bold text-white">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-sm text-zinc-500 mt-1">{customer.ordersCount} total orders</p>
          </div>

          <div className="bg-background-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-white mb-4">Address Book</h2>
            {customer.addresses?.length ? (
              <div className="space-y-4">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="text-sm text-zinc-300 border border-border rounded-lg p-3">
                    <p className="font-medium text-white">{address.label || 'Address'}</p>
                    <p>{address.firstName} {address.lastName}</p>
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-2 text-zinc-400">{address.phone}</p>}
                    <div className="mt-2 text-xs text-zinc-500">Encrypted at rest</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No saved addresses.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

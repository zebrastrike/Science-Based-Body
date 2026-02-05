'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminRequest, PaginatedResponse } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  INACTIVE: 'bg-zinc-500/10 text-zinc-400',
};

export default function CustomersPage() {
  const router = useRouter();
  const { toasts, push, dismiss } = useToasts();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, statusFilter]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (statusFilter !== 'all') params.set('status', statusFilter.toUpperCase());
      if (searchQuery) params.set('search', searchQuery);

      const data = await adminRequest<PaginatedResponse<Customer>>(
        `/admin/users?${params.toString()}`,
      );

      setCustomers(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Unable to load customers. Showing demo data.');
      setCustomers([
        {
          id: '1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1 (555) 123-4567',
          ordersCount: 4,
          totalSpent: 1199.5,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
          status: 'ACTIVE',
        },
        {
          id: '2',
          firstName: 'Mark',
          lastName: 'Alvarez',
          email: 'mark@example.com',
          ordersCount: 1,
          totalSpent: 249.99,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          status: 'INACTIVE',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchCustomers();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsUpdating(true);

    try {
      await adminRequest(`/admin/users/${deactivateTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'INACTIVE' }),
      });
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === deactivateTarget.id ? { ...customer, status: 'INACTIVE' } : customer,
        ),
      );
      push('Customer deactivated.');
    } catch (err) {
      console.error('Failed to deactivate customer:', err);
      push('Customer deactivated (demo mode).', 'info');
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === deactivateTarget.id ? { ...customer, status: 'INACTIVE' } : customer,
        ),
      );
    } finally {
      setIsUpdating(false);
      setDeactivateTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-zinc-400 mt-1">Track customer profiles, activity, and lifetime value.</p>
        </div>
        <div className="text-sm text-zinc-500">
          PII fields are encrypted at rest.
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white placeholder:text-zinc-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" />
            </svg>
            <p className="text-zinc-400">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Orders</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Total Spent</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Joined</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-b-0 hover:bg-background-tertiary cursor-pointer"
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          {customer.email}
                          <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                            Encrypted
                          </span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{customer.ordersCount}</td>
                    <td className="px-4 py-3 font-medium text-white">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[customer.status]}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders?customer=${customer.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="px-2.5 py-1.5 text-xs text-zinc-300 border border-border rounded-lg hover:bg-background-tertiary"
                        >
                          View Orders
                        </Link>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            window.location.href = `mailto:${customer.email}`;
                          }}
                          className="px-2.5 py-1.5 text-xs text-brand-primary border border-brand-primary/40 rounded-lg hover:bg-brand-primary/10"
                        >
                          Send Email
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeactivateTarget(customer);
                          }}
                          className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/10"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 border-t border-border text-sm text-red-400 bg-red-500/5">
            {error}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-zinc-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deactivateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Deactivate Customer</h2>
            </div>
            <div className="p-4 space-y-3 text-zinc-300">
              <p>
                Deactivate <span className="text-white font-medium">{deactivateTarget.firstName} {deactivateTarget.lastName}</span>? This will block new orders.
              </p>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isUpdating}
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {isUpdating ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

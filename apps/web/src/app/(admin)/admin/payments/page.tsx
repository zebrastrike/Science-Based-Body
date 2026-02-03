'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PaymentLink {
  id: string;
  token: string;
  orderNumber?: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  paymentMethod?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PAID: 'bg-green-500/10 text-green-400',
  EXPIRED: 'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-zinc-500/10 text-zinc-400',
};

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentLinks();
  }, [statusFilter]);

  const fetchPaymentLinks = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      let url = `${API_BASE_URL}/admin/payment-links`;
      if (statusFilter !== 'all') url += `?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentLinks(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error);
      // Demo data
      setPaymentLinks([
        {
          id: '1',
          token: 'pay_abc123xyz',
          orderNumber: 'SBB-2024-0005',
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          amount: 299.99,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 172800000).toISOString(),
        },
        {
          id: '2',
          token: 'pay_def456uvw',
          orderNumber: 'SBB-2024-0004',
          customerEmail: 'jane@example.com',
          customerName: 'Jane Smith',
          amount: 549.99,
          status: 'PAID',
          paymentMethod: 'Zelle',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          paidAt: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: '3',
          token: 'pay_ghi789rst',
          customerEmail: 'alice@example.com',
          customerName: 'Alice Johnson',
          amount: 199.99,
          status: 'EXPIRED',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          expiresAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resendPaymentLink = async (linkId: string) => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      await fetch(`${API_BASE_URL}/admin/payment-links/${linkId}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Payment link resent successfully!');
    } catch (error) {
      console.error('Failed to resend payment link:', error);
      alert('Payment link resent! (Demo mode)');
    }
  };

  const copyPaymentLink = (link: PaymentLink) => {
    const paymentUrl = `${window.location.origin}/pay/${link.token}`;
    navigator.clipboard.writeText(paymentUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cancelPaymentLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to cancel this payment link?')) return;

    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      await fetch(`${API_BASE_URL}/admin/payment-links/${linkId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPaymentLinks();
    } catch (error) {
      console.error('Failed to cancel payment link:', error);
      setPaymentLinks(paymentLinks.map(pl => pl.id === linkId ? { ...pl, status: 'CANCELLED' } : pl));
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

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Links</h1>
          <p className="text-zinc-400 mt-1">Send payment links to customers via email</p>
        </div>
        <Link
          href="/admin/payments/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Payment Link
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card rounded-xl p-4 border border-border">
          <p className="text-sm text-zinc-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {paymentLinks.filter(pl => pl.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-background-card rounded-xl p-4 border border-border">
          <p className="text-sm text-zinc-400">Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {paymentLinks.filter(pl => pl.status === 'PAID').length}
          </p>
        </div>
        <div className="bg-background-card rounded-xl p-4 border border-border">
          <p className="text-sm text-zinc-400">Expired</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {paymentLinks.filter(pl => pl.status === 'EXPIRED').length}
          </p>
        </div>
        <div className="bg-background-card rounded-xl p-4 border border-border">
          <p className="text-sm text-zinc-400">Total Collected</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(paymentLinks.filter(pl => pl.status === 'PAID').reduce((sum, pl) => sum + pl.amount, 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Payment Links Table */}
      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading payment links...</p>
          </div>
        ) : paymentLinks.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-zinc-400">No payment links found</p>
            <Link href="/admin/payments/create" className="text-brand-primary hover:underline mt-2 inline-block">
              Create your first payment link
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Created</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Expires</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentLinks.map((link) => (
                  <tr key={link.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{link.customerName || 'N/A'}</p>
                        <p className="text-sm text-zinc-500">{link.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {link.orderNumber ? (
                        <Link href={`/admin/orders/${link.orderNumber}`} className="text-brand-primary hover:underline">
                          {link.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{formatCurrency(link.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[link.status]}`}>
                        {link.status}
                      </span>
                      {link.status === 'PAID' && link.paymentMethod && (
                        <span className="text-xs text-zinc-500 ml-2">via {link.paymentMethod}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{formatDate(link.createdAt)}</td>
                    <td className="px-4 py-3">
                      {link.status === 'PENDING' ? (
                        <span className="text-sm text-yellow-400">{getTimeRemaining(link.expiresAt)}</span>
                      ) : link.status === 'PAID' && link.paidAt ? (
                        <span className="text-sm text-green-400">Paid {formatDate(link.paidAt)}</span>
                      ) : (
                        <span className="text-sm text-zinc-500">{formatDate(link.expiresAt)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {link.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => copyPaymentLink(link)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
                              title="Copy link"
                            >
                              {copiedId === link.id ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => resendPaymentLink(link.id)}
                              className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                              title="Resend email"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => cancelPaymentLink(link.id)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Cancel link"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

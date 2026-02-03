'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  itemCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  PROCESSING: 'bg-blue-500/10 text-blue-400',
  PAID: 'bg-green-500/10 text-green-400',
  SHIPPED: 'bg-purple-500/10 text-purple-400',
  DELIVERED: 'bg-green-500/10 text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-zinc-500/10 text-zinc-400',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  AWAITING_PAYMENT: 'bg-orange-500/10 text-orange-400',
  PAID: 'bg-green-500/10 text-green-400',
  FAILED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-zinc-500/10 text-zinc-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      let url = `${API_BASE_URL}/admin/orders?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (dateFilter !== 'all') url += `&dateRange=${dateFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Demo data
      setOrders([
        {
          id: '1',
          orderNumber: 'SBB-2024-0001',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          totalAmount: 249.99,
          subtotal: 249.99,
          shippingCost: 0,
          discountAmount: 0,
          status: 'PENDING',
          paymentStatus: 'AWAITING_PAYMENT',
          shippingStatus: 'NOT_SHIPPED',
          itemCount: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          orderNumber: 'SBB-2024-0002',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          totalAmount: 499.99,
          subtotal: 499.99,
          shippingCost: 0,
          discountAmount: 0,
          status: 'PAID',
          paymentStatus: 'PAID',
          shippingStatus: 'NOT_SHIPPED',
          itemCount: 3,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          orderNumber: 'SBB-2024-0003',
          customerName: 'Alice Johnson',
          customerEmail: 'alice@example.com',
          totalAmount: 189.99,
          subtotal: 189.99,
          shippingCost: 0,
          discountAmount: 0,
          status: 'SHIPPED',
          paymentStatus: 'PAID',
          shippingStatus: 'SHIPPED',
          itemCount: 1,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-zinc-400 mt-1">Manage and process customer orders</p>
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

      {/* Filters */}
      <div className="bg-background-card rounded-xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number, customer name, or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white placeholder:text-zinc-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-zinc-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Items</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Total</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Payment</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Date</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-white hover:text-brand-primary">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{order.customerName}</p>
                        <p className="text-sm text-zinc-500">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{order.itemCount} items</td>
                    <td className="px-4 py-3 font-medium text-white">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-zinc-500/10 text-zinc-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${paymentStatusColors[order.paymentStatus] || 'bg-zinc-500/10 text-zinc-400'}`}>
                        {order.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
                          title="View order"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {order.paymentStatus === 'PAID' && order.shippingStatus === 'NOT_SHIPPED' && (
                          <Link
                            href={`/admin/shipping/${order.id}`}
                            className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                            title="Create shipping label"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-zinc-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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
    </div>
  );
}

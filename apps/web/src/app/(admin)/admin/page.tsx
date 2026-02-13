'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  lowStockProducts: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  createdAt: string;
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

const shippingStatusColors: Record<string, string> = {
  NOT_SHIPPED: 'bg-zinc-500/10 text-zinc-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  LABEL_CREATED: 'bg-blue-500/10 text-blue-400',
  IN_TRANSIT: 'bg-purple-500/10 text-purple-400',
  OUT_FOR_DELIVERY: 'bg-purple-500/10 text-purple-400',
  DELIVERED: 'bg-green-500/10 text-green-400',
  EXCEPTION: 'bg-red-500/10 text-red-400',
  RETURNED: 'bg-red-500/10 text-red-400',
};

const quickActions = [
  {
    name: 'Create Shipping Label',
    description: 'Generate label for pending order',
    href: '/admin/shipping',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    ),
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    name: 'Send Payment Link',
    description: 'Email payment link to customer',
    href: '/admin/payments/create',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-purple-500/10 text-purple-400',
  },
  {
    name: 'Add Product',
    description: 'Create new product listing',
    href: '/admin/products/new',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: 'bg-green-500/10 text-green-400',
  },
  {
    name: 'View All Orders',
    description: 'Manage customer orders',
    href: '/admin/orders',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'bg-orange-500/10 text-orange-400',
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    ordersThisWeek: 0,
    revenueThisWeek: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('accessToken');

    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/orders?limit=10&sort=createdAt:desc`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, nextStatus: string) => {
    const token = localStorage.getItem('accessToken');
    setUpdatingPaymentId(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      if (response.ok) {
        setRecentOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: nextStatus } : o)),
        );
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('accessToken');
    setUpdatingStatusId(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setRecentOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background-card rounded-xl p-6 border border-border animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-24 mb-3"></div>
              <div className="h-8 bg-zinc-800 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Orders Today</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.ordersToday}</p>
            </div>
            <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            <span className="text-brand-primary">+{stats.ordersThisWeek}</span> this week
          </p>
        </div>

        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Revenue Today</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.revenueToday)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            <span className="text-green-400">{formatCurrency(stats.revenueThisWeek)}</span> this week
          </p>
        </div>

        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Pending Orders</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2">Awaiting action</p>
        </div>

        <div className="bg-background-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Low Stock</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.lowStockProducts}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2">Products need restock</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-background-card rounded-xl p-4 border border-border hover:border-zinc-700 transition-colors group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                {action.icon}
              </div>
              <h3 className="font-medium text-white group-hover:text-brand-primary transition-colors">
                {action.name}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="bg-background-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Total</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Payment</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Shipping</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const canCreateLabel =
                      order.paymentStatus === 'PAID' &&
                      (!order.shippingStatus || order.shippingStatus === 'NOT_SHIPPED' || order.shippingStatus === 'PENDING');
                    return (
                      <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-medium text-white hover:text-brand-primary">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white text-sm">{order.customerName}</p>
                          <p className="text-xs text-zinc-500">{order.customerEmail}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingStatusId === order.id}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusColors[order.status] || 'bg-zinc-500/10 text-zinc-400'} ${updatingStatusId === order.id ? 'opacity-60' : ''}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="PAID">Paid</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={order.paymentStatus === 'PAID'}
                            onClick={() =>
                              updatePaymentStatus(
                                order.id,
                                order.paymentStatus === 'PAID' ? 'AWAITING_PAYMENT' : 'PAID',
                              )
                            }
                            disabled={updatingPaymentId === order.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              order.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-zinc-600'
                            } ${updatingPaymentId === order.id ? 'opacity-60 cursor-wait' : ''}`}
                            title={order.paymentStatus === 'PAID' ? 'Mark unpaid' : 'Mark paid'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                order.paymentStatus === 'PAID' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              shippingStatusColors[order.shippingStatus] || 'bg-zinc-500/10 text-zinc-400'
                            }`}
                          >
                            {order.shippingStatus ? order.shippingStatus.replace(/_/g, ' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canCreateLabel && (
                              <Link
                                href={`/admin/shipping/${order.id}`}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Create shipping label"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                              </Link>
                            )}
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                              title="View order"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

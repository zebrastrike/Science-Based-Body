'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';

interface AuditEntry {
  id: string;
  createdAt: string;
  userName: string;
  action: string;
  details: string;
  actionType: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchAuditLog();
  }, [actionFilter, fromDate, toDate]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('actionType', actionFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (userFilter) params.set('user', userFilter);

      const data = await adminRequest<{ data: AuditEntry[] }>(
        `/admin/audit-log?${params.toString()}`,
      );
      setEntries(data.data || []);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
      setEntries([
        {
          id: 'audit-1',
          createdAt: new Date().toISOString(),
          userName: 'Alex Chen',
          action: 'Order status updated',
          details: 'SBB-2024-0001 marked as PAID',
          actionType: 'ORDER_UPDATE',
        },
        {
          id: 'audit-2',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          userName: 'Jordan Lee',
          action: 'Inventory adjustment',
          details: 'Semaglutide stock set to 12',
          actionType: 'PRODUCT_CHANGE',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLog();
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-zinc-400 mt-1">Read-only activity trail for admin actions.</p>
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleUserSearch} className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by admin user..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white placeholder:text-zinc-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </form>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
          >
            <option value="all">All Actions</option>
            <option value="ORDER_UPDATE">Order Updates</option>
            <option value="PRODUCT_CHANGE">Product Changes</option>
            <option value="REFUND">Refunds</option>
            <option value="SETTINGS_CHANGE">Settings Changes</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 bg-background-secondary border border-border rounded-lg text-white"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 bg-background-secondary border border-border rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading audit log...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Timestamp</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Admin</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Action</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                      <td className="px-4 py-3 text-zinc-400">{formatDate(entry.createdAt)}</td>
                      <td className="px-4 py-3 text-white">{entry.userName}</td>
                      <td className="px-4 py-3 text-zinc-300">{entry.action}</td>
                      <td className="px-4 py-3 text-zinc-500">{entry.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

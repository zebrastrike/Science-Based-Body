'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface ReturnItem {
  productName: string;
  quantity: number;
  total: number;
}

interface ReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: string;
  refundAmount: number;
  items: ReturnItem[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  APPROVED: 'bg-green-500/10 text-green-400',
  REJECTED: 'bg-red-500/10 text-red-400',
  COMPLETED: 'bg-zinc-500/10 text-zinc-400',
};

export default function ReturnsPage() {
  const { toasts, push, dismiss } = useToasts();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailTarget, setDetailTarget] = useState<ReturnRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReturnRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await adminRequest<{ data: ReturnRequest[] }>(
        `/admin/returns?${params.toString()}`,
      );
      setReturns(data.data || []);
    } catch (err) {
      console.error('Failed to fetch returns:', err);
      setReturns([
        {
          id: 'ret-1',
          orderNumber: 'SBB-2024-0123',
          customerName: 'Jane Smith',
          reason: 'Damaged on arrival',
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          refundAmount: 199.99,
          items: [{ productName: 'Semaglutide 5mg', quantity: 1, total: 199.99 }],
        },
        {
          id: 'ret-2',
          orderNumber: 'SBB-2024-0111',
          customerName: 'Marcus Lee',
          reason: 'Ordered wrong concentration',
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          refundAmount: 89.99,
          items: [{ productName: 'BPC-157 5mg', quantity: 1, total: 89.99 }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (returnId: string, status: ReturnRequest['status'], reason?: string) => {
    try {
      await adminRequest(`/admin/returns/${returnId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      setReturns((prev) =>
        prev.map((request) => (request.id === returnId ? { ...request, status } : request)),
      );
      push(`Return ${status.toLowerCase()}.`);
    } catch (err) {
      console.error('Failed to update return:', err);
      setReturns((prev) =>
        prev.map((request) => (request.id === returnId ? { ...request, status } : request)),
      );
      push(`Return ${status.toLowerCase()} (demo mode).`, 'info');
    }
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(dateString),
    );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Returns</h1>
          <p className="text-zinc-400 mt-1">Manage refund and return requests.</p>
        </div>
        <div className="text-sm text-zinc-500">Customer PII is encrypted at rest.</div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading returns...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Order</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Customer</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Reason</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Requested</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((request) => (
                  <tr key={request.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3 text-white font-medium">{request.orderNumber}</td>
                    <td className="px-4 py-3 text-zinc-400">{request.customerName}</td>
                    <td className="px-4 py-3 text-zinc-400">{request.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(request.requestedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailTarget(request)}
                          className="px-2.5 py-1.5 text-xs text-zinc-300 border border-border rounded-lg hover:bg-background-tertiary"
                        >
                          View
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateStatus(request.id, 'APPROVED')}
                              className="px-2.5 py-1.5 text-xs text-green-400 border border-green-500/40 rounded-lg hover:bg-green-500/10"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectTarget(request);
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/10"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(request.id, 'COMPLETED')}
                            className="px-2.5 py-1.5 text-xs text-brand-primary border border-brand-primary/40 rounded-lg hover:bg-brand-primary/10"
                          >
                            Mark Complete
                          </button>
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

      {detailTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-white">Return {detailTarget.orderNumber}</h2>
              <button onClick={() => setDetailTarget(null)} className="text-zinc-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 text-zinc-300">
              <p><span className="text-zinc-500">Customer:</span> {detailTarget.customerName}</p>
              <p><span className="text-zinc-500">Reason:</span> {detailTarget.reason}</p>
              <p><span className="text-zinc-500">Refund:</span> {formatCurrency(detailTarget.refundAmount)}</p>
              <div className="border border-border rounded-lg p-3 space-y-2">
                {detailTarget.items.map((item, index) => (
                  <div key={`${detailTarget.id}-${index}`} className="flex items-center justify-between">
                    <span className="text-white">{item.productName}</span>
                    <span className="text-zinc-400">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end">
              <button
                onClick={() => setDetailTarget(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Reject Return</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-zinc-300">
                Provide a reason for rejecting <span className="text-white font-semibold">{rejectTarget.orderNumber}</span>.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
              ></textarea>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateStatus(rejectTarget.id, 'REJECTED', rejectReason);
                  setRejectTarget(null);
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

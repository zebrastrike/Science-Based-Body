'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface Discount {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  usageCount: number;
  usageLimit?: number;
  perUserLimit?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt?: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'INACTIVE';
  productIds?: string[];
  categoryIds?: string[];
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  INACTIVE: 'bg-zinc-500/10 text-zinc-400',
};

export default function DiscountsPage() {
  const { toasts, push, dismiss } = useToasts();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Discount | null>(null);
  const [formState, setFormState] = useState<Discount>({
    id: '',
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    usageCount: 0,
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const data = await adminRequest<{ data: Discount[] }>('/admin/discounts');
      setDiscounts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
      setDiscounts([
        {
          id: 'disc-1',
          code: 'RESEARCH10',
          type: 'PERCENTAGE',
          value: 10,
          usageCount: 12,
          usageLimit: 100,
          minOrderAmount: 100,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          status: 'ACTIVE',
        },
        {
          id: 'disc-2',
          code: 'FREESHIP',
          type: 'FREE_SHIPPING',
          value: 0,
          usageCount: 42,
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setFormState({
      id: '',
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      usageCount: 0,
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const openEdit = (discount: Discount) => {
    setFormState(discount);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        code: formState.code,
        description: formState.description || undefined,
        type: formState.type,
        value: formState.value,
        minOrderAmount: formState.minOrderAmount || undefined,
        maxDiscountAmount: formState.maxDiscountAmount || undefined,
        usageLimit: formState.usageLimit || undefined,
        perUserLimit: formState.perUserLimit || undefined,
        startsAt: formState.startsAt || undefined,
        expiresAt: formState.expiresAt || undefined,
        productIds: formState.productIds?.length ? formState.productIds : undefined,
        categoryIds: formState.categoryIds?.length ? formState.categoryIds : undefined,
      };

      if (formState.id) {
        const { code, type, ...updatePayload } = payload;
        await adminRequest(`/admin/discounts/${formState.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });
        setDiscounts((prev) => prev.map((disc) => (disc.id === formState.id ? formState : disc)));
        push('Discount updated.');
      } else {
        const response = await adminRequest<Discount>('/admin/discounts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setDiscounts((prev) => [response || { ...formState, id: `new-${Date.now()}` }, ...prev]);
        push('Discount created.');
      }
    } catch (err) {
      console.error('Failed to save discount:', err);
      push('Discount saved (demo mode).', 'info');
      if (formState.id) {
        setDiscounts((prev) => prev.map((disc) => (disc.id === formState.id ? formState : disc)));
      } else {
        setDiscounts((prev) => [{ ...formState, id: `demo-${Date.now()}` }, ...prev]);
      }
    } finally {
      setShowModal(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await adminRequest(`/admin/discounts/${confirmDeactivate.id}`, {
        method: 'DELETE',
      });
      setDiscounts((prev) =>
        prev.map((disc) => (disc.id === confirmDeactivate.id ? { ...disc, status: 'INACTIVE' } : disc)),
      );
      push('Discount deactivated.');
    } catch (err) {
      console.error('Failed to deactivate discount:', err);
      setDiscounts((prev) =>
        prev.map((disc) => (disc.id === confirmDeactivate.id ? { ...disc, status: 'INACTIVE' } : disc)),
      );
      push('Discount deactivated (demo mode).', 'info');
    } finally {
      setConfirmDeactivate(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      push('Code copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy code:', err);
      push('Copy failed.', 'error');
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === 'PERCENTAGE') return `${discount.value}%`;
    if (discount.type === 'FIXED_AMOUNT') return `$${discount.value}`;
    return 'Free Shipping';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(dateString),
    );
  };

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Discounts</h1>
          <p className="text-zinc-400 mt-1">Create and manage promotional codes.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Discount
        </button>
      </div>

      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading discounts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Code</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Type</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Value</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Usage</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Expiry</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3 text-white font-medium">{discount.code}</td>
                    <td className="px-4 py-3 text-zinc-400">{discount.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-white">{formatValue(discount)}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {discount.usageCount}
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(discount.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[discount.status]}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyCode(discount.code)}
                          className="px-2.5 py-1.5 text-xs text-zinc-300 border border-border rounded-lg hover:bg-background-tertiary"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => openEdit(discount)}
                          className="px-2.5 py-1.5 text-xs text-brand-primary border border-brand-primary/40 rounded-lg hover:bg-brand-primary/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeactivate(discount)}
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-lg">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">{formState.id ? 'Edit Discount' : 'Create Discount'}</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Code</label>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                    placeholder="RESEARCH10"
                    disabled={!!formState.id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Type</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value as Discount['type'] })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                    disabled={!!formState.id}
                  >
                    <option value="PERCENTAGE">Percentage off</option>
                    <option value="FIXED_AMOUNT">Fixed amount</option>
                    <option value="FREE_SHIPPING">Free shipping</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                <input
                  type="text"
                  value={formState.description || ''}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  placeholder="e.g. 10% off for new customers"
                />
              </div>

              {formState.type !== 'FREE_SHIPPING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      {formState.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}
                    </label>
                    <input
                      type="number"
                      value={formState.value}
                      onChange={(e) => setFormState({ ...formState, value: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                    />
                  </div>
                  {formState.type === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Max Discount Cap ($)</label>
                      <input
                        type="number"
                        value={formState.maxDiscountAmount || 0}
                        onChange={(e) => setFormState({ ...formState, maxDiscountAmount: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                        placeholder="0 = no cap"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Min Order Amount ($)</label>
                  <input
                    type="number"
                    value={formState.minOrderAmount || 0}
                    onChange={(e) => setFormState({ ...formState, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Usage Limit (total)</label>
                  <input
                    type="number"
                    value={formState.usageLimit || 0}
                    onChange={(e) => setFormState({ ...formState, usageLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Per-User Limit</label>
                  <input
                    type="number"
                    value={formState.perUserLimit || 0}
                    onChange={(e) => setFormState({ ...formState, perUserLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Starts At</label>
                  <input
                    type="date"
                    value={formState.startsAt?.slice(0, 10) || ''}
                    onChange={(e) => setFormState({ ...formState, startsAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Expires At</label>
                <input
                  type="date"
                  value={formState.expiresAt?.slice(0, 10) || ''}
                  onChange={(e) => setFormState({ ...formState, expiresAt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Restrict to Product IDs (comma separated)</label>
                <input
                  type="text"
                  value={formState.productIds?.join(', ') || ''}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      productIds: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  placeholder="Leave empty for all products"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Restrict to Categories (comma separated)</label>
                <input
                  type="text"
                  value={formState.categoryIds?.join(', ') || ''}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      categoryIds: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  placeholder="e.g. PEPTIDES, RESEARCH_CHEMICALS"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark"
              >
                Save Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Deactivate Discount</h2>
            </div>
            <div className="p-4 text-zinc-300">
              Deactivate code <span className="text-white font-semibold">{confirmDeactivate.code}</span>?
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

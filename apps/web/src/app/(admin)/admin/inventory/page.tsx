'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminRequest } from '@/lib/api';
import { ToastStack, useToasts } from '@/components/admin/Toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  variantsCount: number;
  stockLevel: number;
  status: 'ACTIVE' | 'INACTIVE';
  batchNumber?: string;
  coaStatus?: 'AVAILABLE' | 'PENDING' | 'MISSING';
}

export default function InventoryPage() {
  const { toasts, push, dismiss } = useToasts();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStock, setBulkStock] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, [categoryFilter]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);

      const data = await adminRequest<{ data: InventoryItem[] }>(
        `/admin/products?${params.toString()}`,
      );

      setItems(
        (data.data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryName: product.categoryName || product.category?.name || 'Uncategorized',
          variantsCount: product.variants?.length || 0,
          stockLevel: product.stockLevel ?? product.inventory?.stock ?? 0,
          status: product.isActive ? 'ACTIVE' : 'INACTIVE',
          batchNumber: product.batchNumber || product.inventory?.batchNumber,
          coaStatus: product.coaStatus || product.inventory?.coaStatus || 'PENDING',
        })),
      );
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setItems([
        {
          id: '1',
          name: 'Semaglutide',
          sku: 'SEMA-BASE',
          categoryName: 'Metabolic',
          variantsCount: 2,
          stockLevel: 6,
          status: 'ACTIVE',
          batchNumber: 'BATCH-2024-01',
          coaStatus: 'AVAILABLE',
        },
        {
          id: '2',
          name: 'BPC-157',
          sku: 'BPC157-BASE',
          categoryName: 'Recovery',
          variantsCount: 1,
          stockLevel: 22,
          status: 'ACTIVE',
          batchNumber: 'BATCH-2023-11',
          coaStatus: 'PENDING',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminRequest<{ name: string; slug: string }[]>('/catalog/categories');
      setCategories(data);
    } catch (err) {
      setCategories([
        { name: 'Metabolic', slug: 'metabolic' },
        { name: 'Recovery', slug: 'recovery' },
        { name: 'Skin', slug: 'skin' },
      ]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const updateStock = async (itemId: string, newStock: number) => {
    setIsUpdating(true);
    try {
      await adminRequest(`/admin/inventory/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ stockLevel: newStock }),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, stockLevel: newStock } : item)),
      );
      push('Stock updated.');
    } catch (err) {
      console.error('Failed to update stock:', err);
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, stockLevel: newStock } : item)),
      );
      push('Stock updated (demo mode).', 'info');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selected.length === 0) return;
    setIsUpdating(true);
    try {
      await Promise.all(
        selected.map((itemId) =>
          adminRequest(`/admin/inventory/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ stockLevel: bulkStock }),
          }),
        ),
      );
      setItems((prev) =>
        prev.map((item) =>
          selected.includes(item.id) ? { ...item, stockLevel: bulkStock } : item,
        ),
      );
      push('Bulk stock update applied.');
    } catch (err) {
      console.error('Bulk update failed:', err);
      setItems((prev) =>
        prev.map((item) =>
          selected.includes(item.id) ? { ...item, stockLevel: bulkStock } : item,
        ),
      );
      push('Bulk update applied (demo mode).', 'info');
    } finally {
      setIsUpdating(false);
      setBulkModalOpen(false);
      setSelected([]);
    }
  };

  const filteredCount = useMemo(() => items.length, [items]);

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-zinc-400 mt-1">Monitor stock levels and batch/COA status.</p>
        </div>
        <button
          onClick={() => setBulkModalOpen(true)}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
        >
          Bulk Update ({selected.length})
        </button>
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
                placeholder="Search by product name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white placeholder:text-zinc-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </form>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === items.length && items.length > 0}
                      onChange={(e) => setSelected(e.target.checked ? items.map((item) => item.id) : [])}
                      className="accent-brand-primary"
                    />
                  </th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Product</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">SKU</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Variants</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Stock</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Batch / COA</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lowStock = item.stockLevel < 10;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(item.id)}
                          onChange={(e) =>
                            setSelected((prev) =>
                              e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                            )
                          }
                          className="accent-brand-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-primary/10 text-brand-primary">
                            Research Use Only
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{item.sku}</td>
                      <td className="px-4 py-3 text-zinc-400">{item.variantsCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStock(item.id, Math.max(0, item.stockLevel - 1))}
                            className="w-7 h-7 rounded-lg border border-border text-zinc-400 hover:text-white hover:bg-background-tertiary"
                          >
                            -
                          </button>
                          <span className={`min-w-[48px] text-center font-semibold ${lowStock ? 'text-red-400' : 'text-white'}`}>
                            {item.stockLevel}
                          </span>
                          <button
                            onClick={() => updateStock(item.id, item.stockLevel + 1)}
                            className="w-7 h-7 rounded-lg border border-border text-zinc-400 hover:text-white hover:bg-background-tertiary"
                          >
                            +
                          </button>
                        </div>
                        {lowStock && (
                          <p className="text-xs text-red-400 mt-1">Low stock</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{item.batchNumber || 'Batch TBD'}</p>
                        <span className="text-xs text-zinc-500">
                          COA {item.coaStatus?.toLowerCase() || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCount === 0 && (
              <div className="p-8 text-center text-zinc-500">No inventory items found.</div>
            )}
          </div>
        )}

        {isUpdating && (
          <div className="px-4 py-3 border-t border-border text-sm text-zinc-400">
            Updating inventory...
          </div>
        )}
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl border border-border w-full max-w-md">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-white">Bulk Stock Update</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-400">
                Update stock for {selected.length} selected products.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">New Stock Level</label>
                <input
                  type="number"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white"
                  min={0}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={isUpdating}
                className="px-4 py-2 text-sm bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Apply Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

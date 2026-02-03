'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  basePrice: number;
  compareAtPrice?: number;
  categoryName: string;
  categorySlug: string;
  variants: ProductVariant[];
  isFeatured: boolean;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, categoryFilter, activeFilter]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      let url = `${API_BASE_URL}/admin/products?page=${pagination.page}&limit=${pagination.limit}`;
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;
      if (activeFilter !== 'all') url += `&isActive=${activeFilter === 'active'}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Demo data
      setProducts([
        {
          id: '1',
          name: 'Semaglutide',
          slug: 'semaglutide',
          sku: 'SEMA-BASE',
          shortDescription: 'GLP-1 receptor agonist for metabolic research',
          basePrice: 99.99,
          compareAtPrice: 149.99,
          categoryName: 'Metabolic',
          categorySlug: 'metabolic',
          variants: [
            { id: 'v1', name: '5mg', sku: 'SEMA-5MG', price: 99.99, isActive: true },
            { id: 'v2', name: '10mg', sku: 'SEMA-10MG', price: 179.99, isActive: true },
          ],
          isFeatured: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'BPC-157',
          slug: 'bpc-157',
          sku: 'BPC157-BASE',
          shortDescription: 'Gastric pentadecapeptide for tissue research',
          basePrice: 49.99,
          categoryName: 'Recovery',
          categorySlug: 'recovery',
          variants: [
            { id: 'v3', name: '5mg', sku: 'BPC157-5MG', price: 49.99, isActive: true },
          ],
          isFeatured: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'GHK-Cu',
          slug: 'ghk-cu',
          sku: 'GHKCU-BASE',
          shortDescription: 'Copper tripeptide for skin research',
          basePrice: 39.99,
          categoryName: 'Skin',
          categorySlug: 'skin',
          variants: [
            { id: 'v4', name: '50mg', sku: 'GHKCU-50MG', price: 39.99, isActive: true },
          ],
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/catalog/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      setCategories([
        { name: 'Metabolic', slug: 'metabolic' },
        { name: 'Recovery', slug: 'recovery' },
        { name: 'Skin', slug: 'skin' },
        { name: 'Cognitive', slug: 'cognitive' },
        { name: 'Growth', slug: 'growth' },
        { name: 'Immune', slug: 'immune' },
      ]);
    }
  };

  const toggleProductActive = async (productId: string, isActive: boolean) => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      // Update locally for demo
      setProducts(products.map(p => p.id === productId ? { ...p, isActive: !isActive } : p));
    }
  };

  const toggleFeatured = async (productId: string, isFeatured: boolean) => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      setProducts(products.map(p => p.id === productId ? { ...p, isFeatured: !isFeatured } : p));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchProducts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-zinc-400 mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
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
                placeholder="Search by product name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white placeholder:text-zinc-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </form>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          {/* Active Filter */}
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-background-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-zinc-400">No products found</p>
            <Link href="/admin/products/new" className="text-brand-primary hover:underline mt-2 inline-block">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Product</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Category</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Price</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Variants</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Featured</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Status</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-background-tertiary">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-background-tertiary rounded-lg flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/products/${product.id}`} className="font-medium text-white hover:text-brand-primary">
                            {product.name}
                          </Link>
                          <p className="text-sm text-zinc-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-white">{formatCurrency(product.basePrice)}</span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-zinc-500 line-through ml-2">
                            {formatCurrency(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFeatured(product.id, product.isFeatured)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.isFeatured
                            ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                            : 'text-zinc-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                        }`}
                        title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <svg className="w-5 h-5" fill={product.isFeatured ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleProductActive(product.id, product.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          product.isActive ? 'bg-brand-primary' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <a
                          href={`/shop/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
                          title="View on site"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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

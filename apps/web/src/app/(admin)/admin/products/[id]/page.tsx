'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryName: string;
  variants: ProductVariant[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const isNew = productId === 'new';

  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    slug: '',
    sku: '',
    shortDescription: '',
    description: '',
    basePrice: 0,
    categoryId: '',
    variants: [],
    tags: [],
    isFeatured: false,
    isActive: true,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
    if (!isNew) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      // Demo data
      setProduct({
        id: productId,
        name: 'Semaglutide',
        slug: 'semaglutide',
        sku: 'SEMA-BASE',
        shortDescription: 'GLP-1 receptor agonist for metabolic research',
        description: 'Semaglutide is a GLP-1 receptor agonist used in metabolic research. This peptide has been extensively studied for its effects on glucose metabolism and appetite regulation in research settings.',
        basePrice: 99.99,
        compareAtPrice: 149.99,
        categoryId: 'cat-1',
        categoryName: 'Metabolic',
        variants: [
          { id: 'v1', name: '5mg', sku: 'SEMA-5MG', price: 99.99, isActive: true },
          { id: 'v2', name: '10mg', sku: 'SEMA-10MG', price: 179.99, isActive: true },
        ],
        tags: ['GLP-1', 'metabolic', 'research'],
        isFeatured: true,
        isActive: true,
        metaTitle: 'Semaglutide Research Peptide | Science Based Body',
        metaDescription: 'High-purity Semaglutide for research purposes. Third-party tested with COA included.',
      });
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
        { id: 'cat-1', name: 'Metabolic', slug: 'metabolic' },
        { id: 'cat-2', name: 'Recovery', slug: 'recovery' },
        { id: 'cat-3', name: 'Skin', slug: 'skin' },
        { id: 'cat-4', name: 'Cognitive', slug: 'cognitive' },
        { id: 'cat-5', name: 'Growth', slug: 'growth' },
        { id: 'cat-6', name: 'Immune', slug: 'immune' },
      ]);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setProduct({
      ...product,
      name,
      slug: product.slug || generateSlug(name),
    });
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `new-${Date.now()}`,
      name: '',
      sku: '',
      price: product.basePrice || 0,
      isActive: true,
    };
    setProduct({
      ...product,
      variants: [...(product.variants || []), newVariant],
    });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const variants = [...(product.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    setProduct({ ...product, variants });
  };

  const removeVariant = (index: number) => {
    const variants = [...(product.variants || [])];
    variants.splice(index, 1);
    setProduct({ ...product, variants });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!product.name?.trim()) newErrors.name = 'Product name is required';
    if (!product.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!product.categoryId) newErrors.categoryId = 'Category is required';
    if (!product.basePrice || product.basePrice <= 0) newErrors.basePrice = 'Valid price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const url = isNew
        ? `${API_BASE_URL}/admin/products`
        : `${API_BASE_URL}/admin/products/${productId}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Product saved! (Demo mode)');
      router.push('/admin/products');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 text-zinc-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? 'Add Product' : `Edit ${product.name}`}
          </h1>
          <p className="text-zinc-400">{isNew ? 'Create a new product listing' : 'Update product information'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={product.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                    errors.name ? 'border-red-500' : 'border-border'
                  } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
                  placeholder="e.g., Semaglutide"
                />
                {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    SKU <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.sku || ''}
                    onChange={(e) => setProduct({ ...product, sku: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                      errors.sku ? 'border-red-500' : 'border-border'
                    } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
                    placeholder="e.g., SEMA-BASE"
                  />
                  {errors.sku && <p className="text-sm text-red-400 mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">URL Slug</label>
                  <input
                    type="text"
                    value={product.slug || ''}
                    onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    placeholder="e.g., semaglutide"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Short Description</label>
                <input
                  type="text"
                  value={product.shortDescription || ''}
                  onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Brief description for product cards"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Description</label>
                <textarea
                  value={product.description || ''}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Detailed product description..."
                ></textarea>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Base Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.basePrice || ''}
                      onChange={(e) => setProduct({ ...product, basePrice: parseFloat(e.target.value) || 0 })}
                      className={`w-full pl-8 pr-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                        errors.basePrice ? 'border-red-500' : 'border-border'
                      } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.basePrice && <p className="text-sm text-red-400 mt-1">{errors.basePrice}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Compare at Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.compareAtPrice || ''}
                      onChange={(e) => setProduct({ ...product, compareAtPrice: parseFloat(e.target.value) || undefined })}
                      className="w-full pl-8 pr-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Original price for showing discount</p>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Variants</h2>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm text-brand-primary hover:underline"
                >
                  + Add Variant
                </button>
              </div>

              {(product.variants || []).length === 0 ? (
                <p className="text-zinc-500 text-center py-4">No variants added. Click "Add Variant" to create size or dosage options.</p>
              ) : (
                <div className="space-y-3">
                  {(product.variants || []).map((variant, index) => (
                    <div key={variant.id} className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-background-tertiary border border-border rounded-lg text-white text-sm"
                        placeholder="Name (e.g., 5mg)"
                      />
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())}
                        className="w-32 px-3 py-2 bg-background-tertiary border border-border rounded-lg text-white text-sm"
                        placeholder="SKU"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-2 bg-background-tertiary border border-border rounded-lg text-white text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateVariant(index, 'isActive', !variant.isActive)}
                        className={`p-2 rounded-lg ${
                          variant.isActive ? 'text-green-400 bg-green-400/10' : 'text-zinc-500 bg-zinc-800'
                        }`}
                        title={variant.isActive ? 'Active' : 'Inactive'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">SEO</h2>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={product.metaTitle || ''}
                  onChange={(e) => setProduct({ ...product, metaTitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Page title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Meta Description</label>
                <textarea
                  value={product.metaDescription || ''}
                  onChange={(e) => setProduct({ ...product, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Description for search results"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">Status</h2>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Published</span>
                <button
                  type="button"
                  onClick={() => setProduct({ ...product, isActive: !product.isActive })}
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
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Featured</span>
                <button
                  type="button"
                  onClick={() => setProduct({ ...product, isFeatured: !product.isFeatured })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    product.isFeatured ? 'bg-brand-primary' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      product.isFeatured ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">Category</h2>

              <select
                value={product.categoryId || ''}
                onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                className={`w-full px-4 py-2.5 bg-background-secondary border rounded-lg text-white ${
                  errors.categoryId ? 'border-red-500' : 'border-border'
                } focus:border-brand-primary focus:ring-1 focus:ring-brand-primary`}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-sm text-red-400">{errors.categoryId}</p>}
            </div>

            {/* Tags */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-white">Tags</h2>

              <input
                type="text"
                value={(product.tags || []).join(', ')}
                onChange={(e) => setProduct({ ...product, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="w-full px-4 py-2.5 bg-background-secondary border border-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="Enter tags, separated by commas"
              />
              <p className="text-xs text-zinc-500">Tags help with search and organization</p>
            </div>

            {/* Actions */}
            <div className="bg-background-card rounded-xl border border-border p-6 space-y-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-4 py-2.5 bg-brand-primary text-black font-semibold rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
              </button>
              <Link
                href="/admin/products"
                className="block w-full px-4 py-2.5 text-center text-zinc-400 hover:text-white border border-border rounded-lg hover:bg-background-tertiary transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

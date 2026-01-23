'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';

// All products from the catalog
const allProducts = [
  // METABOLIC
  { id: 1, name: 'Semaglutide', slug: 'semaglutide', category: 'metabolic', price: 130, strength: '10mg', description: 'GLP-1 receptor agonist', tags: ['popular'] },
  { id: 2, name: 'Retatrutide', slug: 'retatrutide', category: 'metabolic', price: 129, strength: '10mg', description: 'Triple agonist (GIP/GLP-1/Glucagon)', tags: ['new'] },
  { id: 3, name: 'AOD-9604', slug: 'aod-9604', category: 'metabolic', price: 130, strength: '5mg', description: 'HGH fragment for metabolism', tags: [] },
  { id: 4, name: '5-Amino-1MQ', slug: '5-amino-1mq', category: 'metabolic', price: 89, strength: '5mg', description: 'NNMT enzyme inhibitor', tags: [] },
  { id: 5, name: 'SLU-PP-332', slug: 'slu-pp-332', category: 'metabolic', price: 169, strength: '5mg', description: 'ERR agonist', tags: ['new'] },

  // RECOVERY
  { id: 6, name: 'BPC-157', slug: 'bpc-157', category: 'recovery', price: 125, strength: '10mg', description: 'Gastric pentadecapeptide', tags: ['popular'] },
  { id: 7, name: 'TB-500', slug: 'tb-500', category: 'recovery', price: 180, strength: '10mg', description: 'Thymosin Beta-4 derivative', tags: ['popular'] },
  { id: 8, name: 'GHK-Cu', slug: 'ghk-cu', category: 'recovery', price: 125, strength: '100mg', description: 'Copper tripeptide', tags: [] },
  { id: 9, name: 'KPV', slug: 'kpv', category: 'recovery', price: 79, strength: '10mg', description: 'Alpha-MSH tripeptide', tags: [] },
  { id: 10, name: 'Thymosin Alpha-1', slug: 'thymosin-alpha-1', category: 'recovery', price: 120, strength: '10mg', description: 'Thymic peptide', tags: [] },

  // GROWTH HORMONE
  { id: 11, name: 'Tesamorelin', slug: 'tesamorelin', category: 'growth-hormone', price: 199, strength: '10mg', description: 'GHRH analog', tags: [] },
  { id: 12, name: 'Ipamorelin', slug: 'ipamorelin', category: 'growth-hormone', price: 99, strength: '10mg', description: 'Selective GHRP', tags: ['popular'] },
  { id: 13, name: 'CJC-1295 DAC', slug: 'cjc-1295-dac', category: 'growth-hormone', price: 189, strength: '5mg', description: 'Long-acting GHRH', tags: [] },
  { id: 14, name: 'IGF-1 LR3', slug: 'igf-1-lr3', category: 'growth-hormone', price: 49, strength: '0.1mg', description: 'Extended IGF-1', tags: [] },

  // NOOTROPIC
  { id: 15, name: 'Semax', slug: 'semax', category: 'nootropic', price: 79, strength: '10mg', description: 'ACTH-derived nootropic', tags: ['popular'] },
  { id: 16, name: 'Selank', slug: 'selank', category: 'nootropic', price: 89, strength: '10mg', description: 'Tuftsin analog', tags: [] },
  { id: 17, name: 'Pinealon', slug: 'pinealon', category: 'nootropic', price: 89, strength: '10mg', description: 'Pineal bioregulator', tags: [] },
  { id: 18, name: 'DSIP', slug: 'dsip', category: 'nootropic', price: 59, strength: '5mg', description: 'Delta sleep peptide', tags: [] },

  // LONGEVITY
  { id: 19, name: 'Epithalon', slug: 'epithalon', category: 'longevity', price: 69, strength: '10mg', description: 'Telomerase activator', tags: ['popular'] },
  { id: 20, name: 'NAD+', slug: 'nad-plus', category: 'longevity', price: 230, strength: '500mg', description: 'Cellular coenzyme', tags: ['popular'] },
  { id: 21, name: 'SS-31', slug: 'ss-31', category: 'longevity', price: 129, strength: '10mg', description: 'Mitochondrial peptide', tags: [] },

  // SPECIALTY
  { id: 22, name: 'PT-141', slug: 'pt-141', category: 'specialty', price: 69, strength: '10mg', description: 'Melanocortin agonist', tags: [] },
  { id: 23, name: 'Kisspeptin-10', slug: 'kisspeptin-10', category: 'specialty', price: 110, strength: '10mg', description: 'Hypothalamic peptide', tags: [] },
  { id: 24, name: 'hCG', slug: 'hcg', category: 'specialty', price: 109, strength: '5000 IU', description: 'Gonadotropin', tags: [] },
  { id: 25, name: 'Oxytocin', slug: 'oxytocin', category: 'specialty', price: 59, strength: '2mg', description: 'Neuropeptide', tags: [] },

  // BLENDS
  { id: 26, name: 'CJC-1295 + Ipamorelin', slug: 'cjc-1295-ipamorelin', category: 'blends', price: 129, strength: '10mg', description: 'GH secretagogue blend', tags: ['popular'] },
  { id: 27, name: 'BPC-157 + TB-500', slug: 'bpc-157-tb-500', category: 'blends', price: 129, strength: '10mg', description: 'Recovery blend', tags: ['popular'] },
  { id: 28, name: 'SNAP-8 + GHK-Cu Serum', slug: 'snap8-ghkcu-serum', category: 'blends', price: 100, strength: '30ml', description: 'Topical research serum', tags: [] },
];

const categories = [
  { id: 'all', name: 'All Products', count: allProducts.length },
  { id: 'metabolic', name: 'Metabolic', count: allProducts.filter(p => p.category === 'metabolic').length },
  { id: 'recovery', name: 'Recovery', count: allProducts.filter(p => p.category === 'recovery').length },
  { id: 'growth-hormone', name: 'Growth Hormone', count: allProducts.filter(p => p.category === 'growth-hormone').length },
  { id: 'nootropic', name: 'Nootropic', count: allProducts.filter(p => p.category === 'nootropic').length },
  { id: 'longevity', name: 'Longevity', count: allProducts.filter(p => p.category === 'longevity').length },
  { id: 'specialty', name: 'Specialty', count: allProducts.filter(p => p.category === 'specialty').length },
  { id: 'blends', name: 'Blends', count: allProducts.filter(p => p.category === 'blends').length },
];

type SortOption = 'name' | 'price-low' | 'price-high' | 'popular';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        products.sort((a, b) => {
          const aPopular = a.tags.includes('popular') ? 1 : 0;
          const bPopular = b.tags.includes('popular') ? 1 : 0;
          return bPopular - aPopular;
        });
        break;
    }

    return products;
  }, [selectedCategory, sortBy, searchQuery]);

  return (
    <main id="main-content" className="min-h-screen bg-background-primary">
      {/* Video Hero - smaller than homepage */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[400px] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-30"
            poster="/media/hero/sbb-hero-poster.svg"
          >
            <source src="/media/shop/shop-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/60 via-background-primary/40 to-background-primary" />
        </div>

        {/* Content */}
        <div className="relative z-10 container-default text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Research Peptide Catalog
          </h1>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
            28 compounds. Every batch independently tested. COA included.
          </p>
        </div>
      </section>

      {/* Filters Header */}
      <section className="py-6 bg-background-secondary/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <div className="container-default">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-brand-primary hover:text-brand-light text-sm">
                &larr; Home
              </Link>
              <span className="text-zinc-500">|</span>
              <p className="text-zinc-400 text-sm">
                {filteredProducts.length} of {allProducts.length} peptides
              </p>
            </div>

            {/* Search */}
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search peptides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-primary/80 border border-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-default py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="card p-4 lg:sticky lg:top-4">
              <h3 className="font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                      selectedCategory === cat.id
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'text-zinc-400 hover:text-white hover:bg-background-secondary'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-60">{cat.count}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border mt-6 pt-6">
                <h3 className="font-semibold text-white mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Standards Box */}
              <div className="border-t border-border mt-6 pt-6">
                <h3 className="font-semibold text-white mb-3 text-sm">Our Standards</h3>
                <ul className="space-y-2 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Third-party COA per batch
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 99%+ purity verified
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Batch traceability
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Research-grade labeling
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-lg">No peptides found matching your search.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-4 text-brand-primary hover:text-brand-light"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="card group hover:border-brand-primary/50 transition-all overflow-hidden backdrop-blur-sm bg-background-secondary/50"
                  >
                    {/* Product Image */}
                    <div className="aspect-square relative bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 overflow-hidden">
                      <Image
                        src="/products/sample-vial.svg"
                        alt={product.name}
                        fill
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.tags.includes('popular') && (
                          <span className="text-[10px] px-2 py-0.5 bg-brand-primary text-black font-medium rounded">
                            Popular
                          </span>
                        )}
                        {product.tags.includes('new') && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-500 text-white font-medium rounded">
                            New
                          </span>
                        )}
                      </div>
                      {/* Purity */}
                      <div className="absolute bottom-2 right-2">
                        <span className="text-[10px] px-2 py-0.5 bg-black/60 text-green-400 font-medium rounded backdrop-blur-sm">
                          99%+
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white text-sm group-hover:text-brand-primary transition-colors leading-tight">
                          {product.name}
                        </h3>
                        <span className="text-xs text-zinc-500 flex-shrink-0">
                          {product.strength}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-white">
                          ${product.price}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          COA included
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <section className="py-8 border-t border-border">
        <div className="container-default">
          <p className="text-xs text-zinc-500 text-center max-w-4xl mx-auto">
            All products are sold strictly for research, laboratory, or analytical purposes only.
            Not for human consumption. Must be 18+ to purchase.
          </p>
        </div>
      </section>
    </main>
  );
}

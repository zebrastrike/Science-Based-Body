'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { api, Product } from '@/lib/api';

// Trust badges - simple, factual
const trustBadges = [
  { icon: '🧪', text: '99%+ Purity' },
  { icon: '📋', text: 'COA Included' },
  { icon: '🇺🇸', text: 'Made in USA' },
  { icon: '📦', text: 'Same-Day Shipping' },
];

// Research categories with icons - real peptide categories
const researchCategories = [
  {
    name: 'Metabolic Research',
    slug: 'metabolic-peptides',
    description: 'GLP-1 agonists and metabolic compounds',
    icon: '⚡',
    featured: ['Semaglutide', 'Retatrutide'],
  },
  {
    name: 'Recovery Research',
    slug: 'recovery-peptides',
    description: 'Tissue repair and regeneration',
    icon: '🔄',
    featured: ['BPC-157', 'TB-500'],
  },
  {
    name: 'Cognitive Research',
    slug: 'nootropic-peptides',
    description: 'Nootropic and neuroprotective',
    icon: '🧠',
    featured: ['Semax', 'Selank'],
  },
  {
    name: 'Longevity Research',
    slug: 'longevity-peptides',
    description: 'Cellular health and anti-aging',
    icon: '⏳',
    featured: ['Epithalon', 'NAD+'],
  },
  {
    name: 'Growth Hormone',
    slug: 'growth-hormone',
    description: 'GHRH and secretagogues',
    icon: '📈',
    featured: ['Ipamorelin', 'CJC-1295'],
  },
  {
    name: 'Peptide Blends',
    slug: 'peptide-blends',
    description: 'Synergistic combinations',
    icon: '🧬',
    featured: ['BPC+TB500', 'CJC+Ipamorelin'],
  },
];

// Why us - factual, not fluffy
const whyUs = [
  {
    title: 'Independent Testing',
    description: 'Every batch tested by Janoshik or Colmaric labs. COA included with your order.',
    icon: '🔬',
  },
  {
    title: 'Real Peptides',
    description: 'No made-up names or mystery blends. Just verified research compounds.',
    icon: '✓',
  },
  {
    title: 'Fast Shipping',
    description: 'Orders before 2PM EST ship same day. Free over $99.',
    icon: '🚀',
  },
  {
    title: 'Actual Support',
    description: 'Questions about a compound? We actually answer.',
    icon: '💬',
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const products = await api.getFeaturedProducts();
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="hero relative min-h-[90vh] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-40"
            poster="/media/hero/sbb-hero-poster.svg"
          >
            <source src="/media/hero/sbb-hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/50 via-transparent to-background-primary" />
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />

        {/* Content */}
        <div className="relative z-10 container-default text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-sm font-medium animate-fade-in">
              <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              Trusted by Researchers Across America
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight animate-fade-in-up">
              Premium Research
              <span className="block text-gradient">Peptides</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto animate-fade-in-up">
              Independently tested. 99%+ purity verified.
              <br />Quality you can trust, shipped same day.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
              <Link href="/shop" className="btn-primary btn-lg w-full sm:w-auto">
                Shop All Products
              </Link>
              <Link href="/coa" className="btn-secondary btn-lg w-full sm:w-auto">
                View Lab Results
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 animate-fade-in">
              {trustBadges.map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 text-zinc-400 text-sm"
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-zinc-600 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Research Categories - Real categories, real peptides */}
      <section className="section bg-background-secondary">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Research Categories</h2>
            <p className="section-subtitle">
              Real peptides for real research. No made-up names.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop/${category.slug}`}
                className="card p-6 group hover:border-brand-primary/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors flex-shrink-0">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg group-hover:text-brand-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {category.featured.map((peptide) => (
                        <span
                          key={peptide}
                          className="text-xs px-2 py-1 bg-background-tertiary rounded text-zinc-400"
                        >
                          {peptide}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Real peptides with real images */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Featured Peptides</h2>
            <p className="section-subtitle">
              Most requested compounds. COA included with every order.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-zinc-800 rounded-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                    <div className="h-6 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="card group hover:border-brand-primary/50 transition-all overflow-hidden"
                >
                  {/* Product Image - Large, prominent */}
                  <div className="aspect-square relative bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                    <Image
                      src={product.images?.[0]?.url || '/products/sample-vial.svg'}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.tags?.includes('bestseller') && (
                        <span className="text-xs px-2 py-1 bg-brand-primary text-black font-medium rounded">
                          Popular
                        </span>
                      )}
                      {product.tags?.includes('new') && (
                        <span className="text-xs px-2 py-1 bg-blue-500 text-white font-medium rounded">
                          New
                        </span>
                      )}
                    </div>
                    {/* Purity badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="text-xs px-2 py-1 bg-black/70 text-green-400 font-medium rounded">
                        99%+ Pure
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg group-hover:text-brand-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xl font-bold text-white">
                        ${product.basePrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        COA included
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/shop" className="btn-primary btn-lg">
              View All Peptides
            </Link>
          </div>
        </div>
      </section>

      {/* Why Science Based Body */}
      <section className="section bg-gradient-premium">
        <div className="container-default">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Why Science Based Body</h2>
            <p className="text-zinc-400">No gimmicks. Just quality research compounds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyUs.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="section">
        <div className="container-default">
          <div className="card-glass p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Have Questions?
                </h2>
                <p className="text-zinc-400">
                  Need help finding a compound or understanding COA documentation? We respond.
                </p>
              </div>
              <div className="flex gap-4 flex-shrink-0">
                <Link href="/contact" className="btn-primary">
                  Contact Us
                </Link>
                <Link href="/coa" className="btn-secondary">
                  View COAs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
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

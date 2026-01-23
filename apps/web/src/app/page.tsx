'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { api, Product, Category } from '@/lib/api';

// Trust badges data
const trustBadges = [
  { icon: '🧪', text: '99%+ Purity Verified' },
  { icon: '✓', text: 'Independent Lab Tested' },
  { icon: '🇺🇸', text: 'Made in America' },
  { icon: '📦', text: 'Ships Same Day' },
];

// Value propositions
const valueProps = [
  {
    title: 'Verified Purity',
    description: 'Every batch is tested by independent laboratories like Janoshik and Colmaric to verify 99%+ purity.',
    icon: '🔬',
  },
  {
    title: 'Research Grade',
    description: 'Our peptides are manufactured to exacting standards for laboratory and analytical research applications.',
    icon: '📊',
  },
  {
    title: 'Fast & Reliable',
    description: 'Orders placed before 2PM EST ship the same day. Free shipping on orders over $99.',
    icon: '🚀',
  },
  {
    title: 'Here to Help',
    description: 'Have questions? Our knowledgeable team is happy to assist with your research needs.',
    icon: '💬',
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [products, cats] = await Promise.all([
          api.getFeaturedProducts(),
          api.getCategories(),
        ]);
        setFeaturedProducts(products);
        setCategories(cats);
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

      {/* Categories Section */}
      <section className="section bg-background-secondary">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Explore Our Categories</h2>
            <p className="section-subtitle">
              Browse our complete selection of research-grade peptides
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="card-hover p-6 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                  <span className="text-2xl">🧬</span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-brand-primary transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Popular Peptides</h2>
            <p className="section-subtitle">
              Our most requested research compounds, each with verified purity documentation
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-zinc-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="product-card"
                >
                  <div className="product-card-image">
                    <Image
                      src={product.images?.[0]?.url || '/products/sample-vial.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.tags?.includes('bestseller') && (
                      <span className="absolute top-3 left-3 badge-brand">
                        Bestseller
                      </span>
                    )}
                    {product.tags?.includes('new') && (
                      <span className="absolute top-3 left-3 badge-info">
                        New
                      </span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-card-title">{product.name}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">
                      {product.shortDescription}
                    </p>
                    <div className="product-card-price">
                      <span className="product-card-price-current">
                        ${product.basePrice.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="product-card-price-compare">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/shop" className="btn-secondary btn-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="section bg-gradient-premium">
        <div className="container-default">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((prop) => (
              <div key={prop.title} className="text-center">
                <div className="text-4xl mb-4">{prop.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {prop.title}
                </h3>
                <p className="text-zinc-400">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-default">
          <div className="card-glass p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Questions? We&apos;re Here to Help
            </h2>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re looking for a specific compound or need help understanding our documentation, our team is happy to assist.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/shop" className="btn-primary btn-lg">
                Browse Products
              </Link>
              <Link href="/contact" className="btn-ghost btn-lg">
                Get in Touch
              </Link>
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

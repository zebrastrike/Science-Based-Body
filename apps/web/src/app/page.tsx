'use client';

import Link from 'next/link';
import Image from 'next/image';

// Trust badges - simple, factual
const trustBadges = [
  { icon: '🧪', text: '99%+ Purity' },
  { icon: '📋', text: 'COA Included' },
  { icon: '🇺🇸', text: 'Made in USA' },
  { icon: '📦', text: 'Same-Day Shipping' },
];

// Featured products - one from each main category (6 total)
const featuredProducts = [
  { name: 'Semaglutide', slug: 'semaglutide', price: 130, strength: '10mg', category: 'Metabolic', tag: 'popular' },
  { name: 'BPC-157', slug: 'bpc-157', price: 125, strength: '10mg', category: 'Recovery', tag: 'popular' },
  { name: 'Semax', slug: 'semax', price: 79, strength: '10mg', category: 'Nootropic', tag: 'popular' },
  { name: 'Epithalon', slug: 'epithalon', price: 69, strength: '10mg', category: 'Longevity', tag: 'popular' },
  { name: 'Ipamorelin', slug: 'ipamorelin', price: 99, strength: '10mg', category: 'Growth Hormone', tag: null },
  { name: 'BPC-157 + TB-500', slug: 'bpc-157-tb-500', price: 129, strength: '10mg', category: 'Blend', tag: 'popular' },
];

// Research categories
const researchCategories = [
  { name: 'Metabolic', slug: 'metabolic', count: 5, icon: '⚡' },
  { name: 'Recovery', slug: 'recovery', count: 5, icon: '🔄' },
  { name: 'Nootropic', slug: 'nootropic', count: 4, icon: '🧠' },
  { name: 'Longevity', slug: 'longevity', count: 3, icon: '⏳' },
  { name: 'Growth Hormone', slug: 'growth-hormone', count: 4, icon: '📈' },
  { name: 'Blends', slug: 'blends', count: 3, icon: '🧬' },
];

// Why us - factual
const whyUs = [
  {
    title: 'Independent Testing',
    description: 'Every batch tested by Janoshik or Colmaric. COA included.',
    icon: '🔬',
  },
  {
    title: 'Real Compounds',
    description: 'No made-up names. Just verified research peptides.',
    icon: '✓',
  },
  {
    title: 'Same-Day Shipping',
    description: 'Orders before 2PM EST ship same day. Free over $99.',
    icon: '🚀',
  },
  {
    title: 'Actual Support',
    description: 'Questions? We actually answer.',
    icon: '💬',
  },
];

export default function HomePage() {

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

      {/* Browse by Category */}
      <section className="section bg-background-secondary/50">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">28 research peptides across 6 categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {researchCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center group hover:bg-white/10 hover:border-brand-primary/30 transition-all"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-medium text-white text-sm group-hover:text-brand-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{category.count} peptides</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Peptides - 6 products, one per category */}
      <section className="section">
        <div className="container-default">
          <div className="section-header">
            <h2 className="section-title">Featured Peptides</h2>
            <p className="section-subtitle">One from each category. COA included with every order.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-brand-primary/30 transition-all"
              >
                {/* Product Image */}
                <div className="aspect-square relative bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 overflow-hidden">
                  <Image
                    src="/products/sample-vial.svg"
                    alt={product.name}
                    fill
                    className="object-contain p-8 group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category tag */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] px-2 py-1 backdrop-blur-sm bg-black/40 text-zinc-300 rounded">
                      {product.category}
                    </span>
                  </div>
                  {/* Popular badge */}
                  {product.tag === 'popular' && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] px-2 py-1 bg-brand-primary text-black font-medium rounded">
                        Popular
                      </span>
                    </div>
                  )}
                  {/* Purity */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] px-2 py-1 backdrop-blur-sm bg-black/40 text-green-400 rounded">
                      99%+ Pure
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white group-hover:text-brand-primary transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-xs text-zinc-500 flex-shrink-0">{product.strength}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-white">${product.price}</span>
                    <span className="text-[10px] text-zinc-500">COA included</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/shop" className="btn-primary btn-lg">
              View All 28 Peptides
            </Link>
          </div>
        </div>
      </section>

      {/* Our Standards */}
      <section className="section bg-background-secondary/30">
        <div className="container-default">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyUs.map((item) => (
              <div
                key={item.title}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 text-center"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="section">
        <div className="container-default">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Have Questions?</h2>
                <p className="text-zinc-400 text-sm">
                  Need help finding a compound or understanding COA documentation?
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link href="/contact" className="btn-primary">Contact Us</Link>
                <Link href="/coa" className="btn-secondary">View COAs</Link>
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

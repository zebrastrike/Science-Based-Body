// Science Based Body - SEO Configuration
// Optimized for #1 ranking in peptide research space

export const siteConfig = {
  name: 'Science Based Body',
  tagline: 'Premium Research Peptides',
  description: 'Your trusted source for research-grade peptides. Every batch independently tested for 99%+ purity. BPC-157, Semaglutide, TB-500, and more. Same-day shipping.',
  url: 'https://sciencebasedbody.com',
  ogImage: 'https://sciencebasedbody.com/og-image.jpg',
  twitterHandle: '@sciencebasedbdy',
  founder: 'Science Based Body LLC',
  foundedYear: 2024,
  locale: 'en_US',
  themeColor: '#4ade80',
};

export const defaultMeta = {
  title: 'Science Based Body | Research Peptides | 99%+ Purity Verified',
  description: 'Research-grade peptides you can trust. Every batch independently tested by Janoshik and Colmaric labs. BPC-157, Semaglutide, TB-500, Retatrutide. Same-day shipping.',
  keywords: [
    'research peptides',
    'peptides for research',
    'BPC-157',
    'semaglutide',
    'retatrutide',
    'TB-500',
    'peptide supplier USA',
    'research grade peptides',
    'american made peptides',
    'third party tested peptides',
    'verified purity peptides',
  ],
};

export function generateProductMeta(product: {
  name: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  basePrice: number;
}) {
  return {
    title: product.metaTitle || `${product.name} | Research Peptide | Science Based Body`,
    description: product.metaDescription || `Buy ${product.name} research peptide. 99%+ purity, third-party tested. Starting at $${product.basePrice}. Same-day shipping available.`,
    canonical: `${siteConfig.url}/products/${product.slug}`,
  };
}

export function generateCategoryMeta(category: {
  name: string;
  slug: string;
  description?: string;
}) {
  return {
    title: `${category.name} Research Peptides | Science Based Body`,
    description: category.description || `Shop ${category.name} research peptides. Premium quality, 99%+ purity, third-party tested. Fast shipping.`,
    canonical: `${siteConfig.url}/shop/${category.slug}`,
  };
}

// JSON-LD Structured Data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    foundingDate: siteConfig.foundedYear,
    sameAs: [
      'https://twitter.com/sciencebasedbdy',
      'https://instagram.com/sciencebasedbody',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@sciencebasedbody.com',
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  sku: string;
  inStock?: boolean;
  images?: string[];
  category?: string;
  purity?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    url: `${siteConfig.url}/products/${product.slug}`,
    image: product.images?.[0] || `${siteConfig.url}/logo.png`,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
    },
    manufacturer: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: 'USD',
      availability: product.inStock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    category: product.category || 'Research Peptides',
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Purity',
        value: product.purity ? `${product.purity}%+` : '99%+',
      },
      {
        '@type': 'PropertyValue',
        name: 'Testing',
        value: 'Third-Party Verified',
      },
      {
        '@type': 'PropertyValue',
        name: 'Origin',
        value: 'American Made',
      },
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Canonical URL helper
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

// Open Graph helpers
export function generateOgTags(page: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: 'website' | 'product' | 'article';
}) {
  return {
    'og:title': page.title,
    'og:description': page.description,
    'og:image': page.image || siteConfig.ogImage,
    'og:url': page.url.startsWith('http') ? page.url : getCanonicalUrl(page.url),
    'og:type': page.type || 'website',
    'og:site_name': siteConfig.name,
    'og:locale': siteConfig.locale,
  };
}

// Twitter Card helpers
export function generateTwitterTags(page: {
  title: string;
  description: string;
  image?: string;
}) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:site': siteConfig.twitterHandle,
    'twitter:title': page.title,
    'twitter:description': page.description,
    'twitter:image': page.image || siteConfig.ogImage,
  };
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}

@Injectable()
export class SitemapService {
  private readonly siteUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.siteUrl = this.config.get('SITE_URL', 'https://sciencebasedbody.com');
  }

  /**
   * Generate complete sitemap XML
   */
  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push(...this.getStaticPages());

    // Product pages
    const productUrls = await this.getProductUrls();
    urls.push(...productUrls);

    // Category pages
    const categoryUrls = await this.getCategoryUrls();
    urls.push(...categoryUrls);

    // Generate XML
    return this.buildSitemapXml(urls);
  }

  /**
   * Generate sitemap index for large sites
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      { loc: `${this.siteUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.siteUrl}/sitemap-products.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.siteUrl}/sitemap-categories.xml`, lastmod: new Date().toISOString() },
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`;
  }

  /**
   * Static pages sitemap
   */
  private getStaticPages(): SitemapUrl[] {
    const pages: Array<{ loc: string; changefreq: SitemapUrl['changefreq']; priority: number }> = [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/shop', changefreq: 'daily', priority: 0.9 },
      { loc: '/about', changefreq: 'monthly', priority: 0.7 },
      { loc: '/faq', changefreq: 'weekly', priority: 0.6 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
      { loc: '/coa', changefreq: 'weekly', priority: 0.6 },
      { loc: '/affiliate', changefreq: 'monthly', priority: 0.5 },
      { loc: '/partners', changefreq: 'monthly', priority: 0.5 },
      // Legal pages
      { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
      { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
      { loc: '/shipping', changefreq: 'yearly', priority: 0.4 },
      { loc: '/refund', changefreq: 'yearly', priority: 0.3 },
    ];
    return pages.map((page) => ({
      ...page,
      loc: `${this.siteUrl}${page.loc}`,
      lastmod: new Date().toISOString().split('T')[0],
    }));
  }

  /**
   * Product pages sitemap
   */
  private async getProductUrls(): Promise<SitemapUrl[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        updatedAt: true,
        images: {
          take: 1,
          select: { url: true, altText: true },
        },
      },
    });

    return products.map((product) => ({
      loc: `${this.siteUrl}/products/${product.slug}`,
      lastmod: product.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.8,
      images: product.images.map((img) => ({
        loc: img.url,
        title: product.name,
        caption: img.altText || product.name,
      })),
    }));
  }

  /**
   * Category pages sitemap (using ProductCategory enum)
   */
  private async getCategoryUrls(): Promise<SitemapUrl[]> {
    // Categories are enum values, not database records
    const categoryMappings: Array<{ slug: string; name: string }> = [
      { slug: 'research-peptides', name: 'RESEARCH_PEPTIDES' },
      { slug: 'analytical-reference-materials', name: 'ANALYTICAL_REFERENCE_MATERIALS' },
      { slug: 'laboratory-adjuncts', name: 'LABORATORY_ADJUNCTS' },
      { slug: 'research-combinations', name: 'RESEARCH_COMBINATIONS' },
      { slug: 'materials-supplies', name: 'MATERIALS_SUPPLIES' },
      { slug: 'merchandise', name: 'MERCHANDISE' },
    ];

    return categoryMappings.map((category) => ({
      loc: `${this.siteUrl}/shop/${category.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.7,
    }));
  }

  /**
   * Build sitemap XML from URLs
   */
  private buildSitemapXml(urls: SitemapUrl[]): string {
    const urlEntries = urls
      .map((url) => {
        let entry = `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>`;

        if (url.lastmod) {
          entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
        }
        if (url.changefreq) {
          entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
        }
        if (url.priority !== undefined) {
          entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
        }

        // Image sitemap extension
        if (url.images && url.images.length > 0) {
          for (const image of url.images) {
            entry += `\n    <image:image>
      <image:loc>${this.escapeXml(image.loc)}</image:loc>`;
            if (image.title) {
              entry += `\n      <image:title>${this.escapeXml(image.title)}</image:title>`;
            }
            if (image.caption) {
              entry += `\n      <image:caption>${this.escapeXml(image.caption)}</image:caption>`;
            }
            entry += `\n    </image:image>`;
          }
        }

        entry += `\n  </url>`;
        return entry;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(): string {
    return `# Science Based Body - robots.txt
# https://sciencebasedbody.com

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.siteUrl}/sitemap.xml
Sitemap: ${this.siteUrl}/sitemap-index.xml

# Disallow admin and API
Disallow: /api/
Disallow: /admin/
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/

# Disallow search with parameters
Disallow: /search?*

# Allow specific crawlers full access
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl delay for less important bots
User-agent: *
Crawl-delay: 1
`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HeroSlide {
  id: string;
  type: 'video' | 'image';
  mediaUrl: string;
  posterUrl?: string; // Fallback image for video
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  overlay?: {
    enabled: boolean;
    opacity: number;
    color: string;
  };
  textPosition: 'left' | 'center' | 'right';
  textColor: string;
  mobileMediaUrl?: string; // Different video/image for mobile
  sortOrder: number;
  isActive: boolean;
}

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get hero section configuration
   * Returns slides for the homepage hero banner
   */
  async getHeroSection() {
    // For now, return hardcoded hero config
    // In production, this would come from the database
    const slides: HeroSlide[] = [
      {
        id: 'hero-1',
        type: 'video',
        mediaUrl: '/media/hero/sbb-hero-loop.mp4',
        posterUrl: '/media/hero/sbb-hero-poster.svg',
        mobileMediaUrl: '/media/hero/sbb-hero-mobile.mp4',
        title: 'Premium Research Peptides',
        subtitle: 'Third-party tested. 99%+ purity. Same-day shipping.',
        ctaText: 'Shop Now',
        ctaLink: '/shop',
        ctaSecondaryText: 'View COAs',
        ctaSecondaryLink: '/coa',
        overlay: {
          enabled: true,
          opacity: 0.3,
          color: '#000000',
        },
        textPosition: 'center',
        textColor: '#ffffff',
        sortOrder: 0,
        isActive: true,
      },
    ];

    return {
      autoplay: true,
      autoplaySpeed: 8000, // ms between slides
      pauseOnHover: true,
      showIndicators: slides.length > 1,
      showArrows: slides.length > 1,
      videoSettings: {
        autoplay: true,
        muted: true,
        loop: true,
        playsinline: true,
        preload: 'auto',
      },
      slides: slides.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  /**
   * Get promotional banners (for category pages, etc.)
   */
  async getPromoBanners(location?: string) {
    const banners = [
      {
        id: 'promo-free-shipping',
        location: 'header',
        type: 'text',
        content: 'FREE SHIPPING on orders $99+ | Same-day dispatch before 12PM CST',
        link: '/shipping',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        isActive: true,
        sortOrder: 0,
      },
      {
        id: 'promo-loyalty',
        location: 'homepage',
        type: 'banner',
        mediaUrl: '/media/banners/loyalty-program.jpg',
        title: 'Join SBB Rewards',
        subtitle: 'Earn 10 points per $1 spent',
        ctaText: 'Learn More',
        ctaLink: '/rewards',
        isActive: true,
        sortOrder: 1,
      },
    ];

    if (location) {
      return banners.filter((b) => b.location === location && b.isActive);
    }

    return banners.filter((b) => b.isActive);
  }

  /**
   * Get announcement bar content
   */
  async getAnnouncementBar() {
    return {
      enabled: true,
      messages: [
        {
          id: 'ann-1',
          text: 'FREE SHIPPING on orders $99+',
          link: '/shipping',
        },
        {
          id: 'ann-2',
          text: '10% OFF your first order with code WELCOME10',
          link: '/shop',
        },
        {
          id: 'ann-3',
          text: 'All products independently tested for purity',
          link: '/coa',
        },
      ],
      rotationSpeed: 5000, // ms
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      dismissible: true,
    };
  }

  /**
   * Get homepage content blocks
   */
  async getHomepageContent() {
    return {
      hero: await this.getHeroSection(),
      announcement: await this.getAnnouncementBar(),
      sections: [
        {
          id: 'featured-products',
          type: 'product-grid',
          title: 'Featured Products',
          subtitle: 'Our most popular research peptides',
          endpoint: '/api/catalog/featured',
          limit: 8,
          showViewAll: true,
          viewAllLink: '/shop',
        },
        {
          id: 'trust-badges',
          type: 'trust-badges',
          badges: [
            {
              icon: 'shield-check',
              title: '99%+ Purity',
              description: 'Third-party verified',
            },
            {
              icon: 'truck',
              title: 'Same-Day Shipping',
              description: 'Orders before 12PM CST',
            },
            {
              icon: 'document-text',
              title: 'COA Available',
              description: 'For every batch',
            },
            {
              icon: 'refresh',
              title: '30-Day Returns',
              description: 'Hassle-free guarantee',
            },
          ],
        },
        {
          id: 'category-showcase',
          type: 'category-grid',
          title: 'Shop by Category',
          categories: [
            {
              name: 'Research Peptides',
              slug: 'research-peptides',
              image: '/media/categories/peptides.svg',
              productCount: 0, // Will be populated dynamically
            },
            {
              name: 'Analytical Reference',
              slug: 'analytical-reference-materials',
              image: '/media/categories/reference.svg',
              productCount: 0,
            },
            {
              name: 'Laboratory Supplies',
              slug: 'materials-supplies',
              image: '/media/categories/supplies.svg',
              productCount: 0,
            },
          ],
        },
        {
          id: 'video-cta',
          type: 'video-banner',
          mediaUrl: '/media/banners/quality-commitment.mp4',
          posterUrl: '/media/banners/quality-commitment-poster.jpg',
          title: 'Our Commitment to Quality',
          description: 'Every batch is independently tested by US laboratories for purity and identity verification.',
          ctaText: 'View All COAs',
          ctaLink: '/coa',
        },
        {
          id: 'bestsellers',
          type: 'product-carousel',
          title: 'Best Sellers',
          endpoint: '/api/catalog/bestsellers',
          limit: 8,
        },
        {
          id: 'newsletter',
          type: 'newsletter-signup',
          title: 'Stay Updated',
          description: 'Subscribe for research updates, new product alerts, and exclusive offers.',
          placeholder: 'Enter your email',
          buttonText: 'Subscribe',
          disclaimer: 'By subscribing, you agree to our Privacy Policy.',
        },
      ],
    };
  }

  /**
   * Admin: Update hero slide (for future admin panel)
   */
  async updateHeroSlide(slideId: string, data: Partial<HeroSlide>, adminId: string) {
    // In production, this would update the database
    // For now, return success
    return { success: true, message: 'Hero slide updated' };
  }

  /**
   * Get shop page hero section
   */
  async getShopHero() {
    return {
      type: 'video',
      mediaUrl: '/media/shop/shop-hero.mp4',
      posterUrl: '/media/shop/shop-hero-poster.svg',
      title: 'Shop All Products',
      subtitle: 'Premium research peptides with verified purity',
      overlay: {
        enabled: true,
        opacity: 0.4,
        color: '#000000',
      },
      videoSettings: {
        autoplay: true,
        muted: true,
        loop: true,
        playsinline: true,
      },
    };
  }

  /**
   * Get site branding/logo configuration
   */
  async getBranding() {
    return {
      logo: {
        src: '/logo.png',
        alt: 'Science Based Body',
        width: 180,
        height: 60,
      },
      logoLight: {
        src: '/logo.png',
        alt: 'Science Based Body',
      },
      logoDark: {
        src: '/logo.png',
        alt: 'Science Based Body',
      },
      favicon: '/favicon.svg',
      siteName: 'Science Based Body',
      tagline: 'Premium Research Peptides',
    };
  }

  /**
   * Get footer content
   */
  async getFooterContent() {
    return {
      companyInfo: {
        name: 'Science Based Body',
        tagline: 'Premium Research Peptides',
        email: 'support@sciencebasedbody.com',
      },
      navigation: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', href: '/shop' },
            { label: 'Research Peptides', href: '/shop/research-peptides' },
            { label: 'Best Sellers', href: '/shop?sort=popularity' },
            { label: 'New Arrivals', href: '/shop?sort=latest' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'Contact Us', href: '/contact' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Shipping Info', href: '/policies/shipping' },
            { label: 'Returns', href: '/policies/refund' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'COA Library', href: '/coa' },
            { label: 'Research Blog', href: '/blog' },
            { label: 'Rewards Program', href: '/rewards' },
            { label: 'About Us', href: '/about' },
          ],
        },
        {
          title: 'Partners',
          links: [
            { label: 'Brand Partnerships', href: '/partnerships' },
            { label: 'Affiliate Program', href: '/affiliate' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Terms of Service', href: '/policies/terms' },
            { label: 'Privacy Policy', href: '/policies/privacy' },
            { label: 'Compliance', href: '/policies/compliance' },
          ],
        },
      ],
      social: [
        { platform: 'instagram', url: '#', icon: 'instagram' },
        { platform: 'twitter', url: '#', icon: 'twitter' },
      ],
      disclaimer: {
        primary: 'All products sold by Science Based Body are intended strictly for research, laboratory, or analytical purposes only. Products are NOT intended for human or veterinary consumption, therapeutic use, or diagnostic purposes.',
        ruo: 'Research Use Only (RUO) - 21 CFR 809.10(c)',
        copyright: `© ${new Date().getFullYear()} Science Based Body LLC. All rights reserved.`,
      },
      paymentMethods: ['visa', 'mastercard', 'amex', 'discover'],
    };
  }

  /**
   * Get Brand Partnerships page content
   * FDA/FTC-compliant, brand-first positioning
   */
  async getBrandPartnerships() {
    return {
      meta: {
        title: 'Brand Partnerships & Strategic Collaborations | Science Based Body',
        description: 'Partner with a science-first brand built on credibility, transparency, and regulatory awareness.',
      },
      hero: {
        title: 'Brand Partnerships & Strategic Collaborations',
        subtitle: 'Science-first partnerships for physician groups, medical spas, clinics, and research organizations.',
      },
      sections: [
        {
          id: 'intro',
          type: 'text-block',
          title: 'A Brand Built for Trust',
          content: `Science Based Body Peptides is, first and foremost, a brand—built on credibility, restraint, and scientific literacy in a market where trust is often undermined by exaggerated claims and opaque sourcing.

Our relevance comes from consistency, transparency, and alignment with evidence. We exist to represent a higher standard for how peptide research, education, and access are communicated—both to the public and to medical professionals.

We operate between innovation and discipline, providing access to U.S.-manufactured, quality-controlled research materials and clear educational context, without medical claims or speculative marketing.`,
        },
        {
          id: 'who-we-partner',
          type: 'feature-grid',
          title: 'Who We Partner With',
          items: [
            {
              icon: 'medical-bag',
              title: 'Physician Groups',
              description: 'Licensed medical professionals and physician networks seeking credible brand alignment for patient education and research.',
            },
            {
              icon: 'building',
              title: 'Medical Spas & Clinics',
              description: 'Aesthetic and wellness clinics looking for transparent, science-backed educational partnerships.',
            },
            {
              icon: 'organization',
              title: 'MSOs & Healthcare Networks',
              description: 'Management services organizations and healthcare networks requiring compliant, professional brand partnerships.',
            },
            {
              icon: 'flask',
              title: 'Research Organizations',
              description: 'Academic and private research institutions aligned with rigorous scientific standards.',
            },
          ],
        },
        {
          id: 'partnership-model',
          type: 'text-block',
          title: 'What Partnership Looks Like',
          content: `Our partnerships are structured around brand alignment, not transaction volume.

**Co-Branding Opportunities**
Joint educational initiatives, branded materials, and professional resources developed collaboratively.

**Educational Collaboration**
Access to our research library, scientific summaries, and compliance-reviewed educational content.

**Professional Visibility**
Recognition within our network of verified partners committed to scientific integrity.

**Quality Assurance**
Shared commitment to U.S. manufacturing standards, third-party testing, and transparent documentation.`,
        },
        {
          id: 'what-we-dont-do',
          type: 'notice-block',
          title: 'What We Do NOT Do',
          variant: 'warning',
          items: [
            'We do not make therapeutic, curative, or disease-related claims',
            'We do not market products for human consumption',
            'We do not provide private-label shortcuts or white-label arrangements',
            'We do not compromise on sourcing transparency or quality documentation',
            'We do not partner with organizations making unsubstantiated health claims',
          ],
        },
        {
          id: 'brand-standards',
          type: 'text-block',
          title: 'Brand Standards & Compliance Expectations',
          content: `Partners are expected to maintain alignment with our brand principles:

**Science Before Marketing**
All communications reference publicly available scientific literature and distinguish between established research and emerging investigation.

**Regulatory Awareness**
Partners operate with respect for applicable FDA and FTC guidance. No therapeutic claims. Clear separation between education, research materials, and clinical services.

**Transparency**
Clear sourcing documentation, quality verification, and honest representation of products and services.

Medical services, where offered by partners, are provided independently by licensed professionals through separate clinical platforms. Science Based Body does not practice medicine and does not direct clinical outcomes.`,
        },
        {
          id: 'cta',
          type: 'cta-block',
          title: 'Start a Partnership Conversation',
          description: 'We review partnership inquiries individually to ensure brand alignment and shared commitment to scientific integrity.',
          buttonText: 'Submit Partnership Inquiry',
          buttonLink: '/contact?type=partnership',
          email: 'partnerships@sciencebasedbody.com',
        },
      ],
      disclaimer: {
        text: 'Products are intended for research and educational purposes only. Information provided is not intended to diagnose, treat, cure, or prevent any disease. Medical services, where applicable, are provided independently by licensed professionals through separate clinical platforms.',
      },
    };
  }

  /**
   * Get Affiliate Program page content
   * Compliance-aware, platform-safe language
   */
  async getAffiliateProgram() {
    return {
      meta: {
        title: 'Affiliate & Partner Program | Science Based Body',
        description: 'Join our affiliate program for educators, professionals, and science-aligned advocates.',
      },
      hero: {
        title: 'Affiliate & Partner Program',
        subtitle: 'Brand-aligned advocacy for educators, clinics, and professionals.',
      },
      sections: [
        {
          id: 'overview',
          type: 'text-block',
          title: 'Program Overview',
          content: `The Science Based Body Affiliate Program is designed for individuals and organizations who share our commitment to scientific accuracy, transparency, and responsible education.

Affiliates serve as brand advocates—not salespeople. The program supports those who educate their audiences about peptide research, quality standards, and scientific literacy, while maintaining clear boundaries around medical claims and health outcomes.

This is not an influencer program. It is a professional referral network for credible voices in the research, education, and medical communities.`,
        },
        {
          id: 'who-its-for',
          type: 'feature-grid',
          title: 'Who This Program Is For',
          items: [
            {
              icon: 'academic-cap',
              title: 'Educators & Researchers',
              description: 'Science communicators, academic professionals, and research-focused content creators.',
            },
            {
              icon: 'medical',
              title: 'Licensed Professionals',
              description: 'Physicians, nurse practitioners, and healthcare providers with educational platforms.',
            },
            {
              icon: 'building',
              title: 'Clinics & Medical Spas',
              description: 'Professional practices seeking credible brand partnerships for patient education.',
            },
            {
              icon: 'document',
              title: 'Science Writers',
              description: 'Journalists, bloggers, and content creators focused on scientific accuracy.',
            },
          ],
        },
        {
          id: 'what-affiliates-share',
          type: 'two-column',
          title: 'What Affiliates Can Share',
          leftColumn: {
            title: 'Appropriate Content',
            variant: 'success',
            items: [
              'Brand information and company background',
              'Educational content about peptide research',
              'Quality standards and testing processes',
              'Published scientific literature references',
              'Product availability and specifications',
              'COA documentation and transparency practices',
            ],
          },
          rightColumn: {
            title: 'Content to Avoid',
            variant: 'error',
            items: [
              'Medical advice or treatment recommendations',
              'Therapeutic or disease-related claims',
              'Dosage instructions or consumption guidance',
              'Before/after claims related to human use',
              'Promises of specific health outcomes',
              'Exaggerated or unsubstantiated statements',
            ],
          },
        },
        {
          id: 'compliance',
          type: 'notice-block',
          title: 'Compliance & Disclosure Expectations',
          variant: 'info',
          content: `All affiliates are required to:

• Clearly disclose affiliate relationships in all promotional content
• Comply with FTC disclosure guidelines for endorsements
• Avoid making therapeutic, curative, or disease-related claims
• Distinguish between education and medical advice
• Maintain accurate representation of products and their intended use
• Submit promotional content for review upon request

Violations of compliance standards result in immediate program termination.`,
        },
        {
          id: 'compensation',
          type: 'text-block',
          title: 'Compensation Structure',
          content: `Approved affiliates receive referral compensation based on qualified purchases attributed to their unique tracking link.

**Commission Rate:** Competitive percentage of referred sales
**Cookie Duration:** 30-day attribution window
**Payment Schedule:** Monthly payouts for balances exceeding minimum threshold
**Tracking:** Real-time dashboard access for referral monitoring

Specific rates and terms are provided upon program acceptance. Compensation is based on product referrals only—never on medical decisions, treatment outcomes, or patient volume.`,
        },
        {
          id: 'application',
          type: 'cta-block',
          title: 'Application & Review Process',
          description: `All applications are reviewed individually. We evaluate alignment with our brand standards, audience relevance, and commitment to scientific accuracy.

Review typically takes 5-7 business days. Accepted affiliates receive onboarding materials, brand guidelines, and dashboard access.`,
          buttonText: 'Apply to the Affiliate Program',
          buttonLink: '/contact?type=affiliate',
          email: 'affiliates@sciencebasedbody.com',
        },
      ],
      disclaimer: {
        text: 'Products are intended for research and educational purposes only. Affiliate relationships do not constitute medical endorsements. Affiliates are independent advocates and are not employees or agents of Science Based Body.',
      },
    };
  }

  /**
   * Get About/Brand Story page content
   */
  async getAboutPage() {
    return {
      meta: {
        title: 'About Science Based Body | Our Mission & Vision',
        description: 'A science-first brand built for trust, transparency, and responsible peptide research education.',
      },
      hero: {
        title: 'Science Based Body',
        subtitle: 'A Science-First Brand Built for Trust',
      },
      sections: [
        {
          id: 'mission',
          type: 'text-block',
          title: 'Why We Exist',
          content: `Health and biomedical research continue to advance rapidly, yet reliable interpretation and responsible access remain uneven.

Peptides, in particular, occupy a space where scientific interest is legitimate, public curiosity is high, and misinformation and overstatement are common.

Science Based Body was created to operate between innovation and discipline—providing access to U.S.-manufactured, quality-controlled research materials and clear educational context, without medical claims or speculative marketing.

If a compound, concept, or collaboration cannot be responsibly explained, documented, and contextualized, it does not belong under our brand.`,
        },
        {
          id: 'principles',
          type: 'feature-grid',
          title: 'Our Brand Principles',
          items: [
            {
              icon: 'beaker',
              title: 'Science Before Marketing',
              description: 'We reference publicly available scientific literature and distinguish between established research and emerging investigation. Our credibility depends on what we choose not to say as much as what we publish.',
            },
            {
              icon: 'eye',
              title: 'Transparency as a Brand Asset',
              description: 'U.S. manufacturing and testing standards. Clear sourcing and quality documentation. Visibility into how materials are evaluated and described.',
            },
            {
              icon: 'book-open',
              title: 'Accessible, Responsible Education',
              description: 'Scientific information that is accurate, structured, and understandable—without being reduced to marketing shorthand.',
            },
            {
              icon: 'shield-check',
              title: 'Regulatory Awareness',
              description: 'Respect for applicable U.S. regulatory frameworks. No therapeutic claims. No marketing for human consumption. Clear separation between education and clinical services.',
            },
          ],
        },
        {
          id: 'vision',
          type: 'text-block',
          title: 'Vision for the Future',
          content: `Science Based Body is structured to evolve into a brand-centric platform that supports responsible collaboration across the medical, research, and wellness ecosystems.

**Physician, Clinic & Med Spa Integration**
Supporting physician groups, clinics, and medical spas seeking a credible, science-aligned brand partner with transparent educational and sourcing standards.

**Brand Partnerships & Market Presence**
Enabling strategic brand deals, co-branded educational initiatives, and alignment with medical groups that value credibility and long-term trust.

Our goal is not ubiquity—it is relevance with authority.`,
        },
        {
          id: 'commitment',
          type: 'highlight-block',
          title: 'Our Commitment',
          items: [
            'Brand integrity over short-term reach',
            'Scientific discipline over hype',
            'Partnerships that strengthen credibility, not dilute it',
          ],
        },
      ],
      disclaimer: {
        text: 'Products are intended for research and educational purposes only. Information provided is not intended to diagnose, treat, cure, or prevent any disease. Medical services, where applicable, are provided independently by licensed professionals through separate clinical platforms.',
      },
    };
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailgunService } from '../notifications/mailgun.service';

interface ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: 'general' | 'order' | 'partnership' | 'affiliate' | 'returns';
  orderNumber?: string;
}

interface NewsletterDto {
  email: string;
  source?: string;
}

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private mailgun: MailgunService,
  ) {}

  // ===========================================================================
  // CONTACT FORM
  // ===========================================================================

  async submitContactForm(dto: ContactFormDto, ipAddress?: string) {
    // Basic validation
    if (!dto.name || !dto.email || !dto.subject || !dto.message) {
      throw new BadRequestException('All fields are required');
    }

    if (!this.isValidEmail(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Store in database for record keeping
    // Note: You may want to add a ContactSubmission model to schema
    // For now, we'll just send emails

    // Send to admin
    await this.mailgun.sendContactFormToAdmin(
      dto.name,
      dto.email,
      dto.subject,
      dto.message,
      dto.type,
    );

    // Send confirmation to customer
    const firstName = dto.name.split(' ')[0];
    await this.mailgun.sendContactFormConfirmation(dto.email, firstName);

    return {
      success: true,
      message: 'Your message has been sent. We will respond within 1-2 business days.',
    };
  }

  // ===========================================================================
  // NEWSLETTER
  // ===========================================================================

  async subscribeNewsletter(dto: NewsletterDto) {
    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new BadRequestException('Valid email address is required');
    }

    // Upsert subscriber — reactivate if previously unsubscribed
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing && existing.isActive) {
      // Already subscribed — return success silently
      return {
        success: true,
        message: 'Thank you for subscribing! Check your inbox for a confirmation.',
      };
    }

    await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email.toLowerCase() },
      create: {
        email: dto.email.toLowerCase(),
        source: dto.source || 'unknown',
        isActive: true,
      },
      update: {
        isActive: true,
        source: dto.source || existing?.source || 'unknown',
        unsubscribedAt: null,
      },
    });

    // Send welcome email
    await this.mailgun.sendNewsletterWelcome(dto.email);

    return {
      success: true,
      message: 'Thank you for subscribing! Check your inbox for a confirmation.',
    };
  }

  async unsubscribeNewsletter(email: string) {
    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('Valid email address is required');
    }

    await this.prisma.newsletterSubscriber.updateMany({
      where: { email: email.toLowerCase(), isActive: true },
      data: { isActive: false, unsubscribedAt: new Date() },
    });

    return {
      success: true,
      message: 'You have been unsubscribed from our newsletter.',
    };
  }

  // ===========================================================================
  // MARKETING POPUP
  // ===========================================================================

  async getActivePopup(page?: string) {
    const now = new Date();
    const popups = await this.prisma.marketingPopup.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    for (const popup of popups) {
      if (popup.expiresAt && popup.expiresAt < now) continue;
      if (popup.showOnPages.length > 0 && page && !popup.showOnPages.includes(page)) continue;

      // Increment impressions (non-blocking)
      this.prisma.marketingPopup.update({
        where: { id: popup.id },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});

      return popup;
    }

    return null;
  }

  async recordPopupConversion(id: string) {
    await this.prisma.marketingPopup.update({
      where: { id },
      data: { conversions: { increment: 1 } },
    }).catch(() => {});
    return { success: true };
  }

  // ===========================================================================
  // FAQ
  // ===========================================================================

  async getFAQs(category?: string) {
    const where: any = { isPublished: true };
    if (category) {
      where.category = category;
    }

    const faqs = await this.prisma.faq.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // Group by category
    const grouped = faqs.reduce(
      (acc, faq) => {
        const cat = faq.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      categories: Object.keys(grouped),
      faqs: grouped,
    };
  }

  async getFAQCategories() {
    // Return predefined categories with descriptions
    return [
      {
        slug: 'ordering',
        name: 'Ordering & Payment',
        description: 'Questions about placing orders and payment methods',
        icon: 'shopping-cart',
      },
      {
        slug: 'shipping',
        name: 'Shipping & Delivery',
        description: 'Shipping times, tracking, and delivery information',
        icon: 'truck',
      },
      {
        slug: 'products',
        name: 'Products & Quality',
        description: 'Product information, purity, and COA documentation',
        icon: 'beaker',
      },
      {
        slug: 'returns',
        name: 'Returns & Refunds',
        description: 'Return policy and refund procedures',
        icon: 'refresh',
      },
      {
        slug: 'account',
        name: 'Account & Rewards',
        description: 'Account management and loyalty program',
        icon: 'user',
      },
      {
        slug: 'compliance',
        name: 'Compliance & Legal',
        description: 'RUO regulations and compliance information',
        icon: 'shield-check',
      },
    ];
  }

  // Static FAQ content (can be moved to database seed)
  getStaticFAQs() {
    return {
      categories: ['Ordering & Payment', 'Shipping & Delivery', 'Products & Quality', 'Returns & Refunds', 'Compliance'],
      faqs: {
        'Ordering & Payment': [
          {
            question: 'What payment methods do you accept?',
            answer: 'We accept payment through our secure payment processor, Epicor Propello. This includes major credit cards (Visa, Mastercard, American Express, Discover). For larger orders, we also offer wire transfer and alternative payment options.',
          },
          {
            question: 'Is my payment information secure?',
            answer: 'Yes, all payment processing is handled through our PCI-compliant payment processor. We never store your full credit card information on our servers.',
          },
          {
            question: 'Can I modify or cancel my order?',
            answer: 'Orders can be modified or cancelled free of charge before they ship. Once shipped, our standard return policy applies. Contact support@sciencebasedbody.com immediately if you need to make changes.',
          },
          {
            question: 'Do you offer bulk or wholesale pricing?',
            answer: 'Yes, we offer volume discounts and wholesale accounts for qualified research institutions, clinics, and distributors. Contact partnerships@sciencebasedbody.com for more information.',
          },
        ],
        'Shipping & Delivery': [
          {
            question: 'How long does shipping take?',
            answer: 'Standard shipping takes 3-5 business days within the continental US. Express shipping (1-2 business days) and overnight options are also available. Orders placed before 12PM CST Monday-Friday ship same day.',
          },
          {
            question: 'Is shipping free?',
            answer: 'Yes! We offer FREE standard shipping on all orders over $99. Orders under $99 have a flat rate shipping fee of $9.99.',
          },
          {
            question: 'Do you ship internationally?',
            answer: 'Currently, we only ship within the United States. We are working on expanding our shipping capabilities.',
          },
          {
            question: 'How can I track my order?',
            answer: 'Once your order ships, you will receive an email with tracking information. You can also view tracking details in your account dashboard under "Order History".',
          },
          {
            question: 'What if my package is lost or damaged?',
            answer: 'Contact us within 48 hours of expected delivery if your package is lost or arrives damaged. We will file a claim with the carrier and provide a replacement or refund.',
          },
        ],
        'Products & Quality': [
          {
            question: 'What purity level are your peptides?',
            answer: 'All our peptides meet or exceed 98% purity as verified by HPLC testing. Many products achieve 99%+ purity. Every batch is independently tested by US laboratories.',
          },
          {
            question: 'Do you provide Certificates of Analysis (COA)?',
            answer: 'Yes, COA documents are available for every batch. You can view and download COAs from our COA Library page or directly on each product page.',
          },
          {
            question: 'How should peptides be stored?',
            answer: 'Lyophilized (freeze-dried) peptides should be stored at -20°C or colder for long-term storage. Reconstituted peptides should be refrigerated (2-8°C) and used within the timeframe specified on the product documentation.',
          },
          {
            question: 'Where are your products manufactured?',
            answer: 'All our products are manufactured in the United States under strict quality control protocols. We maintain full traceability from synthesis to delivery.',
          },
        ],
        'Returns & Refunds': [
          {
            question: 'What is your return policy?',
            answer: 'We offer a 30-day return guarantee for unopened items in original packaging. Items must be undamaged and returned with proof of purchase. See our full Return Policy for details.',
          },
          {
            question: 'How do I initiate a return?',
            answer: 'Email support@sciencebasedbody.com with your order number and reason for return. Do not ship items back without prior authorization. We will provide return instructions and an RMA number.',
          },
          {
            question: 'When will I receive my refund?',
            answer: 'Refunds are processed within 5-7 business days after we receive and inspect your return. The refund will be issued to your original payment method.',
          },
          {
            question: 'Are shipping costs refundable?',
            answer: 'Original shipping costs are non-refundable unless the return is due to our error (wrong item, defective product). Return shipping is the customer\'s responsibility.',
          },
        ],
        'Compliance': [
          {
            question: 'What does "Research Use Only" mean?',
            answer: 'All our products are classified as Research Use Only (RUO) under 21 CFR 809.10(c). This means they are intended solely for research, laboratory, and analytical purposes—NOT for human or veterinary consumption, diagnostic use, or therapeutic purposes.',
          },
          {
            question: 'Do I need a license to purchase?',
            answer: 'Individual researchers do not typically need a specific license for personal research purchases. However, you must be at least 21 years old and acknowledge our terms of service, including agreement not to use products for human consumption.',
          },
          {
            question: 'Why do I need to check compliance boxes at checkout?',
            answer: 'These acknowledgments are required to ensure all customers understand the intended use of our products and comply with applicable regulations. This protects both you and us while maintaining legal compliance.',
          },
          {
            question: 'Can I use these products on myself or others?',
            answer: 'No. Our products are NOT intended for human or veterinary consumption, therapeutic use, or diagnostic purposes. Purchasing our products constitutes agreement to use them only for legitimate research purposes.',
          },
        ],
      },
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

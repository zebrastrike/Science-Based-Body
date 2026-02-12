import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PolicyPage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
  sections?: Array<{
    title: string;
    content: string;
  }>;
}

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all policy pages for navigation
   */
  getPoliciesIndex() {
    return {
      title: 'Policies & Compliance Center',
      description:
        'Review our policies and compliance information to understand how we operate.',
      policies: [
        {
          slug: 'terms',
          title: 'Terms of Service',
          description: 'Terms and conditions for using our services',
        },
        {
          slug: 'privacy',
          title: 'Privacy Policy',
          description: 'How we collect, use, and protect your information',
        },
        {
          slug: 'refund',
          title: 'Return & Refund Policy',
          description: '30-day guarantee and return procedures',
        },
        {
          slug: 'shipping',
          title: 'Shipping Policy',
          description: 'Shipping methods, times, and costs',
        },
        {
          slug: 'compliance',
          title: 'Compliance & Legal Overview',
          description: 'RUO labeling and regulatory compliance',
        },
        {
          slug: 'community',
          title: 'Community Guidelines',
          description: 'Guidelines for community participation',
        },
      ],
      contact: {
        email: 'support@sciencebasedbody.com',
        address: 'Science Based Body LLC',
      },
    };
  }

  /**
   * Get specific policy page content
   */
  getPolicy(slug: string): PolicyPage {
    const policies: Record<string, PolicyPage> = {
      terms: this.getTermsOfService(),
      privacy: this.getPrivacyPolicy(),
      refund: this.getRefundPolicy(),
      shipping: this.getShippingPolicy(),
      compliance: this.getCompliancePolicy(),
      community: this.getCommunityGuidelines(),
    };

    const policy = policies[slug];
    if (!policy) {
      throw new NotFoundException(`Policy '${slug}' not found`);
    }

    return policy;
  }

  private getTermsOfService(): PolicyPage {
    return {
      slug: 'terms',
      title: 'Terms of Service',
      lastUpdated: '2025-01-22',
      content: `Welcome to Science Based Body. By accessing or using our website and services, you agree to be bound by these Terms of Service.`,
      sections: [
        {
          title: 'Research Use Only (RUO) Products',
          content: `All products sold on Science Based Body are intended solely for research, laboratory, and analytical purposes. These products are NOT intended for human or veterinary consumption, diagnostic purposes, or therapeutic use.

By purchasing from us, you acknowledge and agree that:
- You are purchasing products exclusively for legitimate research purposes
- You are at least 18 years of age
- You will not use these products for human or animal consumption
- You will not use these products for diagnostic or therapeutic purposes
- You accept full responsibility for ensuring compliance with all applicable laws and regulations`,
        },
        {
          title: 'Prohibited Uses',
          content: `The following uses of our products are strictly prohibited:
- Human or veterinary consumption
- Diagnostic use
- Therapeutic use
- Manufacturing of drugs or supplements for consumption
- Any use that violates federal, state, or local laws
- Resale without proper licensing and documentation`,
        },
        {
          title: 'Account Responsibilities',
          content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.`,
        },
        {
          title: 'Order Acceptance',
          content: `All orders are subject to acceptance by Science Based Body. We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion, particularly if we have reason to believe products will be misused.`,
        },
        {
          title: 'Intellectual Property',
          content: `All content on this website, including text, graphics, logos, and images, is the property of Science Based Body and protected by intellectual property laws.`,
        },
        {
          title: 'Limitation of Liability',
          content: `Science Based Body shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our products or services. Our total liability shall not exceed the amount you paid for the specific product giving rise to the claim.`,
        },
        {
          title: 'Governing Law',
          content: `These Terms of Service shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.`,
        },
        {
          title: 'Changes to Terms',
          content: `We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of our services constitutes acceptance of modified terms.`,
        },
      ],
    };
  }

  private getPrivacyPolicy(): PolicyPage {
    return {
      slug: 'privacy',
      title: 'Privacy Policy',
      lastUpdated: '2025-01-22',
      content: `Science Based Body ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.`,
      sections: [
        {
          title: 'Information We Collect',
          content: `We collect information you provide directly to us, including:
- Name, email address, phone number, and shipping/billing addresses
- Payment information (processed securely through our payment processors)
- Account credentials
- Order history and preferences
- Communications with our customer service team

We also automatically collect certain information when you visit our website:
- IP address and device information
- Browser type and operating system
- Pages viewed and links clicked
- Referring website addresses`,
        },
        {
          title: 'How We Use Your Information',
          content: `We use the information we collect to:
- Process and fulfill your orders
- Communicate with you about orders, products, and services
- Provide customer support
- Send promotional communications (with your consent)
- Improve our website and services
- Comply with legal obligations
- Prevent fraud and ensure security`,
        },
        {
          title: 'Information Sharing',
          content: `We may share your information with:
- Service providers who assist in our operations (payment processors, shipping carriers, email services)
- Legal authorities when required by law
- Business partners with your consent

We do NOT sell your personal information to third parties.`,
        },
        {
          title: 'Data Security',
          content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data and secure storage practices.`,
        },
        {
          title: 'Your Rights',
          content: `Depending on your location, you may have the right to:
- Access the personal information we hold about you
- Request correction of inaccurate information
- Request deletion of your information
- Opt out of marketing communications
- Request data portability

To exercise these rights, contact us at privacy@sciencebasedbody.com.`,
        },
        {
          title: 'Cookies and Tracking',
          content: `We use cookies and similar tracking technologies to improve your browsing experience and analyze website traffic. You can control cookies through your browser settings.`,
        },
        {
          title: 'Children\'s Privacy',
          content: `Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from anyone under 18.`,
        },
        {
          title: 'Contact Us',
          content: `If you have questions about this Privacy Policy, please contact us at:
Email: privacy@sciencebasedbody.com`,
        },
      ],
    };
  }

  private getRefundPolicy(): PolicyPage {
    return {
      slug: 'refund',
      title: 'Return & Refund Policy',
      lastUpdated: '2025-01-22',
      content: `We stand behind the quality of our research materials. If you're not satisfied with your purchase, we offer a 30-day return guarantee for unopened items.`,
      sections: [
        {
          title: 'Eligibility for Returns',
          content: `To be eligible for a return:
- Items must be unopened and in original packaging
- Return must be requested within 30 days of delivery
- Items must not be damaged by the customer
- Proof of purchase is required`,
        },
        {
          title: 'Non-Returnable Items',
          content: `The following items cannot be returned:
- Opened or used products (for safety and compliance reasons)
- Products that have been stored improperly
- Custom or special orders
- Items damaged by the customer`,
        },
        {
          title: 'How to Initiate a Return',
          content: `To initiate a return:
1. Email support@sciencebasedbody.com with your order number
2. Describe the reason for return
3. Wait for our team to provide return authorization and shipping instructions
4. Ship the item back in its original packaging

Do NOT ship returns without prior authorization.`,
        },
        {
          title: 'Refund Processing',
          content: `Once we receive and inspect your return:
- Refunds are processed within 5-7 business days
- Refunds are issued to the original payment method
- Original shipping costs are non-refundable
- Return shipping costs are the customer's responsibility unless the return is due to our error`,
        },
        {
          title: 'Damaged or Defective Products',
          content: `If you receive a damaged or defective product:
- Contact us immediately upon receipt
- Include photos of the damage
- We will provide a prepaid return label
- Full refund including shipping will be issued`,
        },
        {
          title: 'Order Cancellation',
          content: `Orders can be cancelled free of charge if they have not yet shipped. Once shipped, the standard return policy applies.`,
        },
      ],
    };
  }

  private getShippingPolicy(): PolicyPage {
    return {
      slug: 'shipping',
      title: 'Shipping Policy',
      lastUpdated: '2025-01-22',
      content: `We are committed to fast, reliable shipping for all orders. Most orders ship same-day when placed before our cutoff time.`,
      sections: [
        {
          title: 'Shipping Rates',
          content: `All orders ship with a flat rate of $25.00 for Standard Shipping, or $50.00 for Expedited Shipping. Rates apply to all orders regardless of order value.`,
        },
        {
          title: 'Processing Time',
          content: `Orders placed before 12:00 PM CST (Monday-Friday) ship same day. Orders placed after cutoff or on weekends/holidays will ship the next business day.`,
        },
        {
          title: 'Shipping Methods',
          content: `Standard Shipping (3-5 business days): $25.00 flat rate
Expedited Shipping (1-2 business days): $50.00

All orders are shipped via USPS, FedEx, or UPS at our discretion based on destination and package requirements.`,
        },
        {
          title: 'Tracking Information',
          content: `Tracking information is emailed to you once your order ships. You can also view tracking in your account dashboard. Please allow up to 24 hours for tracking to update after shipment.`,
        },
        {
          title: 'Packaging',
          content: `All orders are shipped in discreet packaging with no indication of contents on the exterior. Products are carefully packaged to ensure safe delivery.`,
        },
        {
          title: 'Shipping Restrictions',
          content: `We currently ship only within the United States. Some products may have state-specific restrictions. We will notify you if your order cannot be shipped to your location.`,
        },
        {
          title: 'Lost or Damaged Packages',
          content: `If your package is lost or arrives damaged:
- Contact us within 48 hours of expected delivery
- We will file a claim with the carrier
- Replacement or refund will be provided once claim is processed`,
        },
        {
          title: 'Holiday Shipping',
          content: `During peak holiday periods, shipping times may be extended. We recommend ordering early during November-December to ensure timely delivery.`,
        },
      ],
    };
  }

  private getCompliancePolicy(): PolicyPage {
    return {
      slug: 'compliance',
      title: 'Compliance & Legal Overview',
      lastUpdated: '2025-01-22',
      content: `Science Based Body is committed to full compliance with all applicable regulations regarding research-use-only (RUO) products.`,
      sections: [
        {
          title: 'Research Use Only (RUO) Classification',
          content: `All peptides and research compounds sold by Science Based Body are classified as Research Use Only (RUO) products in accordance with 21 CFR 809.10(c).

These products are:
- Intended solely for research, laboratory, and analytical purposes
- NOT intended for human or veterinary diagnostic use
- NOT intended for therapeutic or consumption purposes
- Labeled clearly as "For Research Use Only"`,
        },
        {
          title: 'Quality Assurance',
          content: `Our commitment to quality includes:
- Third-party testing of all batches by independent US laboratories
- Certificate of Analysis (COA) available for every batch
- HPLC purity verification (≥98% purity standard)
- Mass spectrometry identity confirmation
- Proper cold-chain handling and storage`,
        },
        {
          title: 'Labeling Standards',
          content: `All products are labeled in compliance with RUO requirements:
- Clear "For Research Use Only" designation
- Batch number for traceability
- Storage instructions
- Proper handling warnings
- No therapeutic claims or dosage instructions`,
        },
        {
          title: 'Customer Compliance Obligations',
          content: `By purchasing from Science Based Body, customers agree to:
- Use products only for legitimate research purposes
- Maintain proper documentation of research activities
- Not resell products without appropriate licensing
- Comply with all applicable federal, state, and local regulations
- Not use products for human or animal consumption`,
        },
        {
          title: 'Prohibited Activities',
          content: `The following activities are strictly prohibited and will result in account termination:
- Human or veterinary consumption
- Manufacturing products for consumption
- Resale to unlicensed parties
- Providing dosage or consumption guidance
- Making therapeutic claims`,
        },
        {
          title: 'Monitoring and Enforcement',
          content: `We actively monitor for compliance violations and cooperate with regulatory authorities. Accounts found in violation of our terms will be permanently banned and reported to appropriate authorities if warranted.`,
        },
        {
          title: 'Questions',
          content: `For compliance questions, contact our compliance team at compliance@sciencebasedbody.com.`,
        },
      ],
    };
  }

  private getCommunityGuidelines(): PolicyPage {
    return {
      slug: 'community',
      title: 'Community Guidelines',
      lastUpdated: '2025-01-22',
      content: `Our community is built on the principles of legitimate scientific research. These guidelines ensure a safe and compliant environment for all participants.`,
      sections: [
        {
          title: 'Prohibited Content',
          content: `The following content is strictly prohibited in all community spaces:
- Dosage recommendations or consumption instructions
- Claims of human or animal use
- Therapeutic benefit claims
- Injection techniques or consumption methods
- Before/after claims related to human use
- Medical advice of any kind`,
        },
        {
          title: 'Acceptable Discussions',
          content: `Community members may discuss:
- Research methodologies and protocols
- Published scientific literature
- Laboratory techniques
- Product quality and COA analysis
- Storage and handling best practices
- General scientific topics`,
        },
        {
          title: 'Enforcement',
          content: `Violations of community guidelines will result in:
- First offense: Warning and content removal
- Second offense: Temporary suspension
- Third offense: Permanent ban

Egregious violations may result in immediate permanent ban and reporting to appropriate authorities.`,
        },
        {
          title: 'Reporting Violations',
          content: `If you observe guideline violations, please report them to community@sciencebasedbody.com. Reports are confidential and essential for maintaining community integrity.`,
        },
      ],
    };
  }

  /**
   * Get footer disclaimer text
   */
  getFooterDisclaimer() {
    return {
      primary: `All products sold by Science Based Body are intended strictly for research, laboratory, or analytical purposes only. Products are NOT intended for human or veterinary consumption, therapeutic use, or diagnostic purposes. All statements have not been evaluated by the FDA.`,
      ruo: `Research Use Only (RUO) - 21 CFR 809.10(c)`,
      copyright: `© ${new Date().getFullYear()} Science Based Body. All rights reserved.`,
    };
  }
}

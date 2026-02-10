import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../files/local-storage.service';
import { MailgunService } from '../notifications/mailgun.service';
import { EmailTemplatesService } from '../notifications/email-templates.service';
import { ApplyAffiliateDto } from './dto/apply-affiliate.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AffiliatesService {
  private readonly logger = new Logger(AffiliatesService.name);

  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
    private mailService: MailgunService,
    private emailTemplates: EmailTemplatesService,
  ) {}

  /**
   * Submit affiliate application (public)
   */
  async apply(
    dto: ApplyAffiliateDto,
    resumeFile?: { buffer: Buffer; originalname: string },
  ) {
    // Check for duplicate email
    const existing = await this.prisma.affiliateApplication.findFirst({
      where: { email: dto.email.toLowerCase(), status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('An application with this email is already pending');
    }

    let resumePath: string | undefined;
    if (resumeFile) {
      const saved = await this.storage.saveFile(
        resumeFile.buffer,
        resumeFile.originalname,
        'affiliates',
      );
      resumePath = saved.storedPath;
    }

    const application = await this.prisma.affiliateApplication.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        primaryPlatform: dto.primaryPlatform,
        socialLinks: dto.socialLinks,
        audienceSize: dto.audienceSize,
        contentFocus: dto.contentFocus,
        whyPartner: dto.whyPartner,
        resumePath,
      },
    });

    // Notify admin (non-blocking)
    const attachments = [];
    if (resumeFile) {
      attachments.push({
        filename: resumeFile.originalname,
        content: resumeFile.buffer,
      });
    }

    this.mailService
      .sendEmail({
        to: 'admin@sciencebasedbody.com',
        subject: `New Affiliate Application: ${dto.fullName}`,
        html: `
          <h2>New Affiliate Application</h2>
          <p><strong>Name:</strong> ${dto.fullName}</p>
          <p><strong>Email:</strong> ${dto.email}</p>
          <p><strong>Phone:</strong> ${dto.phone || 'N/A'}</p>
          <p><strong>Platform:</strong> ${dto.primaryPlatform}</p>
          <p><strong>Audience Size:</strong> ${dto.audienceSize || 'N/A'}</p>
          <p><strong>Content Focus:</strong> ${dto.contentFocus || 'N/A'}</p>
          <p><strong>Why Partner:</strong> ${dto.whyPartner || 'N/A'}</p>
          <p><strong>Social Links:</strong> ${JSON.stringify(dto.socialLinks, null, 2)}</p>
          ${resumeFile ? '<p><em>Resume attached.</em></p>' : ''}
        `,
        tags: ['admin', 'affiliate-application'],
        attachments,
      })
      .catch((err) => this.logger.error('Failed to notify admin of affiliate application:', err));

    // Send auto-reply confirmation to applicant (non-blocking)
    const autoReply = this.emailTemplates.affiliateApplicationReceived(dto.fullName);
    this.mailService
      .sendEmail({
        to: dto.email,
        subject: autoReply.subject,
        html: autoReply.html,
        text: autoReply.text,
        tags: ['affiliate', 'auto-reply'],
      })
      .catch((err) => this.logger.error('Failed to send affiliate application auto-reply:', err));

    return { id: application.id, message: 'Application submitted successfully' };
  }

  /**
   * Track affiliate link click (public)
   */
  async trackClick(referralCode: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { referralCode, isActive: true },
    });

    if (!affiliate) return { valid: false };

    // Increment click count
    await this.prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { totalClicks: { increment: 1 } },
    });

    // Record click as a referral entry (no order yet)
    await this.prisma.affiliateReferral.create({
      data: { affiliateId: affiliate.id },
    });

    return { valid: true, code: referralCode };
  }

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  /**
   * List affiliate applications (admin)
   */
  async listApplications(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status as any } : {};
    const [applications, total] = await Promise.all([
      this.prisma.affiliateApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.affiliateApplication.count({ where }),
    ]);

    return { applications, total, page, limit };
  }

  /**
   * Get application detail (admin)
   */
  async getApplication(id: string) {
    const application = await this.prisma.affiliateApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  /**
   * Approve affiliate application (admin)
   */
  async approveApplication(id: string, adminId: string) {
    const application = await this.prisma.affiliateApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application is not pending');
    }

    // Generate temp password and referral code
    const tempPassword = uuidv4().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const referralCode = this.generateReferralCode(application.fullName);

    // Create user + affiliate in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      let user = await tx.user.findUnique({
        where: { email: application.email },
      });

      if (user) {
        // Upgrade existing user to AFFILIATE role
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: 'AFFILIATE' },
        });
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email: application.email,
            passwordHash,
            firstName: application.fullName.split(' ')[0],
            lastName: application.fullName.split(' ').slice(1).join(' ') || undefined,
            role: 'AFFILIATE',
            status: 'ACTIVE',
          },
        });
      }

      // Create affiliate record
      const affiliate = await tx.affiliate.create({
        data: {
          userId: user.id,
          referralCode,
        },
      });

      // Update application status
      await tx.affiliateApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      return { user, affiliate };
    });

    // Send credentials email (non-blocking)
    this.mailService
      .sendEmail({
        to: application.email,
        subject: 'Welcome to Science Based Body Affiliate Program!',
        html: `
          <h2>You're Approved!</h2>
          <p>Hi ${application.fullName},</p>
          <p>Your affiliate application has been approved. Here are your credentials:</p>
          <p><strong>Login Email:</strong> ${application.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p><strong>Your Referral Code:</strong> ${referralCode}</p>
          <p><strong>Your Referral Link:</strong> https://api.sbbpeptides.com/api/v1/affiliates/r/${referralCode}</p>
          <p><em>Share this clean link — it looks like a normal URL with no visible tracking codes.</em></p>
          <p>Please change your password after your first login.</p>
          <p>Commission Rate: 5% on all referred sales.</p>
        `,
        tags: ['affiliate', 'approved'],
      })
      .catch((err) => this.logger.error('Failed to send affiliate credentials:', err));

    return {
      affiliate: result.affiliate,
      referralCode,
      message: 'Affiliate approved and credentials sent',
    };
  }

  /**
   * Reject affiliate application (admin)
   */
  async rejectApplication(id: string, adminId: string, reason?: string) {
    const application = await this.prisma.affiliateApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    await this.prisma.affiliateApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Send rejection email
    this.mailService
      .sendEmail({
        to: application.email,
        subject: 'Science Based Body Affiliate Application Update',
        html: `
          <p>Hi ${application.fullName},</p>
          <p>Thank you for your interest in the Science Based Body Affiliate Program.</p>
          <p>After careful review, we are unable to approve your application at this time.</p>
          ${reason ? `<p>Reason: ${reason}</p>` : ''}
          <p>You are welcome to reapply in the future.</p>
        `,
        tags: ['affiliate', 'rejected'],
      })
      .catch((err) => this.logger.error('Failed to send rejection email:', err));

    return { message: 'Application rejected' };
  }

  // ===========================================================================
  // AFFILIATE DASHBOARD ENDPOINTS
  // ===========================================================================

  /**
   * Get affiliate stats for dashboard
   */
  async getMyStats(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });
    if (!affiliate) throw new NotFoundException('Affiliate record not found');

    return {
      referralCode: affiliate.referralCode,
      referralLink: `https://api.sbbpeptides.com/api/v1/affiliates/r/${affiliate.referralCode}`,
      legacyLink: `https://sbbpeptides.com?ref=${affiliate.referralCode}`,
      commissionRate: Number(affiliate.commissionRate),
      totalClicks: affiliate.totalClicks,
      totalOrders: affiliate.totalOrders,
      totalRevenue: Number(affiliate.totalRevenue),
      totalCommission: Number(affiliate.totalCommission),
      pendingPayout: Number(affiliate.pendingPayout),
    };
  }

  /**
   * Get affiliate referrals list
   */
  async getMyReferrals(userId: string, page = 1, limit = 20) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });
    if (!affiliate) throw new NotFoundException('Affiliate record not found');

    const [referrals, total] = await Promise.all([
      this.prisma.affiliateReferral.findMany({
        where: { affiliateId: affiliate.id, orderId: { not: null } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.affiliateReferral.count({
        where: { affiliateId: affiliate.id, orderId: { not: null } },
      }),
    ]);

    return { referrals, total, page, limit };
  }

  /**
   * Generate referral code from name
   */
  private generateReferralCode(name: string): string {
    const prefix = name
      .split(' ')[0]
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4);
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    return `${prefix || 'SBB'}${suffix}`;
  }
}

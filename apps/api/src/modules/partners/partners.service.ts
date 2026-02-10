import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../files/local-storage.service';
import { MailgunService } from '../notifications/mailgun.service';
import { EmailTemplatesService } from '../notifications/email-templates.service';
import { ApplyPartnerDto } from './dto/apply-partner.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
    private mailService: MailgunService,
    private emailTemplates: EmailTemplatesService,
  ) {}

  /**
   * Submit brand partner application (public)
   */
  async apply(
    dto: ApplyPartnerDto,
    documents?: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    // Check for duplicate
    const existing = await this.prisma.brandPartnerApplication.findFirst({
      where: { email: dto.email.toLowerCase(), status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('An application with this email is already pending');
    }

    const documentPaths: string[] = [];
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const saved = await this.storage.saveFile(doc.buffer, doc.originalname, 'partners');
        documentPaths.push(saved.storedPath);
        attachments.push({ filename: doc.originalname, content: doc.buffer });
      }
    }

    const application = await this.prisma.brandPartnerApplication.create({
      data: {
        organizationName: dto.organizationName,
        contactName: dto.contactName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        orgType: dto.orgType,
        website: dto.website,
        location: dto.location,
        partnershipFocus: dto.partnershipFocus,
        partnershipOverview: dto.partnershipOverview,
        documentPaths: documentPaths.length > 0 ? documentPaths : undefined,
      },
    });

    // Notify admin (non-blocking)
    this.mailService
      .sendEmail({
        to: 'admin@sciencebasedbody.com',
        subject: `New Brand Partner Application: ${dto.organizationName}`,
        html: `
          <h2>New Brand Partner Application</h2>
          <p><strong>Organization:</strong> ${dto.organizationName}</p>
          <p><strong>Contact:</strong> ${dto.contactName}</p>
          <p><strong>Email:</strong> ${dto.email}</p>
          <p><strong>Phone:</strong> ${dto.phone || 'N/A'}</p>
          <p><strong>Type:</strong> ${dto.orgType}</p>
          <p><strong>Website:</strong> ${dto.website || 'N/A'}</p>
          <p><strong>Location:</strong> ${dto.location || 'N/A'}</p>
          <p><strong>Partnership Focus:</strong> ${dto.partnershipFocus || 'N/A'}</p>
          <p><strong>Overview:</strong> ${dto.partnershipOverview || 'N/A'}</p>
          ${attachments.length > 0 ? `<p><em>${attachments.length} document(s) attached.</em></p>` : ''}
        `,
        tags: ['admin', 'partner-application'],
        attachments,
      })
      .catch((err) => this.logger.error('Failed to notify admin of partner application:', err));

    // Send auto-reply confirmation to applicant (non-blocking)
    const autoReply = this.emailTemplates.partnerApplicationReceived(dto.contactName, dto.organizationName);
    this.mailService
      .sendEmail({
        to: dto.email,
        subject: autoReply.subject,
        html: autoReply.html,
        text: autoReply.text,
        tags: ['partner', 'auto-reply'],
      })
      .catch((err) => this.logger.error('Failed to send partner application auto-reply:', err));

    return { id: application.id, message: 'Application submitted successfully' };
  }

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  /**
   * List partner applications (admin)
   */
  async listApplications(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status as any } : {};
    const [applications, total] = await Promise.all([
      this.prisma.brandPartnerApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.brandPartnerApplication.count({ where }),
    ]);

    return { applications, total, page, limit };
  }

  /**
   * Get application detail (admin)
   */
  async getApplication(id: string) {
    const application = await this.prisma.brandPartnerApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  /**
   * Approve partner application (admin)
   */
  async approveApplication(id: string, adminId: string) {
    const application = await this.prisma.brandPartnerApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application is not pending');
    }

    const tempPassword = uuidv4().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create or find organization
      let org = await tx.organization.findFirst({
        where: { name: application.organizationName },
      });
      if (!org) {
        org = await tx.organization.create({
          data: {
            name: application.organizationName,
            type: application.orgType.toUpperCase(),
          },
        });
      }

      // Check if user already exists
      let user = await tx.user.findUnique({
        where: { email: application.email },
      });

      if (user) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: 'BRAND_PARTNER', organizationId: org.id },
        });
      } else {
        user = await tx.user.create({
          data: {
            email: application.email,
            passwordHash,
            firstName: application.contactName.split(' ')[0],
            lastName: application.contactName.split(' ').slice(1).join(' ') || undefined,
            role: 'BRAND_PARTNER',
            status: 'ACTIVE',
            organizationId: org.id,
          },
        });
      }

      // Create wholesale PriceList for this organization
      let priceList = await tx.priceList.findFirst({
        where: { organizationId: org.id },
      });
      if (!priceList) {
        priceList = await tx.priceList.create({
          data: {
            name: `${application.organizationName} Wholesale`,
            description: `Wholesale pricing for ${application.organizationName}`,
            discountPercent: 20, // Default 20% wholesale discount
            organizationId: org.id,
            isActive: true,
          },
        });
      }

      // Link user to price list
      if (!user.priceListId) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { priceListId: priceList.id },
        });
      }

      // Update application status
      await tx.brandPartnerApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      return { user, org, priceList };
    });

    // Send credentials email
    this.mailService
      .sendEmail({
        to: application.email,
        subject: 'Welcome to Science Based Body Partner Program!',
        html: `
          <h2>Partnership Approved!</h2>
          <p>Hi ${application.contactName},</p>
          <p>Your brand partnership application for <strong>${application.organizationName}</strong> has been approved.</p>
          <p><strong>Login Email:</strong> ${application.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>Please change your password after your first login.</p>
          <p>As a brand partner, you'll have access to wholesale volume pricing and logo assets.</p>
        `,
        tags: ['partner', 'approved'],
      })
      .catch((err) => this.logger.error('Failed to send partner credentials:', err));

    return {
      organization: result.org,
      message: 'Partner approved and credentials sent',
    };
  }

  /**
   * Reject partner application (admin)
   */
  async rejectApplication(id: string, adminId: string, reason?: string) {
    const application = await this.prisma.brandPartnerApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    await this.prisma.brandPartnerApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    this.mailService
      .sendEmail({
        to: application.email,
        subject: 'Science Based Body Partnership Application Update',
        html: `
          <p>Hi ${application.contactName},</p>
          <p>Thank you for your interest in partnering with Science Based Body.</p>
          <p>After careful review, we are unable to approve your application at this time.</p>
          ${reason ? `<p>Reason: ${reason}</p>` : ''}
          <p>You are welcome to reapply in the future.</p>
        `,
        tags: ['partner', 'rejected'],
      })
      .catch((err) => this.logger.error('Failed to send rejection email:', err));

    return { message: 'Application rejected' };
  }
}

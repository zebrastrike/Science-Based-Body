import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComplianceAckDto } from './dto/create-compliance-ack.dto';

@Injectable()
export class ComplianceService {
  private readonly minimumAge: number;
  private readonly checkboxVersion: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.minimumAge = this.config.get('MINIMUM_AGE', 21);
    this.checkboxVersion = this.config.get('COMPLIANCE_CHECKBOX_VERSION', '1.0.0');
  }

  /**
   * Validate and create compliance acknowledgment for an order
   */
  async createAcknowledgment(
    dto: CreateComplianceAckDto,
    orderId: string,
    userId: string,
    ipAddress: string,
    userAgent?: string,
  ) {
    // Validate all checkboxes are checked
    this.validateCheckboxes(dto);

    // Create acknowledgment record
    const acknowledgment = await this.prisma.complianceAcknowledgment.create({
      data: {
        orderId,
        userId,
        researchPurposeOnly: dto.researchPurposeOnly,
        ageConfirmation: dto.ageConfirmation,
        noHumanConsumption: dto.noHumanConsumption,
        responsibilityAccepted: dto.responsibilityAccepted,
        termsAccepted: dto.termsAccepted,
        ipAddress,
        userAgent,
        checkboxVersion: this.checkboxVersion,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        resourceType: 'ComplianceAcknowledgment',
        resourceId: acknowledgment.id,
        ipAddress,
        userAgent,
        metadata: {
          orderId,
          checkboxVersion: this.checkboxVersion,
        },
      },
    });

    return acknowledgment;
  }

  /**
   * Validate that all required checkboxes are checked
   */
  private validateCheckboxes(dto: CreateComplianceAckDto) {
    const errors: string[] = [];

    if (!dto.researchPurposeOnly) {
      errors.push('You must confirm products are for research purposes only');
    }

    if (!dto.ageConfirmation) {
      errors.push(`You must confirm you are ${this.minimumAge} years of age or older`);
    }

    if (!dto.noHumanConsumption) {
      errors.push('You must acknowledge products are not for human consumption');
    }

    if (!dto.responsibilityAccepted) {
      errors.push('You must accept responsibility for proper handling');
    }

    if (!dto.termsAccepted) {
      errors.push('You must accept the Terms of Service');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Compliance requirements not met',
        errors,
      });
    }
  }

  /**
   * Get compliance acknowledgment for an order
   */
  async getAcknowledgment(orderId: string) {
    return this.prisma.complianceAcknowledgment.findUnique({
      where: { orderId },
    });
  }

  /**
   * Check if order has valid compliance acknowledgment
   */
  async hasValidAcknowledgment(orderId: string): Promise<boolean> {
    const ack = await this.getAcknowledgment(orderId);

    if (!ack) return false;

    return (
      ack.researchPurposeOnly &&
      ack.ageConfirmation &&
      ack.noHumanConsumption &&
      ack.responsibilityAccepted &&
      ack.termsAccepted
    );
  }

  /**
   * Get required disclaimers for display
   */
  getDisclaimers() {
    return {
      primary: `All statements on this website have not been evaluated by the FDA. All products are sold strictly for research, laboratory, or analytical purposes only. Products are not intended to diagnose, treat, cure, or prevent any disease. Not for human or veterinary consumption.`,

      pharmacy: `Science Based Body operates solely as a chemical and research materials supplier. We are not a compounding pharmacy or chemical compounding facility as defined under Section 503A or 503B of the Federal Food, Drug, and Cosmetic Act.`,

      liability: `By purchasing from Science Based Body, you acknowledge that all products are intended solely for lawful laboratory research and analytical use. You accept full responsibility for ensuring compliance with all applicable federal, state, and local regulations regarding the purchase, handling, storage, and use of research materials. Science Based Body assumes no liability for any misuse of products purchased through this platform.`,

      minimumAge: this.minimumAge,
      checkboxVersion: this.checkboxVersion,
    };
  }

  /**
   * Get checkout compliance checkbox configuration
   */
  getCheckboxConfig() {
    return {
      version: this.checkboxVersion,
      minimumAge: this.minimumAge,
      checkboxes: [
        {
          id: 'researchPurposeOnly',
          required: true,
          label: 'Research Purpose Confirmation',
          text: 'I confirm that all products I am purchasing are intended solely for legitimate research, laboratory, or analytical purposes.',
        },
        {
          id: 'ageConfirmation',
          required: true,
          label: 'Age Verification',
          text: `I confirm that I am ${this.minimumAge} years of age or older.`,
        },
        {
          id: 'noHumanConsumption',
          required: true,
          label: 'Non-Consumption Acknowledgment',
          text: 'I understand and acknowledge that these products are NOT intended for human or veterinary consumption and will not be used as such.',
        },
        {
          id: 'responsibilityAccepted',
          required: true,
          label: 'Responsibility Acceptance',
          text: 'I accept full responsibility for the proper handling, storage, and lawful use of all research materials purchased.',
        },
        {
          id: 'termsAccepted',
          required: true,
          label: 'Terms & Conditions',
          text: 'I have read and agree to the Terms of Service, Privacy Policy, and Shipping & Returns Policy.',
          links: [
            { text: 'Terms of Service', url: '/terms' },
            { text: 'Privacy Policy', url: '/privacy' },
            { text: 'Shipping & Returns', url: '/shipping' },
          ],
        },
      ],
    };
  }
}

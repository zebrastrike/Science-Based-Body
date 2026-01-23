import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ForbiddenTermsService implements OnModuleInit {
  private forbiddenTerms: Map<string, { category: string; severity: string }> =
    new Map();

  // Default forbidden terms (loaded on startup)
  private readonly defaultTerms = [
    // Medical terms
    { term: 'supplement', category: 'medical', severity: 'BLOCK' },
    { term: 'treatment', category: 'medical', severity: 'BLOCK' },
    { term: 'cure', category: 'medical', severity: 'BLOCK' },
    { term: 'therapy', category: 'medical', severity: 'BLOCK' },
    { term: 'dosage', category: 'medical', severity: 'BLOCK' },
    { term: 'dose', category: 'medical', severity: 'BLOCK' },
    { term: 'patient', category: 'medical', severity: 'BLOCK' },
    { term: 'prescription', category: 'medical', severity: 'BLOCK' },
    { term: 'medication', category: 'medical', severity: 'BLOCK' },
    { term: 'healing', category: 'medical', severity: 'BLOCK' },
    { term: 'medicine', category: 'medical', severity: 'BLOCK' },
    { term: 'drug', category: 'medical', severity: 'WARN' },
    { term: 'therapeutic', category: 'medical', severity: 'BLOCK' },

    // Health claims
    { term: 'health benefit', category: 'claim', severity: 'BLOCK' },
    { term: 'wellness benefit', category: 'claim', severity: 'BLOCK' },
    { term: 'anti-aging', category: 'claim', severity: 'BLOCK' },
    { term: 'weight loss', category: 'claim', severity: 'BLOCK' },
    { term: 'muscle building', category: 'claim', severity: 'BLOCK' },
    { term: 'performance', category: 'claim', severity: 'WARN' },
    { term: 'enhancement', category: 'claim', severity: 'WARN' },
    { term: 'side effects', category: 'claim', severity: 'WARN' },

    // Regulatory claims
    { term: 'FDA approved', category: 'regulatory', severity: 'BLOCK' },
    { term: 'doctor recommended', category: 'regulatory', severity: 'BLOCK' },
    { term: 'clinical', category: 'regulatory', severity: 'WARN' },
    { term: 'clinically proven', category: 'regulatory', severity: 'BLOCK' },
  ];

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadTerms();
  }

  /**
   * Load forbidden terms from database
   */
  async loadTerms() {
    const terms = await this.prisma.forbiddenTerm.findMany();

    // If no terms in DB, seed with defaults
    if (terms.length === 0) {
      await this.seedDefaultTerms();
      return this.loadTerms();
    }

    this.forbiddenTerms.clear();
    terms.forEach((term) => {
      this.forbiddenTerms.set(term.term.toLowerCase(), {
        category: term.category || 'general',
        severity: term.severity,
      });
    });
  }

  /**
   * Seed default forbidden terms
   */
  private async seedDefaultTerms() {
    await this.prisma.forbiddenTerm.createMany({
      data: this.defaultTerms,
      skipDuplicates: true,
    });
  }

  /**
   * Validate content against forbidden terms
   * Returns list of violations or throws if blocking
   */
  validateContent(
    content: string,
    options: { throwOnBlock?: boolean } = { throwOnBlock: true },
  ): { term: string; category: string; severity: string }[] {
    const violations: { term: string; category: string; severity: string }[] = [];
    const contentLower = content.toLowerCase();

    this.forbiddenTerms.forEach((info, term) => {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      if (regex.test(contentLower)) {
        violations.push({
          term,
          category: info.category,
          severity: info.severity,
        });
      }
    });

    // Check for blocking violations
    const blockingViolations = violations.filter((v) => v.severity === 'BLOCK');

    if (blockingViolations.length > 0 && options.throwOnBlock) {
      throw new BadRequestException({
        message: 'Content contains forbidden terms',
        violations: blockingViolations.map((v) => ({
          term: v.term,
          category: v.category,
          message: `The term "${v.term}" is not allowed in product content`,
        })),
      });
    }

    return violations;
  }

  /**
   * Add a new forbidden term
   */
  async addTerm(term: string, category?: string, severity: string = 'BLOCK') {
    const created = await this.prisma.forbiddenTerm.create({
      data: {
        term: term.toLowerCase(),
        category,
        severity,
      },
    });

    this.forbiddenTerms.set(term.toLowerCase(), {
      category: category || 'general',
      severity,
    });

    return created;
  }

  /**
   * Remove a forbidden term
   */
  async removeTerm(term: string) {
    await this.prisma.forbiddenTerm.delete({
      where: { term: term.toLowerCase() },
    });

    this.forbiddenTerms.delete(term.toLowerCase());
  }

  /**
   * Get all forbidden terms
   */
  getAllTerms() {
    return Array.from(this.forbiddenTerms.entries()).map(([term, info]) => ({
      term,
      ...info,
    }));
  }

  /**
   * Check if a specific term is forbidden
   */
  isForbidden(term: string): boolean {
    return this.forbiddenTerms.has(term.toLowerCase());
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

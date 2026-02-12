import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from '../files/local-storage.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
  ) {}

  // ===========================================================================
  // USER-FACING ENDPOINTS
  // ===========================================================================

  /**
   * List documents assigned to a user
   */
  async getMyDocuments(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        requiresSignature: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return { documents };
  }

  /**
   * Download a document file
   */
  async downloadDocument(documentId: string, userId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, assignedToId: userId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const file = await this.storage.getFile(doc.filePath);

    return {
      buffer: file.buffer,
      filename: doc.originalName,
      mimeType: doc.mimeType,
    };
  }

  /**
   * E-sign a document — captures name, IP, user agent, and timestamp
   */
  async signDocument(
    documentId: string,
    userId: string,
    fullName: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, assignedToId: userId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (!doc.requiresSignature) {
      throw new BadRequestException('This document does not require a signature');
    }

    if (doc.status === 'SIGNED') {
      throw new BadRequestException('Document is already signed');
    }

    if (doc.status === 'EXPIRED' || doc.status === 'CANCELLED') {
      throw new BadRequestException('Document is no longer available for signing');
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      // Auto-expire if past deadline
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Document has expired');
    }

    const signed = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signedName: fullName,
        signedIp: ipAddress,
        signedUserAgent: userAgent,
      },
    });

    this.logger.log(`Document ${documentId} signed by user ${userId} (${fullName})`);

    return {
      success: true,
      message: 'Document signed successfully',
      signedAt: signed.signedAt,
    };
  }

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  /**
   * Upload and assign a document to a user (admin)
   */
  async uploadAndAssign(
    file: { buffer: Buffer; originalname: string },
    data: {
      title: string;
      description?: string;
      assignedToId: string;
      requiresSignature?: boolean;
      expiresAt?: string;
    },
    adminId: string,
  ) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.assignedToId },
    });
    if (!user) {
      throw new BadRequestException('Assigned user not found');
    }

    // Save file
    const saved = await this.storage.saveFile(
      file.buffer,
      file.originalname,
      'documents',
    );

    // Create document record
    const doc = await this.prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        filePath: saved.storedPath,
        originalName: saved.originalName,
        mimeType: this.getMimeType(file.originalname),
        fileSize: file.buffer.length,
        assignedToId: data.assignedToId,
        assignedById: adminId,
        requiresSignature: data.requiresSignature !== false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    this.logger.log(`Document ${doc.id} created and assigned to user ${data.assignedToId}`);

    return { id: doc.id, message: 'Document uploaded and assigned' };
  }

  /**
   * List all documents (admin)
   */
  async listAllDocuments(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status as any } : {};
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents, total, page, limit };
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return types[ext || ''] || 'application/octet-stream';
  }
}

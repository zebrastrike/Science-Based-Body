import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class BatchesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  /**
   * Get all COAs (Certificate of Analysis) - public index
   * Groups by product for the COA index page
   */
  async getCOAIndex() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        batches: {
          where: { isActive: true, coaFileId: { not: null } },
          select: {
            id: true,
            batchNumber: true,
            purityPercent: true,
            manufacturingDate: true,
            expirationDate: true,
            coaFileId: true,
          },
          orderBy: { manufacturingDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter to only products with COAs
    const productsWithCOAs = products.filter((p) => p.batches.length > 0);

    return {
      title: 'Certificate of Analysis',
      description:
        'View third-party certificates of analysis for all our research peptides. Each batch is independently tested for purity and identity.',
      products: productsWithCOAs.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        batchCount: p.batches.length,
        latestBatch: p.batches[0],
      })),
    };
  }

  /**
   * Get COAs for a specific product
   */
  async getProductCOAs(productSlug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
      include: {
        batches: {
          where: { isActive: true },
          orderBy: { manufacturingDate: 'desc' },
          include: {
            coaFile: true,
            msdsFile: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
      },
      batches: product.batches.map((batch) => ({
        id: batch.id,
        batchNumber: batch.batchNumber,
        purityPercent: batch.purityPercent,
        manufacturingDate: batch.manufacturingDate,
        expirationDate: batch.expirationDate,
        hasCOA: !!batch.coaFileId,
        hasMSDS: !!batch.msdsFileId,
      })),
    };
  }

  /**
   * Get COA download URL for a specific batch
   */
  async getCOADownloadUrl(batchId: string) {
    const batch = await this.prisma.productBatch.findUnique({
      where: { id: batchId },
      include: { coaFile: true, product: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!batch.coaFileId) {
      throw new NotFoundException('COA not available for this batch');
    }

    // Get signed URL (1 hour expiry)
    const downloadInfo = await this.filesService.getDownloadUrl(batch.coaFileId, 3600);

    // Log COA access for audit
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'ProductBatch',
        resourceId: batchId,
        metadata: {
          event: 'coa_downloaded',
          productName: batch.product.name,
          batchNumber: batch.batchNumber,
        },
      },
    });

    return {
      batchNumber: batch.batchNumber,
      productName: batch.product.name,
      purityPercent: batch.purityPercent,
      downloadUrl: downloadInfo.url,
      expiresAt: downloadInfo.expiresAt,
    };
  }

  /**
   * Get batch by batch number (for product pages)
   */
  async getBatchByNumber(batchNumber: string) {
    const batch = await this.prisma.productBatch.findUnique({
      where: { batchNumber },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      purityPercent: batch.purityPercent,
      manufacturingDate: batch.manufacturingDate,
      expirationDate: batch.expirationDate,
      product: batch.product,
      hasCOA: !!batch.coaFileId,
    };
  }

  /**
   * Get current/active batch for a product
   */
  async getCurrentBatch(productId: string) {
    const batch = await this.prisma.productBatch.findFirst({
      where: {
        productId,
        isActive: true,
        currentQuantity: { gt: 0 },
        expirationDate: { gt: new Date() },
      },
      orderBy: { manufacturingDate: 'desc' },
    });

    if (!batch) {
      return null;
    }

    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      purityPercent: batch.purityPercent,
      expirationDate: batch.expirationDate,
      hasCOA: !!batch.coaFileId,
    };
  }

  /**
   * Admin: Create a new batch
   */
  async createBatch(
    productId: string,
    data: {
      batchNumber: string;
      manufacturingDate: Date;
      expirationDate: Date;
      purityPercent: number;
      initialQuantity: number;
      notes?: string;
    },
    adminId: string,
  ) {
    const batch = await this.prisma.productBatch.create({
      data: {
        productId,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expirationDate: data.expirationDate,
        purityPercent: data.purityPercent,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        notes: data.notes,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE',
        resourceType: 'ProductBatch',
        resourceId: batch.id,
        newState: batch as any,
      },
    });

    return batch;
  }

  /**
   * Admin: Upload COA for a batch
   */
  async uploadCOA(
    batchId: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    adminId: string,
  ) {
    const batch = await this.prisma.productBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Upload file to R2
    const uploadedFile = await this.filesService.uploadFile(
      file,
      filename,
      mimeType,
      {
        bucketType: 'coa',
        fileType: 'COA',
        uploadedBy: adminId,
        isPublic: false,
      },
    );

    // Update batch with COA file reference
    await this.prisma.productBatch.update({
      where: { id: batchId },
      data: { coaFileId: uploadedFile.id },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        resourceType: 'ProductBatch',
        resourceId: batchId,
        metadata: {
          event: 'coa_uploaded',
          batchNumber: batch.batchNumber,
          fileId: uploadedFile.id,
        },
      },
    });

    return { success: true, fileId: uploadedFile.id };
  }
}

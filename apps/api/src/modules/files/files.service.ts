import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { R2StorageService, BucketType } from './r2-storage.service';
import { FileType } from '@prisma/client';

interface UploadOptions {
  bucketType: BucketType;
  fileType: FileType;
  uploadedBy?: string;
  isPublic?: boolean;
}

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private r2Storage: R2StorageService,
  ) {}

  /**
   * Upload a file and create database record
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions,
  ) {
    // Upload to R2
    const { key, bucket } = await this.r2Storage.uploadFile(
      options.bucketType,
      file,
      originalName,
      mimeType,
    );

    // Create database record
    const fileRecord = await this.prisma.file.create({
      data: {
        filename: key,
        originalName,
        mimeType,
        size: file.length,
        type: options.fileType,
        bucket,
        key,
        isPublic: options.isPublic || false,
        uploadedBy: options.uploadedBy,
      },
    });

    return fileRecord;
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId: string, expiresIn?: number) {
    const file = await this.getFile(fileId);

    // Determine bucket type from stored bucket name
    const bucketType = this.getBucketType(file.bucket);

    if (file.isPublic) {
      return {
        url: this.r2Storage.getPublicUrl(file.key),
        expiresAt: null,
      };
    }

    const url = await this.r2Storage.getSignedUrl(
      bucketType,
      file.key,
      expiresIn,
    );

    return {
      url,
      expiresAt: new Date(Date.now() + (expiresIn || 3600) * 1000),
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string) {
    const file = await this.getFile(fileId);
    const bucketType = this.getBucketType(file.bucket);

    // Delete from R2
    await this.r2Storage.deleteFile(bucketType, file.key);

    // Delete database record
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true };
  }

  /**
   * Map bucket name to bucket type
   */
  private getBucketType(bucket: string): BucketType {
    if (bucket.includes('coa')) return 'coa';
    if (bucket.includes('kyc')) return 'kyc';
    if (bucket.includes('proof')) return 'payment-proofs';
    return 'products';
  }
}

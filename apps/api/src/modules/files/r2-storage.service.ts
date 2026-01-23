import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type BucketType = 'coa' | 'kyc' | 'payment-proofs' | 'products';

@Injectable()
export class R2StorageService {
  private s3Client: S3Client;
  private buckets: Record<BucketType, string>;
  private signedUrlExpiry: number;

  constructor(private config: ConfigService) {
    this.s3Client = new S3Client({
      region: this.config.get('R2_REGION', 'auto'),
      endpoint: this.config.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.config.get('R2_SECRET_ACCESS_KEY') || '',
      },
    });

    this.buckets = {
      coa: this.config.get('R2_COA_BUCKET', 'sbb-coa-private'),
      kyc: this.config.get('R2_KYC_BUCKET', 'sbb-kyc-private'),
      'payment-proofs': this.config.get(
        'R2_PAYMENT_PROOFS_BUCKET',
        'sbb-proofs-private',
      ),
      products: this.config.get('R2_PRODUCTS_BUCKET', 'sbb-products-public'),
    };

    this.signedUrlExpiry = this.config.get('R2_SIGNED_URL_EXPIRY', 3600);
  }

  /**
   * Upload a file to R2 storage
   */
  async uploadFile(
    bucketType: BucketType,
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; bucket: string }> {
    const bucket = this.buckets[bucketType];
    const extension = originalName.split('.').pop() || '';
    const key = `${uuidv4()}.${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
        }),
      );

      return { key, bucket };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Get a signed URL for private file access
   */
  async getSignedUrl(
    bucketType: BucketType,
    key: string,
    expiresIn?: number,
  ): Promise<string> {
    const bucket = this.buckets[bucketType];
    const expiry = expiresIn || this.signedUrlExpiry;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expiry });
    } catch (error) {
      console.error('R2 signed URL error:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(bucketType: BucketType, key: string): Promise<void> {
    const bucket = this.buckets[bucketType];

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(bucketType: BucketType, key: string): Promise<boolean> {
    const bucket = this.buckets[bucketType];

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get public URL for products bucket
   */
  getPublicUrl(key: string): string {
    const accountId = this.config.get('CLOUDFLARE_ACCOUNT_ID');
    const bucket = this.buckets.products;
    return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  }
}

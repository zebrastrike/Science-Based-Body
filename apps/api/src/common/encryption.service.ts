import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption service for PII (Personally Identifiable Information)
 * Uses AES-256-GCM for authenticated encryption
 *
 * Required environment variable:
 * ENCRYPTION_KEY - 64 character hex string (32 bytes)
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly key: Buffer | null;

  constructor(private config: ConfigService) {
    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      this.logger.warn('ENCRYPTION_KEY not set - PII encryption disabled');
      this.key = null;
    } else if (encryptionKey.length !== 64) {
      this.logger.error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
      this.key = null;
    } else {
      this.key = Buffer.from(encryptionKey, 'hex');
    }
  }

  /**
   * Check if encryption is available
   */
  isEnabled(): boolean {
    return this.key !== null;
  }

  /**
   * Encrypt sensitive data
   * Returns format: iv:authTag:encryptedData (all base64 encoded)
   */
  encrypt(plaintext: string): string {
    if (!this.key) {
      this.logger.warn('Encryption disabled - storing plaintext (NOT RECOMMENDED)');
      return plaintext;
    }

    if (!plaintext) {
      return '';
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encryptedData
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * Expects format: iv:authTag:encryptedData (all base64 encoded)
   */
  decrypt(ciphertext: string): string {
    if (!this.key) {
      // If encryption was disabled, data is stored as plaintext
      return ciphertext;
    }

    if (!ciphertext) {
      return '';
    }

    // Check if this is encrypted data (contains colons for our format)
    if (!ciphertext.includes(':')) {
      // Likely plaintext from before encryption was enabled
      this.logger.warn('Data appears to be unencrypted plaintext');
      return ciphertext;
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encryptedBase64] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const encrypted = Buffer.from(encryptedBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for comparison (one-way, non-reversible)
   * Useful for searching encrypted fields
   */
  hash(data: string): string {
    if (!data) return '';
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Mask sensitive data for display (e.g., show only last 4 digits)
   */
  mask(data: string, visibleChars = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 0);
    }
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

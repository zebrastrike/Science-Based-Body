import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get('UPLOAD_DIR', './uploads');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const subdirs = ['affiliates', 'partners'];
    for (const sub of subdirs) {
      const dir = path.join(this.uploadDir, sub);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created upload directory: ${dir}`);
      }
    }
  }

  /**
   * Save an uploaded file to local storage
   * Returns the stored file path relative to uploadDir
   */
  async saveFile(
    buffer: Buffer,
    originalFilename: string,
    subdir: 'affiliates' | 'partners',
  ): Promise<{ storedPath: string; originalName: string; size: number }> {
    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate extension
    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File type ${ext} not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Sanitize: use UUID filename to prevent path traversal
    const safeFilename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, subdir, safeFilename);

    await fs.promises.writeFile(filePath, buffer);
    this.logger.log(`File saved: ${subdir}/${safeFilename} (${buffer.length} bytes)`);

    return {
      storedPath: `${subdir}/${safeFilename}`,
      originalName: originalFilename.replace(/[^\w\s.-]/g, ''),
      size: buffer.length,
    };
  }

  /**
   * Read a file from local storage
   */
  async getFile(storedPath: string): Promise<{ buffer: Buffer; filename: string }> {
    // Prevent path traversal
    const normalized = path.normalize(storedPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(this.uploadDir, normalized);

    if (!fullPath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException('File not found');
    }

    const buffer = await fs.promises.readFile(fullPath);
    const filename = path.basename(fullPath);
    return { buffer, filename };
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(storedPath: string): Promise<void> {
    const normalized = path.normalize(storedPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(this.uploadDir, normalized);

    if (!fullPath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      this.logger.log(`File deleted: ${storedPath}`);
    }
  }
}

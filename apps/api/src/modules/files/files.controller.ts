import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileType } from '@prisma/client';
import { BucketType } from './r2-storage.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload/:type')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['coa', 'kyc', 'payment-proof', 'product-image'];
    if (!allowedTypes.includes(type)) {
      throw new BadRequestException('Invalid file type');
    }

    // Map to bucket and file type
    const mapping: Record<
      string,
      { bucketType: BucketType; fileType: FileType }
    > = {
      coa: { bucketType: 'coa', fileType: 'COA' },
      kyc: { bucketType: 'kyc', fileType: 'KYC_DOCUMENT' },
      'payment-proof': { bucketType: 'payment-proofs', fileType: 'PAYMENT_PROOF' },
      'product-image': { bucketType: 'products', fileType: 'PRODUCT_IMAGE' },
    };

    const { bucketType, fileType } = mapping[type];

    return this.filesService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        bucketType,
        fileType,
        uploadedBy: userId,
        isPublic: type === 'product-image',
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file info' })
  async getFile(@Param('id') id: string) {
    return this.filesService.getFile(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for a file' })
  async getDownloadUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    return this.filesService.getDownloadUrl(id, expiresIn);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a file (Admin only)' })
  async deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}

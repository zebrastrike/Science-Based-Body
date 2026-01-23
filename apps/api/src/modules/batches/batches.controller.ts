import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('batches')
@Controller('batches')
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  // ========== PUBLIC COA ENDPOINTS ==========

  @Get('coa')
  @Public()
  @ApiOperation({ summary: 'Get COA index - all products with COAs' })
  @ApiResponse({ status: 200, description: 'COA index' })
  getCOAIndex() {
    return this.batchesService.getCOAIndex();
  }

  @Get('coa/product/:slug')
  @Public()
  @ApiOperation({ summary: 'Get COAs for a specific product' })
  @ApiResponse({ status: 200, description: 'Product COAs' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductCOAs(@Param('slug') slug: string) {
    return this.batchesService.getProductCOAs(slug);
  }

  @Get('coa/download/:batchId')
  @Public()
  @ApiOperation({ summary: 'Get COA download URL for a batch' })
  @ApiResponse({ status: 200, description: 'Download URL with expiry' })
  @ApiResponse({ status: 404, description: 'Batch or COA not found' })
  getCOADownloadUrl(@Param('batchId') batchId: string) {
    return this.batchesService.getCOADownloadUrl(batchId);
  }

  @Get('lookup/:batchNumber')
  @Public()
  @ApiOperation({ summary: 'Lookup batch by batch number' })
  @ApiResponse({ status: 200, description: 'Batch details' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  getBatchByNumber(@Param('batchNumber') batchNumber: string) {
    return this.batchesService.getBatchByNumber(batchNumber);
  }

  @Get('current/:productId')
  @Public()
  @ApiOperation({ summary: 'Get current active batch for a product' })
  @ApiResponse({ status: 200, description: 'Current batch or null' })
  getCurrentBatch(@Param('productId') productId: string) {
    return this.batchesService.getCurrentBatch(productId);
  }

  // ========== ADMIN ENDPOINTS ==========

  @Post('admin/create')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new batch (Admin only)' })
  async createBatch(
    @Body()
    body: {
      productId: string;
      batchNumber: string;
      manufacturingDate: string;
      expirationDate: string;
      purityPercent: number;
      initialQuantity: number;
      notes?: string;
    },
    @CurrentUser('id') adminId: string,
  ) {
    return this.batchesService.createBatch(
      body.productId,
      {
        batchNumber: body.batchNumber,
        manufacturingDate: new Date(body.manufacturingDate),
        expirationDate: new Date(body.expirationDate),
        purityPercent: body.purityPercent,
        initialQuantity: body.initialQuantity,
        notes: body.notes,
      },
      adminId,
    );
  }

  @Post('admin/:batchId/upload-coa')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('coa'))
  @ApiOperation({ summary: 'Upload COA for a batch (Admin only)' })
  async uploadCOA(
    @Param('batchId') batchId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') adminId: string,
  ) {
    return this.batchesService.uploadCOA(
      batchId,
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { SignDocumentDto } from './dto/sign-document.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// ===========================================================================
// USER-FACING CONTROLLER
// ===========================================================================

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List my assigned documents' })
  @ApiResponse({ status: 200, description: 'Documents list' })
  getMyDocuments(@CurrentUser('id') userId: string) {
    return this.documentsService.getMyDocuments(userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.downloadDocument(id, userId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'E-sign a document' })
  @ApiResponse({ status: 200, description: 'Document signed' })
  @ApiResponse({ status: 400, description: 'Cannot sign document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  signDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SignDocumentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.documentsService.signDocument(id, userId, dto.fullName, ipAddress, userAgent);
  }
}

// ===========================================================================
// ADMIN CONTROLLER
// ===========================================================================

@ApiTags('admin/documents')
@Controller('admin/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminDocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and assign a document to a user' })
  @ApiResponse({ status: 201, description: 'Document uploaded and assigned' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      title: string;
      description?: string;
      assignedToId: string;
      requiresSignature?: string;
      expiresAt?: string;
    },
    @CurrentUser('id') adminId: string,
  ) {
    return this.documentsService.uploadAndAssign(
      { buffer: file.buffer, originalname: file.originalname },
      {
        title: body.title,
        description: body.description,
        assignedToId: body.assignedToId,
        requiresSignature: body.requiresSignature !== 'false',
        expiresAt: body.expiresAt,
      },
      adminId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all documents' })
  async listAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.listAllDocuments(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { ApplyPartnerDto } from './dto/apply-partner.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  @Post('apply')
  @Public()
  @UseInterceptors(FilesInterceptor('documents', 5))
  @ApiOperation({ summary: 'Submit brand partner application' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  async apply(
    @Body() dto: ApplyPartnerDto,
    @UploadedFiles() documents?: Express.Multer.File[],
  ) {
    const files = documents?.map((d) => ({
      buffer: d.buffer,
      originalname: d.originalname,
    }));
    return this.partnersService.apply(dto, files);
  }
}

// ===========================================================================
// ADMIN CONTROLLER
// ===========================================================================

@ApiTags('admin/partners')
@Controller('admin/partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminPartnersController {
  constructor(private partnersService: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'List partner applications' })
  async listApplications(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.listApplications(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner application detail' })
  async getApplication(@Param('id') id: string) {
    return this.partnersService.getApplication(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve partner application' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.partnersService.approveApplication(id, adminId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject partner application' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason?: string,
  ) {
    return this.partnersService.rejectApplication(id, adminId, reason);
  }
}

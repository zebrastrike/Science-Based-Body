import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { ApplyAffiliateDto } from './dto/apply-affiliate.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('affiliates')
@Controller('affiliates')
export class AffiliatesController {
  constructor(private affiliatesService: AffiliatesService) {}

  // ===========================================================================
  // PUBLIC ENDPOINTS
  // ===========================================================================

  @Post('apply')
  @Public()
  @UseInterceptors(FileInterceptor('resume'))
  @ApiOperation({ summary: 'Submit affiliate application' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  async apply(
    @Body() dto: ApplyAffiliateDto,
    @UploadedFile() resume?: Express.Multer.File,
  ) {
    const file = resume
      ? { buffer: resume.buffer, originalname: resume.originalname }
      : undefined;
    return this.affiliatesService.apply(dto, file);
  }

  @Get('track/:code')
  @Public()
  @ApiOperation({ summary: 'Track affiliate link click' })
  async trackClick(@Param('code') code: string) {
    return this.affiliatesService.trackClick(code);
  }

  @Get('r/:code')
  @Public()
  @ApiOperation({ summary: 'Clean affiliate redirect — sets cookie and redirects to homepage' })
  @ApiResponse({ status: 302, description: 'Redirects to sbbpeptides.com with tracking cookie set' })
  async cleanRedirect(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    // Track the click (non-blocking)
    this.affiliatesService.trackClick(code).catch(() => {});

    // Set the affiliate cookie (30 days)
    res.cookie('sbb_ref', code, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });

    // Redirect to clean homepage — no query params visible
    res.redirect(302, 'https://sbbpeptides.com');
  }

  // ===========================================================================
  // AFFILIATE DASHBOARD ENDPOINTS (Authenticated affiliates)
  // ===========================================================================

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my affiliate stats' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.affiliatesService.getMyStats(userId);
  }

  @Get('me/referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referral history' })
  async getMyReferrals(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.affiliatesService.getMyReferrals(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}

// ===========================================================================
// ADMIN CONTROLLER (separate for clarity)
// ===========================================================================

@ApiTags('admin/affiliates')
@Controller('admin/affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminAffiliatesController {
  constructor(private affiliatesService: AffiliatesService) {}

  @Get()
  @ApiOperation({ summary: 'List affiliate applications' })
  async listApplications(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.affiliatesService.listApplications(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get affiliate application detail' })
  async getApplication(@Param('id') id: string) {
    return this.affiliatesService.getApplication(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve affiliate application' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.affiliatesService.approveApplication(id, adminId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject affiliate application' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason?: string,
  ) {
    return this.affiliatesService.rejectApplication(id, adminId, reason);
  }
}

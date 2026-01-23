import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get policies index/navigation' })
  @ApiResponse({ status: 200, description: 'Policies index' })
  getPoliciesIndex() {
    return this.policiesService.getPoliciesIndex();
  }

  @Get('footer-disclaimer')
  @Public()
  @ApiOperation({ summary: 'Get footer disclaimer text' })
  @ApiResponse({ status: 200, description: 'Footer disclaimer' })
  getFooterDisclaimer() {
    return this.policiesService.getFooterDisclaimer();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get specific policy page' })
  @ApiResponse({ status: 200, description: 'Policy content' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  getPolicy(@Param('slug') slug: string) {
    return this.policiesService.getPolicy(slug);
  }
}

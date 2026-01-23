import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { ForbiddenTermsService } from './forbidden-terms.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(
    private complianceService: ComplianceService,
    private forbiddenTermsService: ForbiddenTermsService,
  ) {}

  @Get('disclaimers')
  @Public()
  @ApiOperation({ summary: 'Get required legal disclaimers' })
  @ApiResponse({ status: 200, description: 'Disclaimers retrieved successfully' })
  getDisclaimers() {
    return this.complianceService.getDisclaimers();
  }

  @Get('checkout-config')
  @Public()
  @ApiOperation({ summary: 'Get checkout compliance checkbox configuration' })
  @ApiResponse({ status: 200, description: 'Checkbox config retrieved successfully' })
  getCheckboxConfig() {
    return this.complianceService.getCheckboxConfig();
  }

  @Post('validate-content')
  @ApiOperation({ summary: 'Validate content against forbidden terms' })
  @ApiResponse({ status: 200, description: 'Content validation result' })
  @ApiResponse({ status: 400, description: 'Content contains forbidden terms' })
  validateContent(@Body() body: { content: string }) {
    const violations = this.forbiddenTermsService.validateContent(body.content, {
      throwOnBlock: false,
    });

    return {
      valid: violations.filter((v) => v.severity === 'BLOCK').length === 0,
      violations,
    };
  }

  @Get('acknowledgment/:orderId')
  @ApiOperation({ summary: 'Get compliance acknowledgment for an order' })
  @ApiResponse({ status: 200, description: 'Acknowledgment retrieved' })
  @ApiResponse({ status: 404, description: 'Acknowledgment not found' })
  getAcknowledgment(@Param('orderId') orderId: string) {
    return this.complianceService.getAcknowledgment(orderId);
  }
}

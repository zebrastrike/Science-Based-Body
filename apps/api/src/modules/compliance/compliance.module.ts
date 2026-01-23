import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ForbiddenTermsService } from './forbidden-terms.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, ForbiddenTermsService],
  exports: [ComplianceService, ForbiddenTermsService],
})
export class ComplianceModule {}

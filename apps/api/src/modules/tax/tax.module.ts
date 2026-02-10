import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}

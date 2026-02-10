import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxService } from './tax.service';
import { Public } from '../auth/decorators/public.decorator';

class TaxLineItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

class CalculateTaxDto {
  @IsString()
  toState: string;

  @IsString()
  toZip: string;

  @IsString()
  toCity: string;

  @IsOptional()
  @IsString()
  toCountry?: string;

  @IsNumber()
  @Min(0)
  shipping: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxLineItemDto)
  lineItems: TaxLineItemDto[];
}

@ApiTags('tax')
@Controller('tax')
export class TaxController {
  constructor(private taxService: TaxService) {}

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate sales tax for an order' })
  @ApiResponse({ status: 200, description: 'Tax calculation result' })
  async calculateTax(@Body() dto: CalculateTaxDto) {
    return this.taxService.calculateTax({
      toState: dto.toState,
      toZip: dto.toZip,
      toCity: dto.toCity,
      toCountry: dto.toCountry || 'US',
      shipping: dto.shipping,
      lineItems: dto.lineItems,
    });
  }
}

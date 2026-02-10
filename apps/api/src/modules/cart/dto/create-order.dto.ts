import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  street1: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ComplianceDto {
  @IsBoolean()
  researchPurposeOnly: boolean;

  @IsBoolean()
  ageConfirmation: boolean;

  @IsBoolean()
  noHumanConsumption: boolean;

  @IsBoolean()
  responsibilityAccepted: boolean;

  @IsBoolean()
  termsAccepted: boolean;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  billingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsBoolean()
  sameAsShipping?: boolean;

  @IsString()
  shippingMethod: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ValidateNested()
  @Type(() => ComplianceDto)
  compliance: ComplianceDto;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsString()
  affiliateReferralCode?: string;
}

export class ResolveCartItemDto {
  @IsString()
  cartId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ResolveCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolveCartItemDto)
  items: ResolveCartItemDto[];
}

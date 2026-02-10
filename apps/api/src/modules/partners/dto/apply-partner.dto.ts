import { IsString, IsOptional, IsEmail } from 'class-validator';

export class ApplyPartnerDto {
  @IsString()
  organizationName: string;

  @IsString()
  contactName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  orgType: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  partnershipFocus?: string;

  @IsOptional()
  @IsString()
  partnershipOverview?: string;
}

import { IsString, IsOptional, IsObject, IsEmail, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ApplyAffiliateDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  primaryPlatform: string;

  @IsObject()
  socialLinks: Record<string, string>;

  @IsOptional()
  @IsString()
  audienceSize?: string;

  @IsOptional()
  @IsString()
  contentFocus?: string;

  @IsOptional()
  @IsString()
  whyPartner?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  applyAsSalesAgent?: boolean;
}

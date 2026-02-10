import { IsString, IsOptional, IsObject, IsEmail } from 'class-validator';

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
}

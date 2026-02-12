import { IsString } from 'class-validator';

export class SignDocumentDto {
  @IsString()
  fullName: string;
}

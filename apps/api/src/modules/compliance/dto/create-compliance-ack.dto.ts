import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplianceAckDto {
  @ApiProperty({
    description: 'Confirms products are for research purposes only',
    example: true,
  })
  @IsBoolean()
  researchPurposeOnly: boolean;

  @ApiProperty({
    description: 'Confirms user is 18 years of age or older',
    example: true,
  })
  @IsBoolean()
  ageConfirmation: boolean;

  @ApiProperty({
    description: 'Acknowledges products are not for human consumption',
    example: true,
  })
  @IsBoolean()
  noHumanConsumption: boolean;

  @ApiProperty({
    description: 'Accepts responsibility for proper handling',
    example: true,
  })
  @IsBoolean()
  responsibilityAccepted: boolean;

  @ApiProperty({
    description: 'Accepts Terms of Service',
    example: true,
  })
  @IsBoolean()
  termsAccepted: boolean;
}

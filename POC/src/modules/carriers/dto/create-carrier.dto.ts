import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsMcNumber } from '../../../common/validators/is-mc-number.validator';

class ContactInfoDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateCarrierDto {
  @ApiProperty({ example: 'Swift Logistics LLC' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'MC123456', description: 'Motor Carrier number' })
  @IsMcNumber()
  mcNumber!: string;

  @ApiProperty({ example: 'DOT7654321' })
  @IsString()
  @Matches(/^DOT\d{5,8}$/, { message: 'dotNumber must match "DOT" + 5-8 digits' })
  dotNumber!: string;

  @ApiPropertyOptional({ type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  @IsOptional()
  contactInfo?: ContactInfoDto;
}

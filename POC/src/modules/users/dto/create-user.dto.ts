import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../shared/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: Role, isArray: true, example: [Role.USER] })
  @IsArray()
  @IsEnum(Role, { each: true })
  @ArrayUnique()
  @IsOptional()
  roles?: Role[];
}

import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDecimal,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: '+1-555-1234' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MaxLength(100)
  position: string;

  @ApiPropertyOptional({ example: 75000.00 })
  @IsDecimal()
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({ example: 'uuid-of-department' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  country?: string;

  @ApiPropertyOptional({ example: 'Jane Doe: +1-555-5678' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Additional notes about the employee' })
  @IsString()
  @IsOptional()
  notes?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class LocationDto {
  @ApiProperty({ example: '123 Market St' })
  @IsString()
  @MinLength(3)
  address!: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 37.7749 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: -122.4194 })
  @IsNumber()
  @IsOptional()
  lng?: number;
}

export class CreateShipmentDto {
  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  origin!: LocationDto;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  destination!: LocationDto;

  @ApiPropertyOptional({ description: 'Carrier id to assign at creation' })
  @IsMongoId()
  @IsOptional()
  carrierId?: string;

  @ApiPropertyOptional({ example: 250.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: '2026-07-01T12:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  estimatedDeliveryAt?: string;
}

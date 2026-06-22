import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ShipmentStatus } from '../../../shared/enums';

/** Appends a tracking event and (usually) advances the shipment status. */
export class AddTrackingEventDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Departed sorting facility' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Chicago, IL' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 41.8781 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: -87.6298 })
  @IsNumber()
  @IsOptional()
  lng?: number;
}

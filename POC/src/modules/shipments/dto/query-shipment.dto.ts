import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ShipmentStatus } from '../../../shared/enums';

/** Pagination + shipment-specific filters. */
export class QueryShipmentDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  carrierId?: string;
}

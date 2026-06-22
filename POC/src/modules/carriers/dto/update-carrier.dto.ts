import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCarrierDto } from './create-carrier.dto';
import { CarrierStatus } from '../../../shared/enums';

export class UpdateCarrierDto extends PartialType(CreateCarrierDto) {
  @ApiPropertyOptional({ enum: CarrierStatus })
  @IsEnum(CarrierStatus)
  @IsOptional()
  status?: CarrierStatus;
}

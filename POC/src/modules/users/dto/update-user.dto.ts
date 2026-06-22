import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserStatus } from '../../../shared/enums';

/**
 * All create fields optional (PartialType) minus password, plus a status field.
 * Demonstrates Swagger/DTO composition utilities.
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

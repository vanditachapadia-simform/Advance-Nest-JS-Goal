import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsUUID()
  userId: string;

  @IsString()
  action: string;

  @IsString()
  entity: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsObject()
  @IsOptional()
  details?: any;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

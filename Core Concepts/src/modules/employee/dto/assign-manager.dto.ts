import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManagerDto {
  @ApiProperty({ example: 'uuid-of-manager-employee' })
  @IsUUID()
  managerId: string;
}

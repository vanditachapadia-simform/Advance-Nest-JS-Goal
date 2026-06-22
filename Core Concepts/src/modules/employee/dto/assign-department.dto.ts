import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDepartmentDto {
  @ApiProperty({ example: 'uuid-of-department' })
  @IsUUID()
  departmentId: string;
}

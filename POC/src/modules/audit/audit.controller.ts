import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Query the audit trail (admin only)' })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.findAll(pagination, { entity, userId });
  }
}

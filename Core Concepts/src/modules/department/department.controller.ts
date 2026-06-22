import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogService } from '../user/audit-log.service';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 409, description: 'Department already exists' })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.departmentService.create(createDepartmentDto);

    await this.auditLogService.logAction(
      user.id,
      'CREATE',
      'Department',
      result.id,
      createDepartmentDto,
    );

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.departmentService.findAll(
      paginationDto,
      includeInactive === 'true',
    );
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get simple list of departments (for dropdowns)' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  async findAllSimple() {
    return this.departmentService.findAllSimple();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Department retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.departmentService.findOne(id);
  }

  @Get(':id/statistics')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get department statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(@Param('id', ParseUuidPipe) id: string) {
    return this.departmentService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.departmentService.update(id, updateDepartmentDto);

    await this.auditLogService.logAction(
      user.id,
      'UPDATE',
      'Department',
      id,
      updateDepartmentDto,
    );

    return result;
  }

  @Post(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate department' })
  @ApiResponse({ status: 200, description: 'Department deactivated successfully' })
  async deactivate(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.departmentService.deactivate(id);

    await this.auditLogService.logAction(
      user.id,
      'DEACTIVATE',
      'Department',
      id,
    );

    return result;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete department (Admin only)' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({ status: 409, description: 'Cannot delete department with employees' })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.departmentService.remove(id);

    await this.auditLogService.logAction(user.id, 'DELETE', 'Department', id);

    return result;
  }
}

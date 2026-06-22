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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogService } from '../user/audit-log.service';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new employee (Admin/Manager only)' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 404, description: 'User or Department not found' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.create(createEmployeeDto);

    await this.auditLogService.logAction(
      user.id,
      'CREATE',
      'Employee',
      result.id,
      createEmployeeDto,
    );

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees with filters' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async findAll(@Query() filterDto: FilterEmployeeDto) {
    return this.employeeService.findAll(filterDto);
  }

  @Get('statistics')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get employee statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.employeeService.getStatistics();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search employees by name or email' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.employeeService.search(
      query,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current employee profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.employeeService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update employee (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.update(id, updateEmployeeDto);

    await this.auditLogService.logAction(
      user.id,
      'UPDATE',
      'Employee',
      id,
      updateEmployeeDto,
    );

    return result;
  }

  @Post(':id/assign-department')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Assign employee to department' })
  @ApiResponse({ status: 200, description: 'Employee assigned successfully' })
  async assignDepartment(
    @Param('id', ParseUuidPipe) id: string,
    @Body() assignDepartmentDto: AssignDepartmentDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.assignDepartment(
      id,
      assignDepartmentDto.departmentId,
    );

    await this.auditLogService.logAction(
      user.id,
      'ASSIGN_DEPARTMENT',
      'Employee',
      id,
      assignDepartmentDto,
    );

    return result;
  }

  @Post(':id/remove-department')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Remove employee from department' })
  @ApiResponse({ status: 200, description: 'Employee removed from department' })
  async removeDepartment(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.removeDepartment(id);

    await this.auditLogService.logAction(
      user.id,
      'REMOVE_DEPARTMENT',
      'Employee',
      id,
    );

    return result;
  }

  @Post(':id/assign-manager')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Assign a manager to an employee (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Manager assigned successfully' })
  @ApiResponse({ status: 404, description: 'Employee or manager not found' })
  async assignManager(
    @Param('id', ParseUuidPipe) id: string,
    @Body() assignManagerDto: AssignManagerDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.assignManager(id, assignManagerDto.managerId);

    await this.auditLogService.logAction(
      user.id,
      'ASSIGN_MANAGER',
      'Employee',
      id,
      assignManagerDto,
    );

    return result;
  }

  @Post(':id/remove-manager')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Remove manager from an employee (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Manager removed successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async removeManager(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.removeManager(id);

    await this.auditLogService.logAction(user.id, 'REMOVE_MANAGER', 'Employee', id);

    return result;
  }

  @Get('me/reports')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get direct reports of the current manager' })
  @ApiResponse({ status: 200, description: 'Direct reports retrieved successfully' })
  async getMyReports(@CurrentUser() user: any) {
    const me = await this.employeeService.findByUserId(user.id);
    return this.employeeService.getDirectReports(me.id);
  }

  @Get(':id/reports')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get direct reports of a manager employee (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Direct reports retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Manager employee not found' })
  async getDirectReports(@Param('id', ParseUuidPipe) id: string) {
    return this.employeeService.getDirectReports(id);
  }

  @Get(':id/manager')
  @ApiOperation({ summary: 'Get the manager of an employee' })
  @ApiResponse({ status: 200, description: 'Manager retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getManager(@Param('id', ParseUuidPipe) id: string) {
    return this.employeeService.getManager(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete employee (Admin only)' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.employeeService.remove(id);

    await this.auditLogService.logAction(user.id, 'DELETE', 'Employee', id);

    return result;
  }
}

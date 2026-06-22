import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuditLogService } from './audit-log.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get all users (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.userService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.userService.update(id, updateUserDto, user);

    await this.auditLogService.logAction(
      user.id,
      'UPDATE',
      'User',
      id,
      updateUserDto,
    );

    return result;
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Param('id', ParseUuidPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.userService.changePassword(
      id,
      changePasswordDto,
      user,
    );

    await this.auditLogService.logAction(
      user.id,
      'CHANGE_PASSWORD',
      'User',
      id,
    );

    return result;
  }

  @Post(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async deactivate(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.userService.deactivate(id);

    await this.auditLogService.logAction(user.id, 'DEACTIVATE', 'User', id);

    return result;
  }

  @Post(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activate(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.userService.activate(id);

    await this.auditLogService.logAction(user.id, 'ACTIVATE', 'User', id);

    return result;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user permanently (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.userService.remove(id);

    await this.auditLogService.logAction(user.id, 'DELETE', 'User', id);

    return result;
  }

  @Get('audit-logs/all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.findAll({
      userId,
      entity,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}

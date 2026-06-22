import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.notificationsService.findForUser(user.userId, pagination);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.userId, id);
  }
}

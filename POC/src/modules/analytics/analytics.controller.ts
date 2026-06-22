import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Dashboard statistics (cached 30s)' })
  dashboard() {
    return this.analyticsService.getDashboard();
  }

  @Post('reports/dashboard')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Queue async generation of a dashboard report' })
  requestReport() {
    return this.analyticsService.requestDashboardReport();
  }

  @Get('reports/lazy')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate a report via a lazily-loaded module' })
  lazyReport(@Query('type') type = 'summary') {
    return this.analyticsService.generateLazyReport(type);
  }
}

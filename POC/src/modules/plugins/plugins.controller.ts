import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PluginExplorer } from './plugins.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums';

@ApiTags('Plugins')
@ApiBearerAuth()
@Controller({ path: 'plugins', version: '1' })
export class PluginsController {
  constructor(private readonly pluginExplorer: PluginExplorer) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List discovered plugins (admin only)' })
  list() {
    return this.pluginExplorer.listPlugins();
  }
}

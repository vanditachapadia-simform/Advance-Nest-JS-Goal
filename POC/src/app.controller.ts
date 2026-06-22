import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Service banner' })
  root() {
    return {
      service: 'Enterprise Logistics & Shipment Management Platform',
      status: 'ok',
      docs: '/docs',
      health: '/health',
    };
  }
}

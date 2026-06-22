import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalApiService } from './external-api.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  constructor(private readonly externalApi: ExternalApiService) {}

  @Get('weather')
  @ApiOperation({ summary: 'Proxy current weather for a coordinate (with retry)' })
  weather(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.externalApi.getWeather(Number(lat), Number(lng));
  }

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode an address via the maps provider' })
  geocode(@Query('address') address: string) {
    return this.externalApi.geocode(address);
  }
}

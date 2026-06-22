import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { map, Observable, startWith } from 'rxjs';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { AddTrackingEventDto } from './dto/add-tracking-event.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { Role } from '../../shared/enums';

interface MessageEvent {
  data: string | object;
  type?: string;
  id?: string;
}

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller({ path: 'shipments', version: '1' })
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.USER)
  @Audit({ action: 'CREATE', entity: 'Shipment' })
  @ApiOperation({ summary: 'Create a shipment' })
  create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('correlationId') correlationId?: string,
  ) {
    return this.shipmentsService.create(dto, user.userId, correlationId);
  }

  @Get()
  @ApiOperation({ summary: 'List shipments with filters (paginated)' })
  findAll(@Query() query: QueryShipmentDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get(':id')
  @UseInterceptors(HttpCacheInterceptor)
  @Cacheable('shipment', 60)
  @ApiOperation({ summary: 'Get a shipment by id (cached 60s)' })
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findById(id);
  }

  @Patch(':id/assign-carrier/:carrierId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DISPATCHER)
  @Audit({ action: 'ASSIGN_CARRIER', entity: 'Shipment' })
  @ApiOperation({ summary: 'Assign a carrier to a shipment' })
  assignCarrier(@Param('id') id: string, @Param('carrierId') carrierId: string) {
    return this.shipmentsService.assignCarrier(id, carrierId);
  }

  @Post(':id/tracking')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.CARRIER)
  @Audit({ action: 'ADD_TRACKING', entity: 'Shipment' })
  @ApiOperation({ summary: 'Append a tracking event (advances status)' })
  addTracking(@Param('id') id: string, @Body() dto: AddTrackingEventDto) {
    return this.shipmentsService.addTrackingEvent(id, dto);
  }

  /**
   * Server-Sent Events stream of live tracking updates for one shipment.
   * `@Public()` because EventSource cannot set Authorization headers easily;
   * in production this would validate a short-lived token via query string.
   */
  @Public()
  @Sse(':id/live')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'SSE stream of live tracking updates for a shipment' })
  live(@Param('id') id: string): Observable<MessageEvent> {
    return this.shipmentsService.getLiveStream(id).pipe(
      // Emit an initial comment so the client connection opens immediately.
      startWith({ shipmentId: id, status: 'CONNECTED', timestamp: new Date().toISOString() }),
      map((update) => ({ data: update, type: 'tracking' })),
    );
  }
}

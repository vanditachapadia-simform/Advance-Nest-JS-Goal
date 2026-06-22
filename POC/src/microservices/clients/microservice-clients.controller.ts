import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { PATTERNS, TOKENS } from '../../shared/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums';

/**
 * Gateway-side proxy demonstrating microservice communication:
 *  - `send()`  → `@MessagePattern` (awaits a reply)
 *  - `emit()`  → `@EventPattern`   (fire-and-forget)
 */
@ApiTags('Microservices')
@ApiBearerAuth()
@Controller({ path: 'ms', version: '1' })
export class MicroserviceClientsController {
  constructor(
    @Inject(TOKENS.USER_SERVICE_CLIENT) private readonly userClient: ClientProxy,
    @Inject(TOKENS.SHIPMENT_SERVICE_CLIENT) private readonly shipmentClient: ClientProxy,
    @Inject(TOKENS.NOTIFICATION_SERVICE_CLIENT) private readonly notificationClient: ClientProxy,
  ) {}

  @Get('user/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'RPC to user-service (MessagePattern)' })
  async getUser(@Param('id') id: string) {
    return firstValueFrom(this.userClient.send(PATTERNS.USER_FIND_BY_ID, { id }));
  }

  @Get('shipments/summary')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'RPC to shipment-service (MessagePattern)' })
  async shipmentSummary() {
    return firstValueFrom(this.shipmentClient.send(PATTERNS.SHIPMENT_GET_SUMMARY, {}));
  }

  @Post('notify-test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'RPC to notification-service (MessagePattern)' })
  async notifyTest() {
    return firstValueFrom(
      this.notificationClient.send(PATTERNS.NOTIFICATION_SEND, {
        userId: 'test',
        title: 'Ping',
        message: 'Hello from gateway',
      }),
    );
  }
}

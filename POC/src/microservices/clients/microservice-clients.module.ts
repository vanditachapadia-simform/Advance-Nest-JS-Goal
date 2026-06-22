import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TOKENS } from '../../shared/constants';
import { MicroserviceClientsController } from './microservice-clients.controller';

/**
 * Registers TCP client proxies to the three microservices. `registerAsync`
 * resolves each host/port from config — a clean example of async custom
 * providers producing `ClientProxy` instances injected by token.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: TOKENS.USER_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.user.host'),
            port: config.get<number>('microservices.user.port'),
          },
        }),
      },
      {
        name: TOKENS.SHIPMENT_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.shipment.host'),
            port: config.get<number>('microservices.shipment.port'),
          },
        }),
      },
      {
        name: TOKENS.NOTIFICATION_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.notification.host'),
            port: config.get<number>('microservices.notification.port'),
          },
        }),
      },
    ]),
  ],
  controllers: [MicroserviceClientsController],
  exports: [ClientsModule],
})
export class MicroserviceClientsModule {}

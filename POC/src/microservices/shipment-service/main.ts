import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ShipmentServiceModule } from './shipment-service.module';

/** Boots the Shipment microservice over TCP (default port 3002). */
async function bootstrap(): Promise<void> {
  const host = process.env.SHIPMENT_SERVICE_HOST ?? '0.0.0.0';
  const port = parseInt(process.env.SHIPMENT_SERVICE_PORT ?? '3002', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ShipmentServiceModule, {
    transport: Transport.TCP,
    options: { host, port },
  });
  await app.listen();
  new Logger('ShipmentService').log(`Shipment microservice listening on TCP ${host}:${port}`);
}

void bootstrap();

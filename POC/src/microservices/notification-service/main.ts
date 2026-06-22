import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { NotificationServiceModule } from './notification-service.module';

/** Boots the Notification microservice over TCP (default port 3003). */
async function bootstrap(): Promise<void> {
  const host = process.env.NOTIFICATION_SERVICE_HOST ?? '0.0.0.0';
  const port = parseInt(process.env.NOTIFICATION_SERVICE_PORT ?? '3003', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule, {
    transport: Transport.TCP,
    options: { host, port },
  });
  await app.listen();
  new Logger('NotificationService').log(`Notification microservice listening on TCP ${host}:${port}`);
}

void bootstrap();

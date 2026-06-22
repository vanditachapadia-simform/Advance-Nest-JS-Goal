import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { UserServiceModule } from './user-service.module';

/** Boots the User microservice over the TCP transport (default port 3001). */
async function bootstrap(): Promise<void> {
  const host = process.env.USER_SERVICE_HOST ?? '0.0.0.0';
  const port = parseInt(process.env.USER_SERVICE_PORT ?? '3001', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
    transport: Transport.TCP,
    options: { host, port },
  });
  await app.listen();
  new Logger('UserService').log(`User microservice listening on TCP ${host}:${port}`);
}

void bootstrap();

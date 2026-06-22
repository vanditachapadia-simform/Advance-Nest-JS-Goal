import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * CONCEPT #11: Platform agnosticism.
 * The bootstrap code never imports anything Express-specific. The HTTP layer is
 * reached through HttpAdapterHost, so switching to Fastify is a one-liner:
 *   - swap @nestjs/platform-express for @nestjs/platform-fastify
 *   - NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())
 * The rest of the app (resolvers, services, guards) is untouched.
 *
 * CONCEPT #9: Lifecycle events.
 * enableShutdownHooks() wires OS signals to OnModuleDestroy / OnApplicationShutdown,
 * so PrismaService.onModuleDestroy() runs on Ctrl-C.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.enableShutdownHooks();

  const adapterHost = app.get(HttpAdapterHost);
  const platformName = adapterHost.httpAdapter.getType(); // "express" | "fastify"

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Running on http://localhost:${port}/graphql (platform: ${platformName})`);
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AppModule } from './app.module';

/**
 * HTTP gateway bootstrap.
 *
 * Platform-agnostic note: we use the Express adapter for first-class support of
 * cookies, sessions, CSRF, Multer and SSE. The app is otherwise framework-neutral
 * — swapping to Fastify means changing this adapter + the few Express-typed
 * middleware imports; controllers/services are untouched.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Route Nest's logger through Winston.
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('Bootstrap');

  // ---- Security middleware ----
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser(config.get<string>('security.cookieSecret')));
  app.use(
    session({
      secret: config.get<string>('security.sessionSecret')!,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: config.get<boolean>('app.isProduction'), maxAge: 3_600_000 },
    }),
  );

  // ---- CORS ----
  app.enableCors({
    origin: config.get<string[]>('security.corsOrigins'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ---- Global prefix + URI versioning (/api/v1/...) ----
  const prefix = config.get<string>('app.globalPrefix') ?? 'api';
  app.setGlobalPrefix(prefix, { exclude: ['health', ''] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.get<string>('app.defaultApiVersion') ?? '1',
  });

  // ---- Graceful shutdown (fires OnModuleDestroy / OnApplicationShutdown hooks) ----
  app.enableShutdownHooks();

  // ---- Swagger / OpenAPI ----
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Logistics & Shipment Management Platform')
    .setDescription('Production-grade NestJS POC — REST + WS + SSE + Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Shipments')
    .addTag('Carriers')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port);
  logger.log(`HTTP gateway running on http://localhost:${port}/${prefix}`);
  logger.log(`Swagger docs available at http://localhost:${port}/docs`);
}

void bootstrap();

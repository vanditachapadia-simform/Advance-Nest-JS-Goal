import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CaslForbiddenExceptionFilter } from './exceptions/casl-forbidden.exception';
import { CsrfGuard } from './common/guards/csrf.guard';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Helmet: secure HTTP headers ──────────────────────────────────────────
  app.use(helmet());

  // ── Cookie parser (required for CSRF double-submit cookie) ───────────────
  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,                 // needed for cookies
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // ── CSRF middleware: sets csrf-token cookie on every response ────────────
  const csrfMiddleware = app.get(CsrfMiddleware);
  app.use(csrfMiddleware.use.bind(csrfMiddleware));

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── Global guards: CSRF ───────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new CsrfGuard(configService, reflector));

  // ── Exception filters ─────────────────────────────────────────────────────
  app.useGlobalFilters(new CaslForbiddenExceptionFilter());

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();

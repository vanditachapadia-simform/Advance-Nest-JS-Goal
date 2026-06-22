import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { JwtAccessGuard } from './common/guards/jwt-access.guard';
import { CustomThrottlerGuard } from './common/guards/throttle.guard';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    // ── Config: loads .env into ConfigService ─────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Rate limiting: max 100 requests per 60 seconds per IP ─────────────
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,   // 60 seconds
        limit: 100,
      },
      {
        name: 'auth',  // tighter limit applied to auth endpoints via @Throttle()
        ttl: 60_000,
        limit: 10,
      },
    ]),

    AuthModule,
    ArticleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    CsrfMiddleware,

    // JWT guard applied globally (PublicRoute decorator bypasses it)
    { provide: APP_GUARD, useClass: JwtAccessGuard },

    // Rate limiting applied globally
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}

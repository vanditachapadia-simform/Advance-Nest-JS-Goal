import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

// Cross-cutting infrastructure
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queues/queue.module';
import { EventsModule } from './events/events.module';
import { TasksModule } from './infrastructure/scheduler/tasks.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthModule } from './modules/health/health.module';
import { SecurityModule } from './modules/security/security.module';
import { MicroserviceClientsModule } from './microservices/clients/microservice-clients.module';

// Global cross-cutting providers
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import {
  CorrelationIdMiddleware,
  RequestIdMiddleware,
  RequestLoggerMiddleware,
} from './common/middleware';
import { NotificationChannel } from './shared/enums';

@Module({
  imports: [
    // ---- Cross-cutting infrastructure (order matters: config + logger first) ----
    AppConfigModule,
    LoggerModule,
    RedisModule,
    DatabaseModule,
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', maxListeners: 20 }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('security.throttleTtlSeconds') ?? 60) * 1000,
            limit: config.get<number>('security.throttleLimit') ?? 100,
          },
        ],
      }),
    }),
    QueueModule,
    EventsModule,
    TasksModule,

    // ---- Dynamic module configured asynchronously from config ----
    NotificationsModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => ({
        defaultChannel: NotificationChannel.IN_APP,
        enabledChannels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.PUSH,
        ],
        dropDisabled: true,
      }),
    }),

    // ---- Feature modules ----
    AuditModule,
    AuthModule,
    UsersModule,
    CarriersModule,
    ShipmentsModule,
    DocumentsModule,
    AnalyticsModule,
    RealtimeModule,
    PluginsModule,
    IntegrationsModule,
    HealthModule,
    SecurityModule,
    MicroserviceClientsModule,
  ],
  controllers: [AppController],
  providers: [
    // ---- Global pipes ----
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    // ---- Global guards: authenticate, then authorize, then rate-limit ----
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ---- Global interceptors (execution order = declaration order) ----
    { provide: APP_INTERCEPTOR, useClass: PerformanceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // ---- Global filters (most-specific last so it wins) ----
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: MongoExceptionFilter },
    { provide: APP_FILTER, useClass: BusinessExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  /** Applies request-tracing middleware globally, in order. */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}

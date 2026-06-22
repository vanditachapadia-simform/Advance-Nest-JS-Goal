import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import {
  NotificationAsyncOptions,
  NotificationOptions,
  NotificationOptionsFactory,
} from './interfaces/notification-options.interface';
import { TOKENS } from '../../shared/constants';

/**
 * DYNAMIC MODULE.
 *
 * Exposes both `register()` (static options) and `registerAsync()` (options
 * resolved from other providers, e.g. ConfigService). The resolved options are
 * provided under `TOKENS.NOTIFICATION_OPTIONS` and injected by the service.
 */
@Global()
@Module({})
export class NotificationsModule {
  private static modelImport = MongooseModule.forFeature([
    { name: Notification.name, schema: NotificationSchema },
  ]);

  /** Synchronous configuration. */
  static register(options: NotificationOptions): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [NotificationsModule.modelImport],
      controllers: [NotificationsController],
      providers: [
        { provide: TOKENS.NOTIFICATION_OPTIONS, useValue: options },
        NotificationsService,
      ],
      exports: [NotificationsService],
    };
  }

  /** Asynchronous configuration (useFactory / useClass / useExisting). */
  static registerAsync(options: NotificationAsyncOptions): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [NotificationsModule.modelImport, ...(options.imports ?? [])],
      controllers: [NotificationsController],
      providers: [...this.createAsyncProviders(options), NotificationsService],
      exports: [NotificationsService],
    };
  }

  private static createAsyncProviders(options: NotificationAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: TOKENS.NOTIFICATION_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    const inject = [(options.useClass ?? options.useExisting) as any];
    const providers: Provider[] = [
      {
        provide: TOKENS.NOTIFICATION_OPTIONS,
        useFactory: (factory: NotificationOptionsFactory) => factory.createNotificationOptions(),
        inject,
      },
    ];
    if (options.useClass) {
      providers.push({ provide: options.useClass, useClass: options.useClass });
    }
    return providers;
  }
}

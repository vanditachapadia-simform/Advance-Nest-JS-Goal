import { ModuleMetadata, Type } from '@nestjs/common';
import { NotificationChannel } from '../../../shared/enums';

/** Options that configure the dynamic NotificationsModule. */
export interface NotificationOptions {
  /** Default channel when a caller does not specify one. */
  defaultChannel: NotificationChannel;
  /** Channels that are switched on for this deployment. */
  enabledChannels: NotificationChannel[];
  /** Drop (don't persist) notifications for disabled channels. */
  dropDisabled?: boolean;
}

/** A class that can asynchronously build NotificationOptions. */
export interface NotificationOptionsFactory {
  createNotificationOptions(): Promise<NotificationOptions> | NotificationOptions;
}

/** Async configuration contract for `registerAsync`. */
export interface NotificationAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<NotificationOptions> | NotificationOptions;
  inject?: any[];
  useClass?: Type<NotificationOptionsFactory>;
  useExisting?: Type<NotificationOptionsFactory>;
}

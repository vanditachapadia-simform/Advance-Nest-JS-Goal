import { Provider } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AppLogger } from './app-logger.service';

/**
 * CONCEPT #1: Custom providers — all four flavours.
 *
 * Below we declare the injection tokens and the matching Provider objects.
 * They are registered in CommonModule.
 */

// --- Tokens ---------------------------------------------------------------
export const APP_INFO = 'APP_INFO'; // useValue
export const FEATURE_FLAGS = 'FEATURE_FLAGS'; // useFactory
export const LEGACY_LOGGER = 'LEGACY_LOGGER'; // useExisting (alias)
export const CLOCK = 'CLOCK'; // useClass

export interface AppInfo {
  name: string;
  version: string;
}

export interface FeatureFlags {
  requestLogging: boolean;
  reportsEnabled: boolean;
}

export interface Clock {
  now(): number;
}

// useClass target: a swappable implementation behind the CLOCK token.
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

// --- Provider definitions -------------------------------------------------

// useValue: a plain constant object injected as-is.
export const appInfoProvider: Provider = {
  provide: APP_INFO,
  useValue: { name: 'nest-shop-fundamentals', version: '1.0.0' } as AppInfo,
};

// useFactory: computed at startup from another provider (ConfigService).
export const featureFlagsProvider: Provider = {
  provide: FEATURE_FLAGS,
  useFactory: (config: ConfigService): FeatureFlags => ({
    requestLogging: config.getBoolean('ENABLE_REQUEST_LOGGING', true),
    reportsEnabled: true,
  }),
  inject: [ConfigService],
};

// useClass: bind a token to a concrete class; swap SystemClock for a fake in tests.
export const clockProvider: Provider = {
  provide: CLOCK,
  useClass: SystemClock,
};

// useExisting: LEGACY_LOGGER is an alias that resolves to the same AppLogger instance.
export const legacyLoggerProvider: Provider = {
  provide: LEGACY_LOGGER,
  useExisting: AppLogger,
};

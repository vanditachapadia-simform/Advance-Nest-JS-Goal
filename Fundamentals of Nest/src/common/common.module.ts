import { Global, Module } from '@nestjs/common';
import { AppLogger } from './providers/app-logger.service';
import { RequestContextService } from './providers/request-context.service';
import {
  appInfoProvider,
  clockProvider,
  featureFlagsProvider,
  legacyLoggerProvider,
} from './providers/tokens';

/**
 * CONCEPT #1 & #4 hub.
 *
 * CommonModule registers the four custom-provider flavours plus the scoped
 * providers, and exports them globally so every feature module can inject them.
 */
@Global()
@Module({
  providers: [
    AppLogger, // TRANSIENT (scope set on the class)
    RequestContextService, // REQUEST (scope set on the class)
    appInfoProvider, // useValue
    featureFlagsProvider, // useFactory
    clockProvider, // useClass
    legacyLoggerProvider, // useExisting
  ],
  exports: [
    AppLogger,
    RequestContextService,
    appInfoProvider,
    featureFlagsProvider,
    clockProvider,
    legacyLoggerProvider,
  ],
})
export class CommonModule {}

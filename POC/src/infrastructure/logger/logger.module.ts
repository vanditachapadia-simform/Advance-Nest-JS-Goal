import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { buildWinstonOptions } from './winston.config';

/**
 * Global logging module. Configures `nest-winston` asynchronously so the log
 * level/format adapts to NODE_ENV. Re-exports `WinstonModule` so the
 * `WINSTON_MODULE_PROVIDER` token is injectable across the app (filters,
 * interceptors, middleware all depend on it).
 */
@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildWinstonOptions(config.get<boolean>('app.isProduction') ?? false),
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}

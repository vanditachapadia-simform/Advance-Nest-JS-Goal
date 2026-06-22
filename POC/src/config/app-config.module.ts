import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configFactories } from './configuration';
import { validateEnv } from './env.validation';

/**
 * Global configuration module.
 *
 * `@Global()` means every other module can inject `ConfigService` (or any of the
 * namespaced config objects) without re-importing this module. We register all
 * namespaced factories and run boot-time env validation.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: configFactories,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
  ],
})
export class AppConfigModule {}

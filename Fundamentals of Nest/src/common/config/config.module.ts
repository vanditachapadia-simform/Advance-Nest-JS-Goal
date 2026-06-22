import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import {
  AppConfigOptions,
  CONFIG_OPTIONS,
  FeatureConfigOptions,
} from './config.constants';
import { ConfigService } from './config.service';

/**
 * CONCEPT #3: Dynamic modules.
 *
 * A static @Module() can't be parameterised. ConfigModule exposes static
 * factory methods that RETURN a DynamicModule descriptor at runtime:
 *
 *  - forRoot(options)    -> configures the global ConfigService once.
 *  - forFeature(options) -> registers a scoped, namespaced feature config token.
 *
 * This is the same forRoot/forFeature pattern used by @nestjs/config, TypeOrmModule, etc.
 */
@Global()
@Module({})
export class ConfigModule {
  static forRoot(options: AppConfigOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: CONFIG_OPTIONS,
      useValue: options,
    };

    return {
      module: ConfigModule,
      providers: [optionsProvider, ConfigService],
      exports: [ConfigService],
    };
  }

  static forFeature(options: FeatureConfigOptions): DynamicModule {
    const token = `CONFIG_FEATURE_${options.namespace}`;
    const featureProvider: Provider = {
      provide: token,
      // useFactory pulls the already-configured ConfigService and slices a namespace out.
      useFactory: (config: ConfigService) => config.getFeature(options.namespace),
      inject: [ConfigService],
    };

    return {
      module: ConfigModule,
      providers: [featureProvider],
      exports: [featureProvider],
    };
  }
}

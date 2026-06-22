import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TOKENS } from '../../shared/constants';
import { RedisService } from './redis.service';

/**
 * Global Redis module.
 *
 * Demonstrates an ASYNC CUSTOM PROVIDER: `useFactory` builds the ioredis client
 * from runtime config and `inject` supplies its dependencies. `@Global()` makes
 * `RedisService` injectable everywhere without re-importing.
 */
@Global()
@Module({
  providers: [
    {
      provide: TOKENS.REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          maxRetriesPerRequest: null, // required by BullMQ-compatible clients
          lazyConnect: false,
        });
      },
    },
    RedisService,
  ],
  exports: [TOKENS.REDIS_CLIENT, RedisService],
})
export class RedisModule {}

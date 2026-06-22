import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import IORedis, { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

/**
 * Provides a single shared Redis client across the app.
 *
 * - If REDIS_URL is set, connects to a real Redis instance (ioredis).
 * - Otherwise falls back to an in-memory ioredis-mock, so the demo runs
 *   with zero external setup. Swapping to real Redis is a one-line .env change.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('RedisModule');
        const url = config.get<string>('REDIS_URL');

        if (url) {
          logger.log(`Redis: connecting to real instance at ${url}`);
          return new IORedis(url);
        }

        logger.log('Redis: in-memory mock (set REDIS_URL to use a real Redis)');
        // RedisMock implements the same interface as ioredis for our usage.
        return new RedisMock() as unknown as Redis;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

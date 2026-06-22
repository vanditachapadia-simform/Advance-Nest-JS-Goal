import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TOKENS } from '../../shared/constants';

/**
 * Thin, JSON-aware wrapper around the raw ioredis client.
 *
 * Implements `OnModuleDestroy` (a LIFECYCLE HOOK) to close the connection
 * gracefully on shutdown. The underlying client is supplied by an ASYNC
 * CUSTOM PROVIDER (see redis.module.ts).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly defaultTtl: number;

  constructor(
    @Inject(TOKENS.REDIS_CLIENT) private readonly client: Redis,
    config: ConfigService,
  ) {
    this.defaultTtl = config.get<number>('redis.cacheTtlSeconds') ?? 60;
  }

  /** Raw client access for advanced use (pub/sub, pipelines). */
  getClient(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.set(key, payload, 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Invalidate every key matching a glob pattern (e.g. `shipment:*`). */
  async delByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection');
    await this.client.quit();
  }
}

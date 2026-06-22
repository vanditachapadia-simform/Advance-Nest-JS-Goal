import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Thin, typed wrapper over the Redis client exposing only the operations
 * this demo needs: SET (with optional TTL), GET, INCR, EXPIRE, TTL, EXISTS.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /** SET key value [EX ttlSeconds] */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /** GET key — returns null if missing/expired */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** INCR key — returns the value after incrementing */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /** EXPIRE key ttlSeconds */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /**
   * TTL key — remaining lifetime in seconds.
   * Returns -2 if the key does not exist, -1 if it has no expiry.
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** EXISTS key */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

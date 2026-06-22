/**
 * Injection token for the underlying Redis client (ioredis or ioredis-mock).
 * Consumers should depend on RedisService rather than this token directly.
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'custom_cache_key';
export const CACHE_TTL_METADATA = 'custom_cache_ttl';

/**
 * Declares a cache key prefix + TTL (seconds) for the custom `HttpCacheInterceptor`.
 * The interceptor appends request-specific suffixes (params/query) to the prefix.
 *
 * @example  @Cacheable('shipment', 120)
 */
export const Cacheable = (keyPrefix: string, ttlSeconds?: number) => {
  return (target: object, key?: any, descriptor?: any) => {
    SetMetadata(CACHE_KEY_METADATA, keyPrefix)(target, key, descriptor);
    if (ttlSeconds !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttlSeconds)(target, key, descriptor);
    }
    return descriptor ?? target;
  };
};

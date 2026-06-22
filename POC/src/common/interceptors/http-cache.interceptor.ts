import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * Read-through cache for GET handlers annotated with `@Cacheable(prefix, ttl)`.
 *
 * On a cache hit, the cached value is returned immediately and the handler is
 * never invoked. On a miss, the handler runs and the result is stored under a
 * key composed of `<prefix>:<url>` so distinct params/query produce distinct
 * entries. Only GET requests are cached.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const prefix = this.reflector.getAllAndOverride<string>(CACHE_KEY_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    if (!prefix || request?.method !== 'GET') {
      return next.handle();
    }

    const ttl =
      this.reflector.getAllAndOverride<number>(CACHE_TTL_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? undefined;

    const cacheKey = `${prefix}:${request.url}`;
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((response) => {
        void this.redis.set(cacheKey, response, ttl);
      }),
    );
  }
}

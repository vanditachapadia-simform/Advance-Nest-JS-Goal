import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RedisService } from '../redis/redis.service';

/**
 * Per-IP fixed-window rate limiter backed by Redis.
 *
 * Demonstrates INCR + EXPIRE: the first request in a window creates the
 * counter and sets its expiry; subsequent requests increment it. Once the
 * window expires the key is removed and the count resets to zero.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.max = Number(this.config.get('RATE_LIMIT_MAX')) || 5;
    this.windowSeconds = Number(this.config.get('RATE_LIMIT_WINDOW_SECONDS')) || 60;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      // First hit in this window — start the expiry countdown.
      await this.redis.expire(key, this.windowSeconds);
    }

    if (count > this.max) {
      throw new HttpException(
        `Rate limit exceeded: max ${this.max} requests per ${this.windowSeconds}s`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}

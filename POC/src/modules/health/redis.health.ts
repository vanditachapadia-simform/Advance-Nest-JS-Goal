import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * Custom Terminus health indicator that PINGs Redis. Demonstrates extending
 * `HealthIndicator` for a dependency Terminus doesn't ship out of the box.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.getClient().ping();
      const isHealthy = pong === 'PONG';
      const result = this.getStatus(key, isHealthy, { response: pong });
      if (isHealthy) return result;
      throw new HealthCheckError('Redis ping failed', result);
    } catch (err) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: (err as Error).message }),
      );
    }
  }
}

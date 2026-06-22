import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * Measures handler execution time and logs anything slow (> 1s) as a warning.
 * Demonstrates the "performance logging" requirement and the use of
 * `process.hrtime.bigint()` for high-resolution timing.
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly slowThresholdMs = 1000;

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = process.hrtime.bigint();
    const req = context.switchToHttp().getRequest();
    const label = `${req?.method ?? context.getType()} ${req?.url ?? context.getClass().name}`;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const meta = { durationMs: Math.round(durationMs), correlationId: req?.correlationId };
        if (durationMs > this.slowThresholdMs) {
          this.logger.warn(`SLOW ${label} took ${meta.durationMs}ms`, meta);
        } else {
          this.logger.debug?.(`${label} took ${meta.durationMs}ms`, meta);
        }
      }),
    );
  }
}

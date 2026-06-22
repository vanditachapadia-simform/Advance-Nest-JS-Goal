import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';

/**
 * Writes an audit-trail entry for any handler decorated with `@Audit(...)`,
 * *after* it succeeds. The actual persistence is offloaded so the request is
 * never blocked by audit I/O.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    return next.handle().pipe(
      tap((result) => {
        // Fire-and-forget; never let audit failures break the response.
        void this.auditService.record({
          userId: user?.userId ?? null,
          action: meta.action,
          entity: meta.entity,
          entityId: result?.id ?? request?.params?.id ?? null,
          ip: request?.ip,
          correlationId: request?.correlationId,
          metadata: { method: request?.method, path: request?.url },
        });
      }),
    );
  }
}

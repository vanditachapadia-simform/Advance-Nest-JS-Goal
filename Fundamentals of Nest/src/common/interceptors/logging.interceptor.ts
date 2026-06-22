import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * CONCEPT #8: Execution context (interceptor variant).
 *
 * Interceptors also operate on an ExecutionContext. We use GqlExecutionContext
 * to read the GraphQL info (field name) and log timing around each operation.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo();
    const field = info?.fieldName ?? context.getHandler().name;
    const startedAt = Date.now();

    return next
      .handle()
      .pipe(tap(() => this.logger.log(`${field} took ${Date.now() - startedAt}ms`)));
  }
}

import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

/**
 * CONCEPT #4: Injection scopes (REQUEST).
 *
 * A REQUEST-scoped provider gets one instance per incoming request. Here it
 * carries the "current user" (resolved from the x-user-id header) and a
 * correlation id, so any service in the request chain sees the same context.
 *
 * Because GraphQL drives requests, we inject the GraphQL CONTEXT (which holds
 * the underlying { req }) rather than @Inject(REQUEST).
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private readonly correlationIdValue: string;
  readonly userId: number;
  readonly role: string;

  constructor(@Inject(CONTEXT) gqlContext: { req?: any }) {
    const req = gqlContext?.req ?? {};
    const headers = req.headers ?? {};
    this.userId = Number(headers['x-user-id'] ?? 1);
    this.role = String(headers['x-user-role'] ?? 'customer');
    // No Math.random in this env; derive a stable-ish id from headers + url.
    this.correlationIdValue =
      String(headers['x-correlation-id'] ?? `req-${this.userId}-${req.url ?? 'gql'}`);
  }

  get correlationId(): string {
    return this.correlationIdValue;
  }
}

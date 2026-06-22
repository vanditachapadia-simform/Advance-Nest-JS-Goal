import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * CONCEPT #8: Execution context.
 *
 * A guard receives a transport-agnostic ExecutionContext. For GraphQL we adapt
 * it with GqlExecutionContext.create(context) to reach the underlying request.
 * The very same guard would work over HTTP/WS by switching the adapter — that
 * is the point of the execution-context abstraction.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles metadata -> public field.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const role = String(req?.headers?.['x-user-role'] ?? 'customer');

    const allowed = requiredRoles.includes(role);
    this.logger.log(
      `Guard on ${context.getClass().name}#${context.getHandler().name}: ` +
        `needs [${requiredRoles}], caller role "${role}" -> ${allowed ? 'ALLOW' : 'DENY'}`,
    );
    return allowed;
  }
}

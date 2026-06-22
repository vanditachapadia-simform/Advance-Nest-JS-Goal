import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../shared/enums';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * RBAC guard. Reads roles declared via `@Roles(...)` and grants access if the
 * authenticated user holds *any* of them. Routes without `@Roles` are allowed
 * (authentication is still enforced upstream by `JwtAuthGuard`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasRole = user.roles?.some((role) => requiredRoles.includes(role as Role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires one of: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Attaches required roles as metadata on a resolver/handler.
 * Read back by RolesGuard via the Reflector. Example: @Roles('admin').
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

import { SetMetadata } from '@nestjs/common';
import { Role } from '../../shared/enums';

export const ROLES_KEY = 'roles';

/**
 * Attaches required roles as route metadata, read by `RolesGuard`.
 *
 * @example
 *   @Roles(Role.ADMIN, Role.MANAGER)
 *   @Get('reports')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

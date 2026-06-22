/**
 * RBAC roles. Ordered loosely from most to least privileged.
 * Used by the `@Roles()` decorator and `RolesGuard`.
 */
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DISPATCHER = 'DISPATCHER',
  CARRIER = 'CARRIER',
  USER = 'USER',
}

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../shared/enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const makeContext = (user?: { roles: string[] }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => null,
      getClass: () => null,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ roles: [Role.USER] }))).toBe(true);
  });

  it('allows access when the user holds a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.MANAGER]);
    expect(guard.canActivate(makeContext({ roles: [Role.MANAGER] }))).toBe(true);
  });

  it('denies access when the user lacks all required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(makeContext({ roles: [Role.USER] }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies access when unauthenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});

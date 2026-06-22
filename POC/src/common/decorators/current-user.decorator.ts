import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Extracts the authenticated user (populated by `JwtStrategy`) from the request.
 * Works across HTTP and WS execution contexts via `switchToHttp`.
 *
 * @example  findMine(@CurrentUser() user: AuthenticatedUser) {}
 * @example  myId(@CurrentUser('userId') id: string) {}
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);

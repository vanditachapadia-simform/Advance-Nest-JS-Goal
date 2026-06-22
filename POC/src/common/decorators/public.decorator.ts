import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public, bypassing the globally-registered `JwtAuthGuard`.
 * Use on login/register/health endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

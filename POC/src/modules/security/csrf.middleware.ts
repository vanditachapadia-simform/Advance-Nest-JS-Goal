import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * CSRF protection via the double-submit-cookie pattern.
 *
 *  - Safe methods (GET/HEAD/OPTIONS): mint a random token, set it as a readable
 *    cookie (`XSRF-TOKEN`). The SPA reads it and echoes it on writes.
 *  - Unsafe methods: require the `x-csrf-token` header to match the cookie.
 *
 * Comparison is constant-time to avoid timing oracles. This guards cookie-auth
 * web forms; pure Bearer-token API calls are not CSRF-able and can opt out.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

  use(req: Request, res: Response, next: NextFunction): void {
    if (this.SAFE.has(req.method)) {
      const token = randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', token, { sameSite: 'strict', secure: false, httpOnly: false });
      return next();
    }

    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'] as string | undefined;
    if (!cookieToken || !headerToken || !this.safeEqual(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    next();
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_CSRF_KEY } from '../decorator/skip-csrf.decorator';
import { CsrfMiddleware } from '../middleware/csrf.middleware';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.includes(req.method)) return true;

    const cookieToken = req.cookies?.['csrf-token'] as string | undefined;
    const headerToken = req.headers['x-csrf-token'] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const secret = this.configService.get<string>('CSRF_SECRET', 'csrf-secret');
    if (!CsrfMiddleware.validateToken(cookieToken, secret)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}

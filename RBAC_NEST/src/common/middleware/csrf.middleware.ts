import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies['csrf-token']) {
      const token = this.generateToken();
      res.cookie('csrf-token', token, {
        httpOnly: false, // must be readable by JS to send in header
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    next();
  }

  private generateToken(): string {
    const secret = this.configService.get<string>('CSRF_SECRET', 'csrf-secret');
    const random = randomBytes(16).toString('hex');
    const hmac = createHmac('sha256', secret).update(random).digest('hex');
    return `${random}.${hmac}`;
  }

  static validateToken(token: string, secret: string): boolean {
    const [random, hmac] = token.split('.');
    if (!random || !hmac) return false;
    const expected = createHmac('sha256', secret).update(random).digest('hex');
    return hmac === expected;
  }
}

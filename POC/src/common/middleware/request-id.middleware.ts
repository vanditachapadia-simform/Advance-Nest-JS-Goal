import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    correlationId?: string;
  }
}

/**
 * Assigns a unique id to every request and echoes it back via `X-Request-Id`.
 * Distinct from correlation id: requestId identifies *this* hop; correlationId
 * follows a logical transaction across services.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}

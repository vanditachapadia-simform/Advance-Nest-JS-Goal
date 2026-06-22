import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware to add a unique request ID to each request
 * Useful for tracking requests across logs
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    this.logger.debug(`Request ID ${requestId} assigned to ${req.method} ${req.url}`);

    next();
  }
}

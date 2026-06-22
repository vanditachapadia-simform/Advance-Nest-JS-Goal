import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * Structured request/response logging. Logs the inbound request and, on
 * `res.finish`, the status code + duration. Correlation id ties the two lines
 * (and downstream logs) together.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      this.logger.info(`${method} ${originalUrl} ${res.statusCode} ${durationMs}ms`, {
        context: 'HTTP',
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        durationMs,
        correlationId: req.correlationId,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * Global catch-all filter — the last line of defence.
 *
 * Registered with the lowest priority (declared first in main.ts) so that more
 * specific filters (Business, Mongo) handle their cases first. Uses the
 * `HttpAdapterHost` so it is platform-agnostic (works on Express *and* Fastify).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly fallbackLogger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const correlationId = request?.correlationId ?? request?.headers?.['x-correlation-id'];

    const responseBody = {
      success: false,
      statusCode: httpStatus,
      path: httpAdapter.getRequestUrl(request),
      method: httpAdapter.getRequestMethod(request),
      correlationId,
      timestamp: new Date().toISOString(),
      error: typeof message === 'string' ? { message } : message,
    };

    // Log 5xx as errors (with stack), 4xx as warnings.
    const logPayload = {
      correlationId,
      statusCode: httpStatus,
      path: responseBody.path,
      stack: exception instanceof Error ? exception.stack : undefined,
    };
    if (httpStatus >= 500) {
      this.logger.error(`Unhandled exception: ${String(message)}`, logPayload);
    } else {
      this.logger.warn(`Handled exception: ${JSON.stringify(message)}`, logPayload);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

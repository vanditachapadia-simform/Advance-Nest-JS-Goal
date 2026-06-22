import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';

/**
 * Renders `BusinessException`s in a consistent envelope that surfaces the
 * machine-readable `code` so clients can branch on it programmatically.
 */
@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      success: false,
      statusCode: status,
      error: {
        code: exception.code,
        message: exception.message,
      },
      correlationId: request?.correlationId,
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}

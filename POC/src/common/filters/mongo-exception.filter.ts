import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';

/**
 * Translates raw Mongo/Mongoose errors into clean HTTP responses so internal
 * driver details never leak to clients.
 *
 *   - Duplicate key (11000)        -> 409 Conflict
 *   - Mongoose ValidationError     -> 422 Unprocessable Entity
 *   - Mongoose CastError           -> 400 Bad Request
 */
@Catch(MongoServerError, MongooseError.ValidationError, MongooseError.CastError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(
    exception: MongoServerError | MongooseError.ValidationError | MongooseError.CastError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'DATABASE_ERROR';
    let message = 'A database error occurred';

    if (exception instanceof MongoServerError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_KEY';
      const field = Object.keys(exception.keyValue ?? {}).join(', ');
      message = `Duplicate value for unique field(s): ${field}`;
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = 'VALIDATION_ERROR';
      message = Object.values(exception.errors)
        .map((e) => e.message)
        .join('; ');
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_IDENTIFIER';
      message = `Invalid value "${exception.value}" for field "${exception.path}"`;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: { code, message },
      correlationId: request?.correlationId,
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}

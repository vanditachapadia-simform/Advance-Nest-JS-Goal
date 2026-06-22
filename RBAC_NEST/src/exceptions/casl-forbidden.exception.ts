import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ForbiddenError } from '@casl/ability';

@Catch(ForbiddenError)
export class CaslForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(403).json({
      statusCode: 403,
      message: exception.message || 'Forbidden',
    });
  }
}

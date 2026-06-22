import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  correlationId?: string;
  timestamp: string;
}

export const SKIP_TRANSFORM = 'skipTransform';
/** Opt a handler out of envelope wrapping (e.g. SSE, file streams). */
export const SkipTransform = () => Reflector.createDecorator<boolean>({ key: SKIP_TRANSFORM });

/**
 * Wraps every successful response in a consistent envelope. Skips streaming
 * responses (`StreamableFile`) and handlers annotated to opt out, so SSE and
 * file downloads pass through untouched.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM, [
      context.getHandler(),
      context.getClass(),
    ]);

    const http = context.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest();

    return next.handle().pipe(
      map((data) => {
        if (skip || data instanceof StreamableFile) {
          return data;
        }
        return {
          success: true as const,
          statusCode: response.statusCode,
          data,
          correlationId: request?.correlationId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

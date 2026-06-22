import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract client IP address from request
 * Usage: @IpAddress() ip: string
 */
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress
    );
  },
);

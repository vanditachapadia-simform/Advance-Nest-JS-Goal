import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // throttle per IP; falls back to user id when behind a proxy
    return req.ips?.length ? req.ips[0] : req.ip;
  }

  protected errorMessage = 'Too many requests. Please try again later.';
}

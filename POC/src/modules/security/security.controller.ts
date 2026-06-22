import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Demonstrates CSRF double-submit. `GET /security/csrf-token` issues a token
 * (the CsrfMiddleware sets the cookie); `POST /security/echo` is protected and
 * succeeds only when the header token matches the cookie.
 */
@ApiTags('Security')
@Controller({ path: 'security', version: '1' })
export class SecurityController {
  @Public()
  @Get('csrf-token')
  @ApiOperation({ summary: 'Obtain a CSRF token (also set as XSRF-TOKEN cookie)' })
  csrfToken(@Req() req: Request) {
    return { csrfToken: req.cookies?.['XSRF-TOKEN'] ?? null };
  }

  @Public()
  @Post('echo')
  @ApiOperation({ summary: 'CSRF-protected endpoint (requires x-csrf-token header)' })
  echo(@Body() body: unknown) {
    return { ok: true, received: body };
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  // Per-endpoint rate limit: 5 attempts / minute to thwart credential stuffing.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email + password (5 req/min)' })
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(req.user as UserDocument);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept the refresh token from the body or the httpOnly cookie.
    const token = dto.refreshToken || (req.cookies?.refresh_token as string);
    const tokens = await this.authService.refresh(token);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out (revokes the refresh token)' })
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.userId);
    res.clearCookie('refresh_token');
  }

  /** Sets the refresh token as a secure, httpOnly cookie (defence in depth). */
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api',
    });
  }
}

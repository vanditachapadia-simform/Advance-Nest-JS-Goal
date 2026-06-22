import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { Role } from '../../shared/enums';
import { UserDocument } from '../users/schemas/user.schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Used by LocalStrategy — returns the user if credentials are valid. */
  async validateCredentials(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmailWithPassword(email.toLowerCase());
    if (!user) return null;
    const matches = await bcrypt.compare(password, user.password);
    return matches ? user : null;
  }

  async register(dto: RegisterDto): Promise<AuthTokens & { user: { id: string; email: string } }> {
    // Self-registration always gets the base USER role.
    const user = (await this.usersService.create({
      ...dto,
      roles: [Role.USER],
    })) as UserDocument;
    const tokens = await this.issueTokens(user);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshToken);
    return { ...tokens, user: { id: user.id, email: user.email } };
  }

  async login(user: UserDocument): Promise<AuthTokens> {
    const tokens = await this.issueTokens(user);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshToken);
    await this.usersService.recordLogin(user.id);
    this.logger.log(`User logged in: ${user.email}`);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
    this.logger.log(`User logged out: ${userId}`);
  }

  /** Verifies the refresh token, checks it against the stored hash, rotates it. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session not found, please log in again');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      // Token reuse / theft detection — revoke the session.
      await this.usersService.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Refresh token mismatch, session revoked');
    }

    const tokens = await this.issueTokens(user);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, roles: user.roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn') as string,
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as string,
      } as JwtSignOptions),
    ]);
    return { accessToken, refreshToken };
  }
}

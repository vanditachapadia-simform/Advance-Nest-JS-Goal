import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

/**
 * Authenticates a WebSocket connection by validating the JWT supplied in the
 * socket handshake (`auth.token` or `Authorization` header). On success the
 * decoded user is attached to `socket.data.user`.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);
      if (!token) {
        return false;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.user = { userId: payload.sub, email: payload.email, roles: payload.roles };
      return true;
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      return false;
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake?.auth?.token || client.handshake?.headers?.authorization;
    if (!auth) return undefined;
    return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  }
}

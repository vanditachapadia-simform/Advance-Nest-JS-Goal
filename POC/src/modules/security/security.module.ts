import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { CsrfMiddleware } from './csrf.middleware';

/**
 * Scopes CSRF protection to its own route group so it demonstrates the pattern
 * without interfering with the Bearer-authenticated JSON API.
 */
@Module({
  controllers: [SecurityController],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes(SecurityController);
  }
}

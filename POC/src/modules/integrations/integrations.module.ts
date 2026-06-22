import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalApiService } from './external-api.service';
import { IntegrationsController } from './integrations.controller';

/**
 * Integrations module. `HttpModule.registerAsync` configures axios defaults
 * (timeout, redirects) from config; per-call retry lives in the service.
 */
@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('http.timeoutMs') ?? 8000,
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [IntegrationsController],
  providers: [ExternalApiService],
  exports: [ExternalApiService],
})
export class IntegrationsModule {}

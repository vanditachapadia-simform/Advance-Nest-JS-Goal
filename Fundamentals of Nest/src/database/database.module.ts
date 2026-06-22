import { Global, Module } from '@nestjs/common';
import { catalogReadyProvider, CATALOG_READY } from './database.providers';

// Exposes the async CATALOG_READY readiness token application-wide.
@Global()
@Module({
  providers: [catalogReadyProvider],
  exports: [CATALOG_READY],
})
export class DatabaseModule {}

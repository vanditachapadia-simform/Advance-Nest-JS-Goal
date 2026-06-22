import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';

/**
 * CONCEPT #7: Lazy-loading modules.
 *
 * This module is deliberately NOT imported anywhere in the eager module graph.
 * It is instantiated on demand by ReportsResolver via LazyModuleLoader, so its
 * provider (ReportingService) only spins up when a report is first requested.
 * It can still inject the @Global PrismaService.
 */
@Module({
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}

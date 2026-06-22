import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';

/**
 * LAZY-LOADED MODULE — deliberately NOT imported by AppModule. It is registered
 * at runtime through `LazyModuleLoader.load(() => import('./reports.module'))`,
 * so its providers stay out of the startup graph until actually used.
 */
@Module({
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

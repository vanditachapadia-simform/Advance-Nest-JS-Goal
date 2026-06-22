import { Injectable, Logger } from '@nestjs/common';

/**
 * Intentionally "heavy" service that is only instantiated when first needed —
 * loaded on demand via `LazyModuleLoader` (see AnalyticsService). Keeps the
 * cold-start lean for the common request paths that never generate reports.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  generate(type: string): { type: string; rows: number; generatedAt: string } {
    this.logger.log(`Lazily generating "${type}" report`);
    return { type, rows: 1000, generatedAt: new Date().toISOString() };
  }
}

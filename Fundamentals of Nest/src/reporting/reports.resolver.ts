import { Logger, UseGuards } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { Query, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SalesReport } from './models/sales-report.model';

/**
 * CONCEPT #7: Lazy-loading modules (consumer side).
 * CONCEPT #8: Execution context (the @Roles/RolesGuard combo).
 *
 * This resolver is eagerly registered (so the field is in the schema), but the
 * heavy ReportingModule is only loaded the first time salesReport runs.
 */
@Resolver(() => SalesReport)
export class ReportsResolver {
  private readonly logger = new Logger(ReportsResolver.name);

  constructor(private readonly lazyModuleLoader: LazyModuleLoader) {}

  @Roles('admin') // requires header x-user-role: admin
  @UseGuards(RolesGuard)
  @Query(() => SalesReport, { description: 'Admin-only sales report (loads a lazy module).' })
  async salesReport(): Promise<SalesReport> {
    this.logger.log('Lazily loading ReportingModule…');
    const { ReportingModule } = await import('./reporting.module');
    const moduleRef = await this.lazyModuleLoader.load(() => ReportingModule);

    const { ReportingService } = await import('./reporting.service');
    const service = moduleRef.get(ReportingService, { strict: false });
    return service.generateSalesReport();
  }
}

import { Module, Scope } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { DiscountRegistryService } from './discount-registry.service';
import { PricingService } from './pricing.service';
import { PercentageOffRule } from './rules/percentage-off.rule';
import { BulkRule } from './rules/bulk.rule';

/**
 * DiscoveryModule must be imported to inject DiscoveryService (CONCEPT #10).
 * BulkRule is registered as TRANSIENT so PricingService exercises
 * ModuleRef.resolve() (CONCEPT #6); PercentageOffRule stays a singleton.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [
    DiscountRegistryService,
    PricingService,
    PercentageOffRule,
    { provide: BulkRule, useClass: BulkRule, scope: Scope.TRANSIENT },
  ],
  exports: [PricingService, DiscountRegistryService],
})
export class DiscountsModule {}

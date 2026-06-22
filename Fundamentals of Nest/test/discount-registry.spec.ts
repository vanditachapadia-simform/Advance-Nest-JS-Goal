import { Scope } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DiscountRegistryService } from '../src/discounts/discount-registry.service';
import { PercentageOffRule } from '../src/discounts/rules/percentage-off.rule';
import { BulkRule } from '../src/discounts/rules/bulk.rule';

/**
 * CONCEPT #12: Testing (Nest TestingModule) + CONCEPT #10: Discovery service.
 *
 * Build a minimal module containing the rules and let DiscountRegistryService
 * discover them via metadata — asserting both rules are found and their scope
 * is correctly classified.
 */
describe('DiscountRegistryService (discovery)', () => {
  it('discovers all @DiscountRuleProvider rules and their scope', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        DiscountRegistryService,
        PercentageOffRule,
        { provide: BulkRule, useClass: BulkRule, scope: Scope.TRANSIENT },
      ],
    }).compile();

    const registry = moduleRef.get(DiscountRegistryService);
    registry.onApplicationBootstrap();

    const rules = registry.getRules();
    const names = rules.map((r) => r.ruleClass.name).sort();
    expect(names).toEqual(['BulkRule', 'PercentageOffRule']);

    const bulk = rules.find((r) => r.ruleClass.name === 'BulkRule');
    const pct = rules.find((r) => r.ruleClass.name === 'PercentageOffRule');
    expect(bulk?.isStatic).toBe(false); // transient
    expect(pct?.isStatic).toBe(true); // singleton
  });
});

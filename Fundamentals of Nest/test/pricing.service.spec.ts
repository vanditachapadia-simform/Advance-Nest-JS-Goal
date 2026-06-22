import { PricingService } from '../src/discounts/pricing.service';
import { PercentageOffRule } from '../src/discounts/rules/percentage-off.rule';
import { BulkRule } from '../src/discounts/rules/bulk.rule';
import { CartLine } from '../src/discounts/discount.interface';

/**
 * CONCEPT #12: Testing (unit).
 *
 * PricingService depends on ModuleRef + the registry. We hand it lightweight
 * fakes: the registry lists both rules, ModuleRef.get returns singletons and
 * ModuleRef.resolve returns scoped instances — mirroring the real wiring.
 */
describe('PricingService', () => {
  const registry = {
    getRules: () => [
      { ruleClass: PercentageOffRule, isStatic: true },
      { ruleClass: BulkRule, isStatic: false },
    ],
  };
  const moduleRef = {
    get: (cls: any) => new cls(),
    resolve: async (cls: any) => new cls(),
  };
  const service = new PricingService(moduleRef as any, registry as any);

  it('applies no discount on a small cart', async () => {
    const lines: CartLine[] = [{ productId: 1, qty: 1, priceCents: 4500 }];
    const result = await service.priceCart(lines);
    expect(result.totalCents).toBe(4500);
    expect(result.appliedDiscounts).toEqual([]);
  });

  it('applies the 10%-off rule over $200', async () => {
    const lines: CartLine[] = [{ productId: 3, qty: 1, priceCents: 32000 }];
    const result = await service.priceCart(lines);
    // 32000 - 10% = 28800
    expect(result.totalCents).toBe(28800);
    expect(result.appliedDiscounts).toContain('10% off orders over $200');
  });

  it('stacks the bulk rule (resolved via ModuleRef.resolve)', async () => {
    const lines: CartLine[] = [{ productId: 5, qty: 6, priceCents: 3500 }];
    // subtotal 21000 -> 10% off (2100) + $5 bulk (500) = 18400
    const result = await service.priceCart(lines);
    expect(result.totalCents).toBe(18400);
    expect(result.appliedDiscounts).toHaveLength(2);
  });
});

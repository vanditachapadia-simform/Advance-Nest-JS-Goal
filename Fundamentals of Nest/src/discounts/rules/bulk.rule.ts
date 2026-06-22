import { DiscountRuleProvider } from '../discount.decorator';
import { CartLine, DiscountResult, DiscountRule } from '../discount.interface';

/**
 * Registered as TRANSIENT in DiscountsModule (see the provider entry with
 * `scope: Scope.TRANSIENT`). Because it is not a singleton, PricingService must
 * obtain it with ModuleRef.resolve() rather than ModuleRef.get() — exactly the
 * distinction we want to demonstrate (CONCEPT #6).
 */
@DiscountRuleProvider()
export class BulkRule implements DiscountRule {
  readonly label = '$5 off each line with 5+ units';

  evaluate(lines: CartLine[]): DiscountResult | null {
    const bulkLines = lines.filter((l) => l.qty >= 5).length;
    if (bulkLines === 0) return null;
    return { label: this.label, discountCents: bulkLines * 500 };
  }
}

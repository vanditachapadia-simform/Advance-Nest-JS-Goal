import { DiscountRuleProvider } from '../discount.decorator';
import { CartLine, DiscountResult, DiscountRule } from '../discount.interface';

// DEFAULT (singleton) scope -> PricingService resolves it via ModuleRef.get().
@DiscountRuleProvider()
export class PercentageOffRule implements DiscountRule {
  readonly label = '10% off orders over $200';

  evaluate(lines: CartLine[]): DiscountResult | null {
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.priceCents, 0);
    if (subtotal <= 20000) return null;
    return { label: this.label, discountCents: Math.round(subtotal * 0.1) };
  }
}

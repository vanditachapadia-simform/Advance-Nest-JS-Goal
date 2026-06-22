import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DiscountRegistryService } from './discount-registry.service';
import { CartLine, DiscountRule } from './discount.interface';

export interface PricedCart {
  subtotalCents: number;
  totalCents: number;
  appliedDiscounts: string[];
}

@Injectable()
export class PricingService {
  constructor(
    // CONCEPT #6: Module reference.
    private readonly moduleRef: ModuleRef,
    private readonly registry: DiscountRegistryService,
  ) {}

  async priceCart(lines: CartLine[]): Promise<PricedCart> {
    const subtotalCents = lines.reduce((sum, l) => sum + l.qty * l.priceCents, 0);
    let totalCents = subtotalCents;
    const appliedDiscounts: string[] = [];

    for (const entry of this.registry.getRules()) {
      const rule = await this.resolveRule(entry.ruleClass, entry.isStatic);
      const result = rule.evaluate(lines);
      if (result && result.discountCents > 0) {
        totalCents -= result.discountCents;
        appliedDiscounts.push(result.label);
      }
    }

    return { subtotalCents, totalCents: Math.max(0, totalCents), appliedDiscounts };
  }

  /**
   * Singletons are fetched with ModuleRef.get(); non-static (scoped/transient)
   * providers must use the async ModuleRef.resolve(). { strict: false } searches
   * the whole app, not just the current module.
   */
  private resolveRule(ruleClass: any, isStatic: boolean): Promise<DiscountRule> | DiscountRule {
    return isStatic
      ? this.moduleRef.get<DiscountRule>(ruleClass, { strict: false })
      : this.moduleRef.resolve<DiscountRule>(ruleClass, undefined, { strict: false });
  }
}

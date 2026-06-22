import { Injectable, Logger, OnApplicationBootstrap, Scope, Type } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { DISCOUNT_RULE } from './discount.decorator';
import { DiscountRule } from './discount.interface';

export interface DiscoveredRule {
  ruleClass: Type<DiscountRule>;
  /** true => singleton (use ModuleRef.get); false => scoped (use ModuleRef.resolve). */
  isStatic: boolean;
}

/**
 * CONCEPT #10: Discovery service.
 * CONCEPT #9: Lifecycle events (OnApplicationBootstrap).
 *
 * On bootstrap, scan EVERY provider in the container and keep the ones marked
 * with the @DiscountRuleProvider() metadata. New rules are picked up purely by
 * adding the decorator — no central list to edit.
 */
@Injectable()
export class DiscountRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DiscountRegistryService.name);
  private rules: DiscoveredRule[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    this.rules = this.discovery
      .getProviders()
      .filter((w) => w.metatype && this.reflector.get(DISCOUNT_RULE, w.metatype))
      .map((w) => ({
        ruleClass: w.metatype as Type<DiscountRule>,
        // A true singleton (use ModuleRef.get); TRANSIENT/REQUEST need resolve().
        isStatic:
          w.scope !== Scope.TRANSIENT &&
          w.scope !== Scope.REQUEST &&
          w.isDependencyTreeStatic(),
      }));

    this.logger.log(
      `Discovered ${this.rules.length} discount rules: ` +
        this.rules.map((r) => `${r.ruleClass.name}(${r.isStatic ? 'static' : 'scoped'})`).join(', '),
    );
  }

  getRules(): DiscoveredRule[] {
    return this.rules;
  }
}

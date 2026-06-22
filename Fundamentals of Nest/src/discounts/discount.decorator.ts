import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';

export const DISCOUNT_RULE = 'DISCOUNT_RULE';

/**
 * CONCEPT #10: Discovery service (custom decorator side).
 *
 * @DiscountRuleProvider() marks a provider so the DiscoveryService can find it
 * at runtime. It bundles @Injectable() + a metadata flag, so a rule class only
 * needs this one decorator to be auto-registered.
 */
export const DiscountRuleProvider = () =>
  applyDecorators(Injectable(), SetMetadata(DISCOUNT_RULE, true));

export interface CartLine {
  productId: number;
  qty: number;
  priceCents: number;
}

export interface DiscountResult {
  label: string;
  discountCents: number;
}

/** Each discount rule inspects the cart lines and optionally returns a discount. */
export interface DiscountRule {
  readonly label: string;
  evaluate(lines: CartLine[]): DiscountResult | null;
}

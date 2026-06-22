export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export type GatewayKind = 'fake' | 'stripe';

export interface PaymentsModuleOptions {
  gateway: GatewayKind;
}

export interface ChargeResult {
  status: 'succeeded' | 'failed';
  reference: string;
}

export interface PaymentGateway {
  readonly name: string;
  charge(amountCents: number): Promise<ChargeResult>;
}

import { Logger } from '@nestjs/common';
import { ChargeResult, PaymentGateway } from '../payments.constants';

/**
 * A gateway that requires an async "handshake" before it can be used —
 * the perfect candidate for an asynchronous provider (see payments.module.ts).
 */
export class StripeGateway implements PaymentGateway {
  readonly name = 'stripe';
  private constructor(private readonly sessionToken: string) {}

  // CONCEPT #2: async factory. The provider awaits connect() at startup.
  static async connect(): Promise<StripeGateway> {
    const logger = new Logger('StripeGateway');
    logger.log('Performing async handshake with payment provider…');
    await new Promise((resolve) => setTimeout(resolve, 150));
    return new StripeGateway('sess_demo_token');
  }

  async charge(amountCents: number): Promise<ChargeResult> {
    // Demo rule: decline charges over $5000 to show the failure path.
    const status = amountCents > 500000 ? 'failed' : 'succeeded';
    return { status, reference: `${this.sessionToken}_${amountCents}` };
  }
}

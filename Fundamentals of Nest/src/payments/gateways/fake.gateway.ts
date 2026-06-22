import { ChargeResult, PaymentGateway } from '../payments.constants';

// Always-approves gateway, used for local/dev and tests.
export class FakeGateway implements PaymentGateway {
  readonly name = 'fake';

  async charge(amountCents: number): Promise<ChargeResult> {
    return { status: 'succeeded', reference: `fake_${amountCents}` };
  }
}

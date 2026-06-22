import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  GatewayKind,
  PaymentsModuleOptions,
  PAYMENT_GATEWAY,
} from './payments.constants';
import { FakeGateway } from './gateways/fake.gateway';
import { StripeGateway } from './gateways/stripe.gateway';

/**
 * CONCEPT #3: Dynamic module (forRoot).
 * The caller picks the gateway at bootstrap: PaymentsModule.forRoot({ gateway }).
 *
 * CONCEPT #2: Asynchronous provider.
 * When gateway === "stripe" the PAYMENT_GATEWAY provider uses an async factory
 * (StripeGateway.connect) that Nest awaits before the provider is available.
 */
@Module({})
export class PaymentsModule {
  static forRoot(options: PaymentsModuleOptions): DynamicModule {
    const gatewayProvider = PaymentsModule.buildGatewayProvider(options.gateway);
    return {
      module: PaymentsModule,
      global: true, // share the configured gateway app-wide
      providers: [gatewayProvider, PaymentsService],
      exports: [PaymentsService, PAYMENT_GATEWAY],
    };
  }

  private static buildGatewayProvider(kind: GatewayKind): Provider {
    if (kind === 'stripe') {
      return {
        provide: PAYMENT_GATEWAY,
        useFactory: async () => StripeGateway.connect(), // awaited async provider
      };
    }
    return {
      provide: PAYMENT_GATEWAY,
      useFactory: () => new FakeGateway(),
    };
  }
}

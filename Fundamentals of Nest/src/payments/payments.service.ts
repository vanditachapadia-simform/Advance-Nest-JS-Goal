import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/providers/app-logger.service';
import { ChargeResult, PaymentGateway, PAYMENT_GATEWAY } from './payments.constants';

@Injectable()
export class PaymentsService {
  constructor(
    // The concrete gateway behind PAYMENT_GATEWAY is decided at app bootstrap
    // by PaymentsModule.forRoot({ gateway }).
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PaymentsService.name);
  }

  async charge(orderId: number, amountCents: number): Promise<ChargeResult> {
    this.logger.log(`Charging order ${orderId} via "${this.gateway.name}" gateway`);
    const result = await this.gateway.charge(amountCents);
    await this.prisma.payment.create({
      data: {
        orderId,
        provider: this.gateway.name,
        status: result.status,
        amountCents,
      },
    });
    return result;
  }
}

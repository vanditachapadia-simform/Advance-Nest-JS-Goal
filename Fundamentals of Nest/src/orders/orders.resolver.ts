import { Mutation, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { OrderView } from './models/order.model';
import { RequestContextService } from '../common/providers/request-context.service';

@Resolver(() => OrderView)
export class OrdersResolver {
  constructor(
    private readonly orders: OrdersService,
    private readonly ctx: RequestContextService,
  ) {}

  @Mutation(() => OrderView, {
    description: 'Convert the current cart into a paid order.',
  })
  checkout() {
    return this.orders.checkout(this.ctx.userId);
  }
}

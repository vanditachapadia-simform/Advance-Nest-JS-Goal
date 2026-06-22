import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    // CONCEPT #5: forwardRef breaks the OrdersModule <-> CartModule cycle.
    forwardRef(() => CartModule),
    ProductsModule,
    DiscountsModule,
    // PaymentsModule is a dynamic module configured at the root (forRoot),
    // so here we only import the type; its providers come from app.module.
    PaymentsModule,
  ],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService],
})
export class OrdersModule {}

import { forwardRef, Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';
import { OrdersModule } from '../orders/orders.module';

/**
 * CONCEPT #5: Circular dependency at the module level.
 * CartModule imports OrdersModule and OrdersModule imports CartModule, so both
 * sides use forwardRef() to break the import cycle.
 */
@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}

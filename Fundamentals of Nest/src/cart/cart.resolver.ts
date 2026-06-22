import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { CartView } from './models/cart.model';

@Resolver(() => CartView)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartView, { description: 'Current open cart for the x-user-id header.' })
  cart() {
    return this.cartService.view();
  }

  @Mutation(() => CartView)
  addToCart(
    @Args('productId', { type: () => Int }) productId: number,
    @Args('qty', { type: () => Int, defaultValue: 1 }) qty: number,
  ) {
    return this.cartService.addItem(productId, qty);
  }
}

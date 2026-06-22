import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/models/product.model';

@ObjectType()
export class CartItemView {
  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  qty: number;

  @Field(() => Int)
  lineCents: number;
}

@ObjectType()
export class CartView {
  @Field(() => Int)
  id: number;

  @Field(() => [CartItemView])
  items: CartItemView[];

  @Field(() => Int)
  subtotalCents: number;

  @Field(() => Int, { description: 'How many orders this user has placed before.' })
  priorOrderCount: number;
}

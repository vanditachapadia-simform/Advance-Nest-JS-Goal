import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/models/product.model';

@ObjectType()
export class OrderItemView {
  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  qty: number;

  @Field(() => Int)
  priceCents: number;
}

@ObjectType()
export class OrderView {
  @Field(() => Int)
  id: number;

  @Field()
  status: string;

  @Field(() => Int)
  subtotalCents: number;

  @Field(() => Int)
  totalCents: number;

  @Field(() => [String], { description: 'Names of the discount rules that fired.' })
  appliedDiscounts: string[];

  @Field(() => [OrderItemView])
  items: OrderItemView[];
}

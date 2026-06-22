import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SalesReport {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Int)
  totalRevenueCents: number;

  @Field({ nullable: true })
  topProductName?: string;
}

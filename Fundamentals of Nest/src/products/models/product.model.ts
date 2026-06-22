import { Field, Int, ObjectType } from '@nestjs/graphql';

// GraphQL code-first type. @nestjs/graphql generates the SDL from these decorators.
@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => Int)
  priceCents: number;

  @Field(() => Int)
  stock: number;
}

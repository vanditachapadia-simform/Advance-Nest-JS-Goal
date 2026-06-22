import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './models/product.model';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [Product], { description: 'List the full catalog.' })
  products() {
    return this.productsService.findAll();
  }

  @Query(() => Product)
  product(@Args('id', { type: () => Int }) id: number) {
    return this.productsService.findOne(id);
  }
}

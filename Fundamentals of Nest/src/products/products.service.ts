import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/providers/app-logger.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    // TRANSIENT logger gets its own instance, stamped with this context.
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ProductsService.name);
  }

  findAll() {
    return this.prisma.product.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async decrementStock(id: number, qty: number) {
    this.logger.log(`Decrementing stock of product ${id} by ${qty}`);
    return this.prisma.product.update({
      where: { id },
      data: { stock: { decrement: qty } },
    });
  }
}

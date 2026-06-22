import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { PricingService } from '../discounts/pricing.service';
import { PaymentsService } from '../payments/payments.service';
import { AppLogger } from '../common/providers/app-logger.service';
import { OrderView } from './models/order.model';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    // CONCEPT #5: the other half of the cycle — forwardRef to CartService.
    @Inject(forwardRef(() => CartService))
    private readonly cart: CartService,
    private readonly products: ProductsService,
    private readonly pricing: PricingService,
    private readonly payments: PaymentsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OrdersService.name);
  }

  /** Half of the circular dependency: CartService calls this for its view. */
  countForUser(userId: number): Promise<number> {
    return this.prisma.order.count({ where: { userId } });
  }

  async checkout(userId: number): Promise<OrderView> {
    const { cart, items } = await this.cart.lineItems();
    if (!cart || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotalCents = items.reduce((sum, i) => sum + i.qty * i.product.priceCents, 0);

    // CONCEPT #6/#10 surface: discounts are discovered + applied here.
    const { totalCents, appliedDiscounts } = await this.pricing.priceCart(
      items.map((i) => ({ productId: i.productId, qty: i.qty, priceCents: i.product.priceCents })),
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
        totalCents,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            priceCents: i.product.priceCents,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // CONCEPT #2/#3 surface: payment goes through the async, dynamically-chosen gateway.
    const payment = await this.payments.charge(order.id, totalCents);
    const status = payment.status === 'succeeded' ? 'paid' : 'failed';

    await this.prisma.order.update({ where: { id: order.id }, data: { status } });

    if (status === 'paid') {
      for (const i of items) await this.products.decrementStock(i.productId, i.qty);
      await this.cart.markCheckedOut(cart.id);
    }
    this.logger.log(`Order ${order.id} -> ${status} (total ${totalCents}c)`);

    return {
      id: order.id,
      status,
      subtotalCents,
      totalCents,
      appliedDiscounts,
      items: order.items.map((i) => ({
        product: i.product,
        qty: i.qty,
        priceCents: i.priceCents,
      })),
    };
  }
}

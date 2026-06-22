import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/providers/request-context.service';
import { OrdersService } from '../orders/orders.service';
import { CartView } from './models/cart.model';

/**
 * CONCEPT #4: Injection scopes (REQUEST).
 * CartService is request-scoped: each request operates on its own instance,
 * resolving "the current user" from the request-scoped RequestContextService.
 *
 * CONCEPT #5: Circular dependency.
 * CartService <-> OrdersService form a cycle:
 *   - OrdersService reads the cart to build an order (needs CartService).
 *   - CartService reports the user's prior order count (needs OrdersService).
 * forwardRef() lets Nest resolve the cycle.
 */
@Injectable({ scope: Scope.REQUEST })
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}

  private async getOrCreateOpenCart() {
    const existing = await this.prisma.cart.findFirst({
      where: { userId: this.ctx.userId, status: 'open' },
    });
    if (existing) return existing;
    return this.prisma.cart.create({
      data: { userId: this.ctx.userId, status: 'open' },
    });
  }

  async addItem(productId: number, qty: number): Promise<CartView> {
    const cart = await this.getOrCreateOpenCart();
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + qty },
      });
    } else {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, productId, qty } });
    }
    return this.view();
  }

  /** Raw line items with product joined — consumed by OrdersService at checkout. */
  async lineItems(cartId?: number) {
    const cart = cartId
      ? await this.prisma.cart.findUnique({ where: { id: cartId } })
      : await this.getOrCreateOpenCart();
    if (!cart) return { cart: null, items: [] as any[] };
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });
    return { cart, items };
  }

  async markCheckedOut(cartId: number): Promise<void> {
    await this.prisma.cart.update({ where: { id: cartId }, data: { status: 'checked_out' } });
  }

  async view(): Promise<CartView> {
    const { cart, items } = await this.lineItems();
    const itemViews = items.map((i) => ({
      product: i.product,
      qty: i.qty,
      lineCents: i.qty * i.product.priceCents,
    }));
    return {
      id: cart?.id ?? 0,
      items: itemViews,
      subtotalCents: itemViews.reduce((sum, i) => sum + i.lineCents, 0),
      // Calls back into OrdersService — the other half of the cycle.
      priorOrderCount: await this.orders.countForUser(this.ctx.userId),
    };
  }
}

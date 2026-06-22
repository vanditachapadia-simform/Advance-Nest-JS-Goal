import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesReport } from './models/sales-report.model';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly prisma: PrismaService) {
    // Logged the first time the lazy module is actually instantiated.
    this.logger.log('ReportingService instantiated (lazy module loaded)');
  }

  async generateSalesReport(): Promise<SalesReport> {
    const paidOrders = await this.prisma.order.findMany({
      where: { status: 'paid' },
      include: { items: { include: { product: true } } },
    });

    const totalRevenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

    const unitsByProduct = new Map<string, number>();
    for (const order of paidOrders) {
      for (const item of order.items) {
        unitsByProduct.set(
          item.product.name,
          (unitsByProduct.get(item.product.name) ?? 0) + item.qty,
        );
      }
    }
    const topProductName = [...unitsByProduct.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return { totalOrders: paidOrders.length, totalRevenueCents, topProductName };
  }
}

import { Logger, Provider } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const CATALOG_READY = 'CATALOG_READY';

export interface CatalogReadiness {
  productCount: number;
  warmedAt: number;
}

/**
 * CONCEPT #2: Asynchronous providers.
 *
 * The factory is `async`, so Nest AWAITS it before the provider (and anything
 * depending on it) becomes available. The app won't start serving until the
 * catalog has been "warmed up". Real-world uses: opening a pooled connection,
 * fetching remote config, priming a cache.
 */
export const catalogReadyProvider: Provider = {
  provide: CATALOG_READY,
  useFactory: async (prisma: PrismaService): Promise<CatalogReadiness> => {
    const logger = new Logger('CatalogWarmup');
    logger.log('Warming up catalog… (async provider)');
    // Simulate async I/O latency, then read real data via Prisma.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const productCount = await prisma.product.count();
    logger.log(`Catalog ready: ${productCount} products (async provider resolved)`);
    return { productCount, warmedAt: Date.now() };
  },
  inject: [PrismaService],
};

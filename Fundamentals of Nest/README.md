# Nest Shop — 12 Advanced NestJS Concepts

A small but fully working **shopping application** (catalog → cart → discounts → order → payment → reports) built with **NestJS 10**, **GraphQL (code-first, Apollo)** and **Prisma + SQLite**.

Every advanced concept below is implemented as a *real feature* of the shop, and each site in the code is tagged with a `// CONCEPT #n:` comment.

## Concept → File index

| # | Concept | Primary file(s) |
|---|---------|-----------------|
| 1 | **Custom providers** (`useValue` / `useClass` / `useFactory` / `useExisting`) | [src/common/providers/tokens.ts](src/common/providers/tokens.ts), [src/common/common.module.ts](src/common/common.module.ts) |
| 2 | **Asynchronous providers** | [src/database/database.providers.ts](src/database/database.providers.ts), [src/payments/payments.module.ts](src/payments/payments.module.ts), [src/payments/gateways/stripe.gateway.ts](src/payments/gateways/stripe.gateway.ts) |
| 3 | **Dynamic modules** (`forRoot` / `forFeature`) | [src/common/config/config.module.ts](src/common/config/config.module.ts), [src/payments/payments.module.ts](src/payments/payments.module.ts) |
| 4 | **Injection scopes** (TRANSIENT / REQUEST) | [src/common/providers/app-logger.service.ts](src/common/providers/app-logger.service.ts), [src/common/providers/request-context.service.ts](src/common/providers/request-context.service.ts), [src/cart/cart.service.ts](src/cart/cart.service.ts) |
| 5 | **Circular dependency** (`forwardRef`) | [src/cart/cart.service.ts](src/cart/cart.service.ts) ↔ [src/orders/orders.service.ts](src/orders/orders.service.ts), [src/cart/cart.module.ts](src/cart/cart.module.ts) ↔ [src/orders/orders.module.ts](src/orders/orders.module.ts) |
| 6 | **Module reference** (`ModuleRef.get` / `.resolve`) | [src/discounts/pricing.service.ts](src/discounts/pricing.service.ts) |
| 7 | **Lazy-loading modules** (`LazyModuleLoader`) | [src/reporting/reports.resolver.ts](src/reporting/reports.resolver.ts), [src/reporting/reporting.module.ts](src/reporting/reporting.module.ts) |
| 8 | **Execution context** (`GqlExecutionContext`) | [src/common/guards/roles.guard.ts](src/common/guards/roles.guard.ts), [src/common/interceptors/logging.interceptor.ts](src/common/interceptors/logging.interceptor.ts) |
| 9 | **Lifecycle events** (`OnModuleInit` / `OnApplicationBootstrap` / `OnModuleDestroy`) | [src/prisma/prisma.service.ts](src/prisma/prisma.service.ts), [src/discounts/discount-registry.service.ts](src/discounts/discount-registry.service.ts), [src/main.ts](src/main.ts) |
| 10 | **Discovery service** (custom `@DiscountRuleProvider` decorator) | [src/discounts/discount.decorator.ts](src/discounts/discount.decorator.ts), [src/discounts/discount-registry.service.ts](src/discounts/discount-registry.service.ts) |
| 11 | **Platform agnosticism** (`HttpAdapterHost`) | [src/main.ts](src/main.ts) |
| 12 | **Testing** (unit + e2e) | [test/pricing.service.spec.ts](test/pricing.service.spec.ts), [test/discount-registry.spec.ts](test/discount-registry.spec.ts), [test/app.e2e-spec.ts](test/app.e2e-spec.ts) |

## Setup

```bash
npm install
npm run prisma:migrate   # creates dev.db + runs the migration
npm run prisma:seed      # seeds 2 users + 5 products
npm run start:dev        # http://localhost:3000/graphql
```

On boot the logs show the lifecycle order: **Prisma connected** → **Catalog ready (async provider)** → **Discovered N discount rules** → **Running on …**.

## Try it (GraphQL)

Open `http://localhost:3000/graphql`. Identify yourself with HTTP headers:
`x-user-id: 1` (customer) or `x-user-id: 2` + `x-user-role: admin`.

```graphql
# 1) Browse the catalog
query { products { id name priceCents stock } }

# 2) Add to cart (request-scoped cart keyed by x-user-id)
mutation { addToCart(productId: 3, qty: 1) { id subtotalCents priorOrderCount } }

# 3) Checkout — exercises the circular dep (Orders↔Cart),
#    discovered discounts (ModuleRef), and the async payment gateway
mutation { checkout { id status subtotalCents totalCents appliedDiscounts items { qty priceCents } } }

# 4) Admin-only sales report — triggers the LAZY module load.
#    Send header x-user-role: admin, else the RolesGuard denies it.
query { salesReport { totalOrders totalRevenueCents topProductName } }
```

## Configuration

`.env` keys (read by the dynamic `ConfigModule`):

- `PORT` — HTTP port (default 3000)
- `PAYMENT_GATEWAY` — `fake` (always approves) or `stripe` (async handshake, declines > $5000) — chosen by `PaymentsModule.forRoot()`
- `ENABLE_REQUEST_LOGGING` — toggles the logging interceptor flag

## Tests

```bash
npm test        # unit: discount rules + discovery
npm run test:e2e   # e2e GraphQL flow (needs a migrated + seeded dev.db)
```

## Platform agnosticism (concept #11)

The app talks to the HTTP layer only via `HttpAdapterHost`. To run on **Fastify** instead of Express:

1. `npm i @nestjs/platform-fastify` (replace `@nestjs/platform-express`)
2. In [src/main.ts](src/main.ts):
   ```ts
   import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
   const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
   ```

No resolver, service, guard, or interceptor changes — that is the point of the abstraction.

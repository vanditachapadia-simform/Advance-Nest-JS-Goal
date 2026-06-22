# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev          # watch mode — http://localhost:3000/graphql

# Database
npm run prisma:migrate     # create/run migration (SQLite, dev.db)
npm run prisma:seed        # seed 2 users + 5 products
npm run db:reset           # prisma migrate reset --force (drops and re-creates)

# Build & production
npm run build              # nest build → dist/
npm run start:prod         # node dist/main.js

# Tests
npm test                   # unit specs (jest.config.js) — test/*.spec.ts
npm run test:e2e           # e2e specs (jest-e2e.config.js) — test/*.e2e-spec.ts, run in band

# Run a single test file
npx jest --config jest.config.js test/pricing.service.spec.ts
npx jest --config jest-e2e.config.js test/app.e2e-spec.ts --runInBand
```

`tsconfig.build.json` excludes `prisma/` from compilation — this keeps `dist/main.js` at the expected path (not `dist/src/main.js`).

## Architecture

GraphQL-only API (code-first, Apollo Server 4, schema written to `src/schema.gql` on boot). No REST routes.

All prices are stored in **cents** (integers). The `GatewayKind` env var (`fake` | `stripe`) switches payment providers at startup.

### Module graph (simplified)

```
AppModule
├── ConfigModule (global, dynamic forRoot/forFeature)   — #3
├── CommonModule (global — custom providers, guards)    — #1 #4
├── PrismaModule (global)                               — #9
├── DatabaseModule (global — async CATALOG_READY token) — #2
├── GraphQLModule.forRoot(ApolloDriver)
├── ProductsModule
├── CartModule ←──forwardRef──→ OrdersModule            — #5
├── OrdersModule → DiscountsModule → PricingService     — #5 #6
├── DiscountsModule (DiscoveryModule, rule providers)   — #10
└── PaymentsModule.forRoot({ gateway }) (global)        — #2 #3
                                                (ReportingModule loaded lazily) — #7
```

`ReportsResolver` lives in `AppModule.providers` — it holds a `LazyModuleLoader` reference and `import()`s `ReportingModule` on the first `salesReport` query.

### Concept sites (all tagged `// CONCEPT #n`)

| # | File(s) | Key pattern |
|---|---------|-------------|
| 1 | `src/common/providers/tokens.ts`, `common.module.ts` | All four provider flavors: `useValue`, `useClass`, `useFactory`, `useExisting` |
| 2 | `src/database/database.providers.ts`, `payments/gateways/stripe.gateway.ts`, `payments/payments.module.ts` | `async useFactory` awaited before app is ready |
| 3 | `src/common/config/config.module.ts`, `src/payments/payments.module.ts` | `forRoot()` / `forFeature()` returning `DynamicModule` |
| 4 | `src/common/providers/app-logger.service.ts` (TRANSIENT), `src/common/providers/request-context.service.ts` + `cart/cart.service.ts` (REQUEST) | `@Injectable({ scope })` |
| 5 | `src/cart/cart.module.ts` ↔ `src/orders/orders.module.ts`, their services | `forwardRef(() => XModule)` in imports + `@Inject(forwardRef(() => XService))` in constructors |
| 6 | `src/discounts/pricing.service.ts` | `ModuleRef.get()` for singletons, `ModuleRef.resolve()` for transient; `{ strict: false }` for cross-module lookup |
| 7 | `src/reporting/reports.resolver.ts` | `await import('./reporting.module')` + `lazyModuleLoader.load(() => ReportingModule)` |
| 8 | `src/common/guards/roles.guard.ts`, `src/common/interceptors/logging.interceptor.ts` | `GqlExecutionContext.create(context)` to read headers transport-agnostically |
| 9 | `src/prisma/prisma.service.ts`, `src/discounts/discount-registry.service.ts`, `src/main.ts` | `OnModuleInit`, `OnApplicationBootstrap`, `OnModuleDestroy`, `enableShutdownHooks()` |
| 10 | `src/discounts/discount.decorator.ts`, `src/discounts/discount-registry.service.ts` | `@DiscountRuleProvider()` custom decorator + `DiscoveryService.getProviders()` filtered by `Reflector.get()` |
| 11 | `src/main.ts` | `HttpAdapterHost` — no Express-specific imports; swap to Fastify in one line |
| 12 | `test/pricing.service.spec.ts`, `test/discount-registry.spec.ts`, `test/app.e2e-spec.ts` | Unit with manual stubs + `Test.createTestingModule`; e2e with supertest |

### Adding a new discount rule

1. Create `src/discounts/rules/my.rule.ts` implementing `DiscountRule`, decorated `@DiscountRuleProvider()`.
2. Register it in `discounts.module.ts` providers (use `scope: Scope.TRANSIENT` or default singleton).
3. `DiscountRegistryService.onApplicationBootstrap()` auto-discovers it — no other wiring needed.

### Request-scoped flow

`RequestContextService` (REQUEST scope) is injected via the GraphQL `CONTEXT` token (from `@nestjs/graphql`). It reads `x-user-id`, `x-user-role`, and `x-correlation-id` from request headers. `CartService` is also REQUEST-scoped because it depends on `RequestContextService`.

Because REQUEST-scoped providers propagate up, any service that injects `CartService` or `RequestContextService` must itself be REQUEST-scoped or use `ModuleRef.resolve()`.

### isStatic check in DiscountRegistryService

`InstanceWrapper.isDependencyTreeStatic()` returns `true` even for TRANSIENT providers. The registry therefore checks **both** conditions:

```ts
isStatic: w.scope !== Scope.TRANSIENT && w.scope !== Scope.REQUEST && w.isDependencyTreeStatic()
```

This determines whether `PricingService` calls `moduleRef.get()` (singleton) or `moduleRef.resolve()` (scoped/transient).

### Known quirk — Apollo plugin type

`ApolloServerPluginLandingPageLocalDefault()` is cast `as any` in `app.module.ts` because `@apollo/server`'s dual CJS/ESM type declarations produce a private-property clash under ts-jest's stricter checking. The runtime behavior is unaffected.

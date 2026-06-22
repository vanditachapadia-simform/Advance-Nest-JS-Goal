# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A NestJS 11 POC — the **Enterprise Logistics & Shipment Management Platform** — that
deliberately exercises the full NestJS feature surface (REST, WS, SSE, BullMQ
queues, EventEmitter, TCP microservices, RBAC, Redis caching, cron). It manages
users, carriers, shipments + tracking, documents, notifications, audit logs and
analytics. See `README.md` for the feature-to-file matrix and API surface.

## Commands

```bash
# Run (needs MongoDB :27017 + Redis :6379 — or `docker-compose up --build` for the full stack)
npm run start:dev                       # HTTP gateway, watch mode
npm run start:user-service              # TCP microservice :3001 (also :shipment/:notification)

npm run build                           # nest build → dist/
npm run lint                            # eslint --fix
npm run format                          # prettier

# Tests
npm test                                # unit + integration (jest, config in package.json)
npm run test:e2e                        # e2e (config in test/jest-e2e.json)
npm run test:cov                        # coverage
npx jest path/to/file.spec.ts           # a single suite
npx jest -t "rotates tokens"            # a single test by name
```

Microservice entrypoints compile to `dist/microservices/<name>/main.js`; their
`docker-compose` services override the container `command` accordingly.

## Environment & config (read this before touching config)

- All env vars are **validated at boot** by `src/config/env.validation.ts`. A
  missing/invalid var throws and the app won't start. Number fields use
  `@Type(() => Number)` — keep that when adding numeric vars or coercion breaks
  under the e2e ConfigModule.
- Config is **namespaced** via `registerAs` in `src/config/configuration.ts`
  (`app.*`, `database.*`, `redis.*`, `jwt.*`, `security.*`, `http.*`,
  `microservices.*`, `upload.*`). Inject with `config.get('jwt.accessSecret')`,
  never `process.env` directly.
- `.env` exists (gitignored) so `docker-compose` works out of the box.

## Architecture — the load-bearing pieces

**Global cross-cutting wiring lives in `AppModule`, not in feature modules.** The
order matters and is intentional:

- **Global guards (execution order):** `JwtAuthGuard` → `RolesGuard` →
  `ThrottlerGuard`. Auth is on by default everywhere; opt out per-route with
  `@Public()`. Authorize with `@Roles(Role.X)`. New controllers are protected
  automatically — you must explicitly mark public routes.
- **Global interceptors (declaration = execution order):** `Performance` →
  `Audit` → `Transform`. `TransformInterceptor` wraps every response in
  `{ success, statusCode, data, correlationId, timestamp }` — **except**
  `StreamableFile` and SSE, which pass through. Tests that assert on response
  shape must account for this envelope (the focused e2e module omits it on
  purpose).
- **Global filters (most-specific LAST so it wins):** `AllExceptions` →
  `MongoException` → `BusinessException`. Throw `BusinessException` /
  `ResourceNotFoundException` / `InvalidStateTransitionException` from
  `common/exceptions` for expected domain errors; they render with a
  machine-readable `code`.
- **Global middleware:** request-id → correlation-id → request-logger, applied to
  `*`. `req.correlationId` threads through logs, responses, events.

**`@Global()` infra modules** (config, logger, redis, queues, audit) are imported
once in `AppModule` and injectable everywhere — don't re-import them in feature
modules.

**Data access goes through the Repository Pattern.** Services depend on
`XxxRepository extends BaseRepository<T>` (`src/database/base.repository.ts`), not
on Mongoose models directly. Repositories inject `Model<Entity>` (the plain
entity type, **not** `Model<EntityDocument>` — the HydratedDocument generic
triggers a "two different types" TS variance error against `BaseRepository`).

**Mongoose schema gotcha:** any nullable union prop (`string | null`,
`Date | null`) needs an explicit `@Prop({ type: String/Date, ... })`. Without it,
`SchemaFactory.createForClass` throws at *runtime* ("Cannot determine a type") —
which compiles fine but fails when the schema module is first imported (e.g. in a
test).

**Real-time fan-out is decoupled via `TrackingStreamService`** (an in-memory RxJS
`Subject` in the shipments module, exported). `ShipmentsService` publishes tracking
updates to it; both the SSE endpoint (`GET /shipments/:id/live`) and the Socket.IO
`/tracking` gateway subscribe. Neither consumer references the producer — this is
how Shipments ↔ Realtime avoid a circular dependency (no `forwardRef`). For
multi-node scale this would be backed by Redis pub/sub; the interface stays the same.

**Event-driven side effects:** services emit domain events (`EVENTS.*` constants)
via `EventEmitter2`; listeners in `src/events/listeners/` and `@Plugin()` classes
react asynchronously. Adding a side effect to shipment creation = add a listener,
don't edit the service.

**Plugin discovery:** `PluginExplorer` (`modules/plugins`) uses `DiscoveryService`
to auto-detect every provider decorated with `@Plugin()` at startup — register a
new plugin by creating the class and listing it in `plugins.module.ts`; the
explorer wires it and dispatches events to it automatically.

**Shared string constants are centralized** in `src/shared/constants` (queue names,
event names, DI tokens, microservice patterns) and enums in `src/shared/enums`.
Use these — don't hand-write `'shipment.created'`. The shipment status state
machine (`SHIPMENT_TRANSITIONS`) is enforced in `ShipmentsService.addTrackingEvent`.

## Conventions

- Controllers use `@Controller({ path, version: '1' })`; everything serves under
  `/api/v1` (URI versioning, global prefix set in `main.ts`, `health` excluded).
- DTOs use `class-validator` + Swagger decorators; the global `ValidationPipe` runs
  `whitelist: true, forbidNonWhitelisted: true, transform: true` — unknown body
  fields are rejected.
- Path aliases exist (`@common/*`, `@modules/*`, `@config/*`, `@infrastructure/*`,
  `@app/*`) and are mapped in both tsconfig and jest configs.

## Testing notes

- Integration + e2e suites use `mongodb-memory-server` (downloads a Mongo binary
  on first run — cache it once for offline CI). They do **not** require external
  Redis; the e2e builds a focused `Auth + Users` module rather than the full
  `AppModule` (which would pull in real Redis/BullMQ connections).
- For service unit tests, mock dependencies as plain objects typed `any`. The
  `jest.Mocked<Partial<T>>` pattern does **not** expose `.mockResolvedValue` on
  methods here — use `any`.

## Platform note

Uses the **Express** adapter (not Fastify) for cookies/sessions/CSRF/Multer/SSE
compatibility. The app is otherwise platform-neutral — `AllExceptionsFilter` uses
`HttpAdapterHost` precisely so a Fastify swap touches only `main.ts` + the
Express-typed middleware imports.

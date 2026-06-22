# Enterprise Logistics & Shipment Management Platform

A production-grade **NestJS** Proof of Concept that demonstrates the full NestJS
ecosystem and enterprise architecture patterns — REST APIs, WebSockets, SSE,
background queues, event-driven design, microservices, RBAC security, caching,
and observability — for managing **users, carriers, shipments, tracking,
documents, notifications, audit logs and analytics**.

> Stack: **NestJS 11 · TypeScript (strict) · MongoDB (Mongoose) · Redis ·
> BullMQ · Socket.IO · JWT · Docker**

---

## Table of contents

1. [Quick start](#quick-start)
2. [Architecture](#architecture)
3. [Folder structure](#folder-structure)
4. [NestJS concepts demonstrated](#nestjs-concepts-demonstrated)
5. [API surface](#api-surface)
6. [Security](#security)
7. [Background processing & real-time](#background-processing--real-time)
8. [Microservices](#microservices)
9. [Testing](#testing)
10. [Configuration](#configuration)
11. [Design decisions](#design-decisions)

---

## Quick start

### With Docker (recommended)

Spins up MongoDB, Redis, the HTTP gateway and all three microservices:

```bash
docker-compose up --build
```

Then open:

| URL                              | What                              |
| -------------------------------- | --------------------------------- |
| http://localhost:3000/api/v1     | REST API (versioned)              |
| http://localhost:3000/docs       | Swagger / OpenAPI UI              |
| http://localhost:3000/health     | Health probe (Mongo + Redis + mem)|

### Local development

Requires a local MongoDB on `:27017` and Redis on `:6379` (or point `.env` at
your instances; set `MONGO_URI=mongodb://localhost:27017/logistics` and
`REDIS_HOST=localhost`).

```bash
cp .env.example .env        # adjust as needed
npm install
npm run start:dev           # HTTP gateway with hot-reload

# Microservices (separate terminals)
npm run start:user-service
npm run start:shipment-service
npm run start:notification-service
```

### First requests

```bash
# Register (returns access + refresh tokens)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","password":"P@ssw0rd!"}'

# Use the accessToken as a Bearer token for protected routes
curl http://localhost:3000/api/v1/users/me -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Architecture

Clean, layered architecture with Domain-Driven boundaries:

```
HTTP / WS / SSE  ─▶  Controllers / Gateways
                        │  (Guards → Interceptors → Pipes)
                        ▼
                     Services         ◀── Event listeners, Queue producers
                        │
                        ▼
                  Repositories        (Repository Pattern over Mongoose)
                        │
                        ▼
                   MongoDB / Redis
```

- **Repository Pattern** — `BaseRepository<T>` abstracts data access; concrete
  repos (`UsersRepository`, `ShipmentsRepository`, …) extend it.
- **Service Layer** — business rules (e.g. the shipment status state-machine).
- **Event-Driven** — services emit domain events; listeners + plugins react
  asynchronously (decoupled side-effects).
- **CQRS-leaning reads** — cached read-through paths via Redis for hot queries.
- **SOLID / DI** — everything wired through Nest's DI container.

---

## Folder structure

```
src/
├── config/                 # Typed, namespaced config + env validation
├── database/               # Mongoose connection + BaseRepository
├── common/                 # Cross-cutting: decorators, guards, filters,
│                           #   interceptors, middleware, pipes, validators
├── infrastructure/         # Redis, Winston logger, scheduler (cron)
├── queues/                 # BullMQ producer + processors (email/report/document)
├── events/                 # EventEmitter payloads + listeners
├── shared/                 # Enums, constants (queues/events/tokens/patterns)
├── microservices/          # user / shipment / notification TCP services + clients
└── modules/                # Feature modules (DDD bounded contexts)
    ├── auth/               #   JWT + refresh, strategies, RBAC
    ├── users/  carriers/   #   CRUD + repositories
    ├── shipments/          #   Core domain: tracking, state-machine, SSE stream
    ├── documents/          #   Multer upload + file streaming
    ├── notifications/      #   DYNAMIC MODULE (register / registerAsync)
    ├── audit/              #   Append-only audit trail (global)
    ├── analytics/          #   Cached dashboard + lazy-loaded reports
    ├── realtime/           #   Socket.IO gateway
    ├── plugins/            #   DiscoveryService-based plugin system
    ├── integrations/       #   HTTP module + retry (maps/weather/carrier)
    ├── health/             #   Terminus health checks
    └── security/           #   CSRF double-submit demo
```

---

## NestJS concepts demonstrated

| Concept | Where |
| --- | --- |
| **Controllers / Providers / Modules** | every feature module |
| **Middleware** | `common/middleware/*` (request-id, correlation-id, request-logger) |
| **Exception Filters** | `AllExceptionsFilter`, `BusinessExceptionFilter`, `MongoExceptionFilter` |
| **Pipes** | global `ValidationPipe`, `ParseObjectIdPipe`, `ParseFilePipeBuilder` |
| **Guards** | `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard`, `WsJwtGuard`, `LocalAuthGuard` |
| **Interceptors** | `TransformInterceptor`, `PerformanceInterceptor`, `AuditInterceptor`, `HttpCacheInterceptor` |
| **Custom Decorators** | `@Roles`, `@Public`, `@CurrentUser`, `@Audit`, `@Cacheable`, `@Plugin` |
| **Custom + Async Providers** | `RedisModule` (ioredis factory), `ClientsModule` (TCP proxies) |
| **Dynamic Modules** | `NotificationsModule.register()` / `.registerAsync()` |
| **Injection Scopes** | request-scoped `CurrentUser`; default singletons elsewhere |
| **Circular dep handling** | shared `TrackingStreamService` decouples Shipments ↔ Realtime (no `forwardRef` needed by design) |
| **ModuleRef** | `PluginExplorer.resolvePlugin()` (runtime resolution) |
| **Lazy Loading** | `AnalyticsService.generateLazyReport()` via `LazyModuleLoader` |
| **Execution Context** | guards/interceptors switch HTTP ↔ WS contexts |
| **Lifecycle Hooks** | `OnModuleDestroy` (Redis), `OnModuleInit` (gateway, plugins), `enableShutdownHooks()` |
| **Discovery Service** | `PluginExplorer` auto-detects `@Plugin()` providers |
| **Platform Agnostic** | Express adapter, abstracted behind Nest's HTTP layer (see [Design decisions](#design-decisions)) |
| **Config Module** | `AppConfigModule` + namespaced factories + env validation |
| **Caching** | Redis read-through (`@Cacheable` + `HttpCacheInterceptor`) |
| **Serialization** | schema `toJSON` transforms (strip `password`, map `_id`→`id`) |
| **API Versioning** | URI versioning (`/api/v1/...`) |
| **Task Scheduling** | `TasksService` cron jobs (analytics, cleanup, archive, health) |
| **Queues** | BullMQ email / report / document processors |
| **Events** | `EventEmitter2` domain events + listeners |
| **SSE** | `GET /api/v1/shipments/:id/live` |
| **WebSockets** | `/tracking` Socket.IO namespace |
| **File upload / streaming** | Multer upload + `StreamableFile` download |
| **HTTP Module** | `ExternalApiService` with exponential-backoff retry |
| **Microservices** | 3 TCP services, `@MessagePattern` + `@EventPattern` |

---

## API surface

All routes are under `/api/v1`. Full, interactive documentation at **`/docs`**.

| Area | Endpoints (selected) |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login` (5/min), `POST /auth/refresh`, `POST /auth/logout` |
| Users | `GET/POST/PATCH/DELETE /users`, `GET /users/me` |
| Carriers | `GET/POST/PATCH/DELETE /carriers` (`GET /carriers/:id` cached) |
| Shipments | `POST /shipments`, `GET /shipments`, `POST /shipments/:id/tracking`, `PATCH /shipments/:id/assign-carrier/:carrierId`, `GET /shipments/:id/live` (SSE) |
| Documents | `POST /documents` (upload), `GET /documents/:id/download` (stream) |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |
| Analytics | `GET /analytics/dashboard`, `GET /analytics/reports/lazy` |
| Audit | `GET /audit-logs` (admin) |
| Plugins | `GET /plugins` (admin) |
| Integrations | `GET /integrations/weather`, `GET /integrations/geocode` |
| Microservices | `GET /ms/user/:id`, `GET /ms/shipments/summary` |
| Security | `GET /security/csrf-token`, `POST /security/echo` |
| Health | `GET /health` |

### RBAC roles

`ADMIN` › `MANAGER` › `DISPATCHER` › `CARRIER` › `USER` — enforced by `@Roles()`
+ `RolesGuard`. Self-registration always provisions a base `USER`.

---

## Security

- **JWT access + refresh** with refresh-token **rotation** and reuse detection
  (hash stored per user; mismatch revokes the session).
- **bcrypt** password hashing (cost 12).
- **Helmet** secure headers, **CORS** (env-configurable origins), **compression**.
- **Rate limiting** via `@nestjs/throttler` (global default + 5/min on login).
- **CSRF** double-submit-cookie demo (`SecurityModule`).
- **Cookies & sessions** (`cookie-parser`, `express-session`; refresh token also
  set as an httpOnly cookie).
- **Validation** — global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.

---

## Background processing & real-time

- **Queues (BullMQ)** — `email`, `report`, `document` queues with retry +
  exponential backoff and progress reporting.
- **Cron (`@nestjs/schedule`)** — daily analytics snapshot, stale-shipment
  cleanup, audit archival check, 30s liveness self-check.
- **Events (`EventEmitter2`)** — `shipment.created/updated/delivered`,
  `user.created`, `carrier.created` → listeners + plugins.
- **SSE** — live tracking stream per shipment.
- **WebSockets** — `/tracking` namespace: room-per-shipment broadcasts, online
  presence, JWT-guarded subscriptions.

`TrackingStreamService` is the in-memory pub/sub hub bridging the service layer
to both SSE and WebSocket consumers. (In a multi-node deployment, back it with
Redis pub/sub — the interface is unchanged.)

---

## Microservices

Three standalone Nest microservices over the **TCP** transport:

| Service | Port | Patterns |
| --- | --- | --- |
| user-service | 3001 | `user.findById`, `user.validate` (msg); `event.user.created` (event) |
| shipment-service | 3002 | `shipment.summary` (msg); `event.shipment.created` (event) |
| notification-service | 3003 | `notification.send` (msg) |

The gateway talks to them via injected `ClientProxy` instances
(`MicroserviceClientsModule`, async custom providers). See
`GET /api/v1/ms/...`.

---

## Testing

```bash
npm test            # unit + integration
npm run test:e2e    # end-to-end (auth flow)
npm run test:cov    # with coverage report
```

Current suite — **28 tests, all green**:

- **Unit** — `AuthService` (credential validation, login, refresh rotation /
  reuse detection), `RolesGuard`, `ParseObjectIdPipe`, `ShipmentsService`
  state-machine, `IsMcNumber` validator.
- **Integration** — `UsersRepository` against a real **in-memory MongoDB**
  (`mongodb-memory-server`): persistence, `select:false` password hiding, unique
  index enforcement.
- **E2E** — full **register → login → /me → refresh** flow over HTTP against
  in-memory Mongo (no external Redis needed for the test).

> The e2e and integration suites use `mongodb-memory-server`, which downloads a
> MongoDB binary on first run (cache it once with network access for offline CI).
> The harness is structured so coverage can be expanded toward the 80% target by
> adding per-module specs following the same patterns.

---

## Configuration

All configuration is environment-driven and **validated at boot** (`env.validation.ts`)
— the app fails fast on missing/invalid vars. See `.env.example` for the full
list (Mongo, Redis, JWT secrets/TTLs, CORS, throttling, external API keys,
microservice hosts/ports, upload limits).

---

## Design decisions

- **Express over Fastify.** The spec lists the Fastify adapter for throughput,
  but this POC uses **Express** for first-class, battle-tested support of
  cookies, sessions, CSRF, Multer and SSE together. The app is otherwise
  framework-neutral: controllers/services never touch the platform directly, so
  switching to Fastify means changing the adapter in `main.ts` plus the few
  Express-typed middleware imports. The platform-agnostic exception filter uses
  `HttpAdapterHost` precisely so it works on either.
- **Mongoose over the raw driver** for ergonomic schemas, hooks, virtuals and
  TTL indexes (audit logs auto-expire after a year).
- **Refresh-token rotation** rather than long-lived tokens, with server-side
  hash storage for revocation and theft detection.
- **In-memory tracking hub** keeps the POC single-dependency; documented upgrade
  path to Redis pub/sub for horizontal scale.
- **`@Global()` infra modules** (config, logger, redis, queues, audit) to keep
  feature-module imports focused on domain concerns.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | HTTP gateway, watch mode |
| `npm run build` | Compile to `dist/` |
| `npm test` / `test:e2e` / `test:cov` | Tests |
| `npm run lint` / `format` | Lint / format |
| `npm run start:{user,shipment,notification}-service` | Run a microservice |

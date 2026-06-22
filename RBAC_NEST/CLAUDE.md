# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start database (Postgres on port 5431)
docker compose up -d

# Dev server with hot-reload
npm run start:dev

# Type-check without emitting
npx tsc --noEmit

# Lint
npm run lint

# Tests
npm run test                  # unit tests
npm run test:e2e              # end-to-end
npm run test:cov              # coverage

# Prisma
npx prisma generate           # regenerate client after schema changes (no DB needed)
npx prisma migrate dev        # create + apply a new migration
npx prisma migrate deploy     # apply pending migrations (CI / prod)
npx prisma studio             # GUI browser for the DB
```

### Database URL for docker-compose

```
DATABASE_URL="postgresql://admin:admin_password@localhost:5431/rbac_db"
```

The container maps `5431 → 5432` inside the container.

---

## Architecture

### Request lifecycle

Every incoming request passes through this guard stack (applied globally in `AppModule`):

```
Request
  → CustomThrottlerGuard   (rate limiting: 100 req/60s global, 10 req/60s on auth routes)
  → JwtAccessGuard         (validates Bearer JWT; bypassed by @PublicRoute())
  → CsrfGuard              (double-submit cookie; bypassed by @SkipCsrf() or safe methods)
  → PolicyGuard            (CASL ability check; reads rules from DB via PrismaService)
  → Controller handler
```

`JwtAccessGuard` and `CsrfGuard` are registered as `APP_GUARD` providers. `PolicyGuard` is applied per-controller with `@UseGuards(PolicyGuard)`.

### RBAC / CASL permission model

Permissions live entirely in the database (`permission` table). Each row is a CASL rule: `{ action, subject, conditions? }` scoped to a `role`.

Flow:
1. `JwtAccessGuard` decodes the JWT and puts `{ id, email }` on `req.user`.
2. `PolicyGuard` fetches the full user + role + permissions from Postgres, calls `CaslAbilityFactory.parseCondition()` to resolve `user.*` placeholders in JSON conditions, builds a `MongoAbility`, then calls `ForbiddenError.throwUnlessCan(action, subject)` for each rule declared via `@checkAbilities()`.
3. Controllers may call `ForbiddenError.throwUnlessCan()` a second time with a specific resource instance (using CASL's `subject()` helper) for row-level checks.

### Security layers (added in latest session)

| Layer | Where configured |
|---|---|
| Helmet (HTTP headers) | `main.ts` — `app.use(helmet())` |
| CORS | `main.ts` — `app.enableCors(...)`, origin from `CORS_ORIGIN` env |
| bcrypt hashing | `auth.service.ts` — `bcrypt.hash/compare` with salt rounds = 10 |
| JWT secret via env | `JWT_SECRET` in `.env`; consumed by `JwtAccessStrategy` and `JwtAccessGuard` |
| CSRF (double-submit cookie) | `CsrfMiddleware` sets signed cookie; `CsrfGuard` validates `X-CSRF-Token` header |
| Rate limiting | `ThrottlerModule` + `CustomThrottlerGuard`; login uses `@Throttle({ auth: ... })` |

### Key decorators

| Decorator | Effect |
|---|---|
| `@PublicRoute()` | Bypasses `JwtAccessGuard` and `PolicyGuard` |
| `@checkAbilities({ action, subject })` | Declares required CASL rule checked by `PolicyGuard` |
| `@SkipCsrf()` | Bypasses `CsrfGuard` (use on Bearer-token-only endpoints) |
| `@Throttle({ auth: ... })` | Applies the tighter `auth` throttle profile |

### Prisma schema summary

- `users` — `user_id`, `user_email`, `user_password` (bcrypt hash), `role_id`
- `role` — `role_id`, `role_name`; has many `permission` and `users`
- `permission` — `id`, `role_id`, `action`, `subject`, `conditions` (JSON, nullable)
- `Article` — `id`, `title`, `published`, `archived`, `owner_id` → `users`

After any schema change run `npx prisma generate` before building; the TypeScript types come from the generated client.

### Environment variables (`.env`)

```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=1d
CSRF_SECRET=
CORS_ORIGIN=http://localhost:3000
```

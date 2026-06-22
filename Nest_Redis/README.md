# Redis URL Shortener (NestJS)

A small, portfolio-friendly **rate-limited URL shortener** that demonstrates core
Redis operations — `SET`/`EX`, `GET`, `INCR`, `EXPIRE`, `TTL`, `EXISTS` — inside
idiomatic NestJS patterns (modules, controllers, services, DTOs, DI, interceptors).

## Features

- **Shorten** a long URL into a short code (stored with a TTL).
- **Redirect** (302) from a short code to the original URL, counting clicks.
- **Stats** endpoint returning click count and remaining TTL.
- **Rate limiting** per IP on the shorten endpoint, backed by Redis `INCR`/`EXPIRE`.
- **Swagger** docs at `/api`.

## Requirements

- Node.js 18+ (tested on Node 22)
- **No Redis or Docker required** — by default the app uses an in-memory
  [`ioredis-mock`](https://github.com/stipsan/ioredis-mock). To use a real,
  persistent Redis, just set `REDIS_URL` (see below) — **no code changes needed**.

## Setup

```bash
npm install
cp .env.example .env   # already present; adjust if you like
npm run start:dev
```

On startup you'll see either:

```
Redis: in-memory mock (set REDIS_URL to use a real Redis)
```

or, if `REDIS_URL` is set:

```
Redis: connecting to real instance at redis://localhost:6379
```

## Endpoints

| Method | Endpoint       | Purpose                                  | Redis ops              |
|--------|----------------|------------------------------------------|------------------------|
| POST   | `/shorten`     | Create a short code (rate-limited per IP)| `SET`+`EX`, `INCR` (rl)|
| GET    | `/:code`       | 302 redirect to the original URL         | `GET`, `INCR` (clicks) |
| GET    | `/stats/:code` | Click count + remaining TTL              | `GET`, `TTL`           |

Interactive docs: **http://localhost:3000/api**

## Try it (curl)

```bash
# Create a short URL
curl -X POST localhost:3000/shorten \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://nestjs.com"}'
# -> {"code":"aB3xZ9k","shortUrl":"http://localhost:3000/aB3xZ9k","expiresInSeconds":3600}

# Follow the redirect (note the 302 + Location header)
curl -i localhost:3000/aB3xZ9k

# See stats (clicks increments on each redirect; ttlSeconds counts down)
curl localhost:3000/stats/aB3xZ9k

# Validation: a bad URL is rejected with 400
curl -X POST localhost:3000/shorten -H 'Content-Type: application/json' -d '{"url":"not-a-url"}'

# Rate limit: fire the shorten endpoint 6 times quickly -> the 6th returns 429
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/shorten \
    -H 'Content-Type: application/json' -d '{"url":"https://example.com"}'
done
```

## Configuration (`.env`)

| Variable                    | Default                  | Description                                   |
|-----------------------------|--------------------------|-----------------------------------------------|
| `PORT`                      | `3000`                   | HTTP port                                     |
| `BASE_URL`                  | `http://localhost:3000`  | Used to build the returned `shortUrl`         |
| `URL_TTL_SECONDS`           | `3600`                   | Lifetime of a short code before it expires    |
| `RATE_LIMIT_MAX`            | `5`                      | Max shorten requests per window per IP        |
| `RATE_LIMIT_WINDOW_SECONDS` | `60`                     | Rate-limit window length                      |
| `REDIS_URL`                 | _(unset)_                | If set, uses a real Redis instead of the mock |

## Project structure

```
src/
├── main.ts                       # bootstrap: ValidationPipe + Swagger
├── app.module.ts
├── redis/
│   ├── redis.constants.ts        # REDIS_CLIENT injection token
│   ├── redis.module.ts           # @Global; real-or-mock client factory
│   └── redis.service.ts          # set/get/incr/expire/ttl/exists wrapper
├── url/
│   ├── url.module.ts
│   ├── url.controller.ts         # /shorten, /stats/:code, /:code
│   ├── url.service.ts            # code-gen, storage, click counting, stats
│   └── dto/
│       ├── create-url.dto.ts
│       └── url-stats.dto.ts
└── common/
    └── rate-limit.interceptor.ts # IP-based INCR + EXPIRE -> 429
```

> **Note:** With the default in-memory mock, all data resets when the server
> restarts — expected for a demo. Set `REDIS_URL` to persist across restarts.

## Possible extensions

- Persist URLs in PostgreSQL with Redis as a cache layer.
- Add async click analytics with BullMQ (Redis-backed job queue).
- Add JWT authentication for managing your own links.

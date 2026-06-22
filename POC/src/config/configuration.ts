import { registerAs } from '@nestjs/config';

/**
 * Typed, namespaced configuration.
 *
 * Each `registerAs('<ns>', ...)` block produces an injectable config object that
 * can be consumed type-safely via `ConfigType<typeof xConfig>`. Namespacing keeps
 * concerns isolated (app vs db vs security) and makes partial injection trivial.
 */

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  name: process.env.APP_NAME ?? 'Enterprise Logistics Platform',
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  globalPrefix: process.env.APP_GLOBAL_PREFIX ?? 'api',
  defaultApiVersion: process.env.APP_DEFAULT_API_VERSION ?? '1',
  isProduction: process.env.NODE_ENV === 'production',
}));

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/logistics',
  dbName: process.env.MONGO_DB_NAME ?? 'logistics',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '60', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));

export const securityConfig = registerAs('security', () => ({
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-session-secret',
  csrfSecret: process.env.CSRF_SECRET ?? 'dev-csrf-secret',
  cookieSecret: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  throttleTtlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

export const httpConfig = registerAs('http', () => ({
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  carrierApiBaseUrl: process.env.CARRIER_API_BASE_URL ?? '',
  weatherApiBaseUrl: process.env.WEATHER_API_BASE_URL ?? 'https://api.open-meteo.com/v1',
  timeoutMs: parseInt(process.env.HTTP_TIMEOUT_MS ?? '8000', 10),
  maxRetries: parseInt(process.env.HTTP_MAX_RETRIES ?? '3', 10),
}));

export const microservicesConfig = registerAs('microservices', () => ({
  user: {
    host: process.env.USER_SERVICE_HOST ?? 'localhost',
    port: parseInt(process.env.USER_SERVICE_PORT ?? '3001', 10),
  },
  shipment: {
    host: process.env.SHIPMENT_SERVICE_HOST ?? 'localhost',
    port: parseInt(process.env.SHIPMENT_SERVICE_PORT ?? '3002', 10),
  },
  notification: {
    host: process.env.NOTIFICATION_SERVICE_HOST ?? 'localhost',
    port: parseInt(process.env.NOTIFICATION_SERVICE_PORT ?? '3003', 10),
  },
}));

export const uploadConfig = registerAs('upload', () => ({
  dir: process.env.UPLOAD_DIR ?? './uploads',
  maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '10', 10),
}));

export const configFactories = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  securityConfig,
  httpConfig,
  microservicesConfig,
  uploadConfig,
];

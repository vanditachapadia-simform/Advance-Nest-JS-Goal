import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppConfigModule } from '../src/config/app-config.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

/**
 * E2E test of the full authentication flow against an in-memory Mongo.
 *
 * Uses a focused test module (Auth + Users + global guards) rather than the full
 * AppModule so it runs without external Redis/BullMQ. The register -> login ->
 * /me -> refresh path is exercised end-to-end through the HTTP layer.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let accessToken: string;
  let refreshToken: string;

  const credentials = { email: 'e2e.user@example.com', password: 'P@ssw0rd!' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        MongooseModule.forRoot(mongod.getUri()),
        EventEmitterModule.forRoot(),
        AuthModule,
        UsersModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    // Re-bind guards through the app's reflector (APP_GUARD already does this).
    void app.get(Reflector);
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongod?.stop();
  });

  it('POST /api/v1/auth/register creates an account and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ firstName: 'E2E', lastName: 'User', ...credentials })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('POST /api/v1/auth/login returns a token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    expect(accessToken).toBeDefined();
  });

  it('GET /api/v1/users/me requires a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('GET /api/v1/users/me returns the profile with a valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // This focused module omits the global TransformInterceptor, so the body is
    // the raw (serialized) user document.
    expect(res.body.email).toBe(credentials.email);
  });

  it('POST /api/v1/auth/refresh rotates the token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('status', 'ok');
          expect(res.body.data).toHaveProperty('service');
        });
    });

    it('/version (GET) - should return version info', () => {
      return request(app.getHttpServer())
        .get('/version')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('version');
          expect(res.body.data).toHaveProperty('apiVersion');
        });
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'Test@12345',
      firstName: 'Test',
      lastName: 'User',
      position: 'Developer',
    };

    let accessToken: string;

    it('/auth/register (POST) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe(testUser.email);
        });
    });

    it('/auth/login (POST) - should login user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          accessToken = res.body.data.accessToken;
        });
    });

    it('/auth/profile (GET) - should return user profile', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('email', testUser.email);
        });
    });

    it('/auth/profile (GET) - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});

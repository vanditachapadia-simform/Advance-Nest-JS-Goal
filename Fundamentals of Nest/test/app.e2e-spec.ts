import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * CONCEPT #12: Testing (e2e).
 *
 * Boots the real application (Apollo + Prisma) and drives the shopping flow
 * through GraphQL over HTTP. Requires a migrated + seeded dev.db
 * (npm run prisma:migrate && npm run prisma:seed).
 */
describe('Shopping flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = (query: string, headers: Record<string, string> = {}) =>
    request(app.getHttpServer())
      .post('/graphql')
      .set({ 'x-user-id': '1', ...headers })
      .send({ query });

  it('lists the seeded catalog', async () => {
    const res = await gql(`{ products { id name priceCents } }`);
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  it('adds to cart then checks out (circular dep + discounts + async payment)', async () => {
    await gql(`mutation { addToCart(productId: 1, qty: 1) { id subtotalCents } }`);
    const res = await gql(
      `mutation { checkout { id status totalCents appliedDiscounts items { qty } } }`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.checkout.status).toBe('paid');
    expect(res.body.data.checkout.totalCents).toBeGreaterThan(0);
  });

  it('blocks the admin-only report for a customer (execution-context guard)', async () => {
    const res = await gql(`{ salesReport { totalOrders } }`, { 'x-user-role': 'customer' });
    expect(res.body.errors).toBeDefined();
  });

  it('allows the admin-only report for an admin (lazy module load)', async () => {
    const res = await gql(`{ salesReport { totalOrders totalRevenueCents } }`, {
      'x-user-role': 'admin',
    });
    expect(res.body.data.salesReport.totalOrders).toBeGreaterThanOrEqual(1);
  });
});

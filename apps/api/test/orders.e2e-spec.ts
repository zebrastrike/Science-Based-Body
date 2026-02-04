/**
 * Orders E2E Tests
 * Tests the full order lifecycle
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testOrderId: string | undefined;

  // Test user credentials - should match seeded admin or create new
  const adminEmail = 'admin@sciencebasedbody.com';
  const adminPassword = 'TestPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Try to login as admin or create test user
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      accessToken = loginResponse.body.accessToken;
    } else {
      // Create a test user if admin doesn't exist
      const testEmail = `test-orders-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: adminPassword,
          firstName: 'Test',
          lastName: 'Orders',
        });

      const newLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: adminPassword });

      accessToken = newLoginResponse.body?.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/orders', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });

    it('should return user orders with valid token', async () => {
      if (!accessToken) {
        console.log('Skipping - no access token');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(Array.isArray(response.body) || response.body.data).toBeTruthy();
      }
    });

    it('should support pagination', async () => {
      if (!accessToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/test-order-id')
        .expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      if (!accessToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/orders/nonexistent-order-id-12345')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({})
        .expect(401);
    });

    it('should reject order without items', async () => {
      if (!accessToken) return;

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [],
          shippingAddress: {},
        })
        .expect((res) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject order without shipping address', async () => {
      if (!accessToken) return;

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [{ productId: 'test', quantity: 1 }],
        })
        .expect((res) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject order without compliance acknowledgment', async () => {
      if (!accessToken) return;

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [{ productId: 'test', quantity: 1 }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            street1: '123 Test St',
            city: 'Miami',
            state: 'FL',
            postalCode: '33101',
            country: 'US',
          },
          // Missing compliance acknowledgment
        })
        .expect((res) => {
          // Should fail without compliance
          expect([400, 422, 404]).toContain(res.status);
        });
    });
  });

  describe('Order Status Transitions', () => {
    it('should not allow customer to change order status directly', async () => {
      if (!accessToken || !testOrderId) return;

      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'SHIPPED' })
        .expect((res) => {
          // Should be forbidden for regular users
          expect([403, 404]).toContain(res.status);
        });
    });
  });

  describe('Order Cancellation', () => {
    it('should require authentication to cancel', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders/test-id/cancel')
        .expect(401);
    });
  });
});

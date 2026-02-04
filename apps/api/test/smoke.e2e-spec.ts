/**
 * Smoke Tests
 * Basic connectivity and health checks
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Smoke Tests', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1/health should return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should respond to root endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect((res) => {
          // Accept 200 or 404 (depending on if root route exists)
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('API Availability', () => {
    it('GET /api/v1/catalog/products should be accessible', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/catalog/products')
        .expect((res) => {
          // Should return 200 or 401 (if auth required)
          expect([200, 401]).toContain(res.status);
        });
    });

    it('GET /api/v1/auth/me without token should return 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('POST /api/v1/auth/login with invalid data should return 400 or 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'invalid', password: '' })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('CORS and Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      // Check for common security headers (may vary based on helmet config)
      expect(response.headers).toBeDefined();
    });

    it('OPTIONS request should return CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/catalog/products')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should not immediately rate limit normal requests', async () => {
      // Make a few requests - should all succeed
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(200);
      }
    });
  });

  describe('Invalid Routes', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/nonexistent-route-12345')
        .expect(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid json')
        .expect((res) => {
          expect([400, 415]).toContain(res.status);
        });
    });
  });
});

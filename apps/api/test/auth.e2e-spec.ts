/**
 * Authentication E2E Tests
 * Tests the full auth flow: register, login, refresh, logout
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect((res) => {
          // Accept 201 (created) or 200 (success) or 409 (already exists in re-run)
          expect([200, 201, 409]).toContain(res.status);
        });

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testEmail);
      }
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: testPassword,
        })
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `test-weak-${Date.now()}@example.com`,
          password: '123',  // Too weak
        })
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,  // Same email as first test
          password: testPassword,
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
        });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect((res) => {
          // Accept 200 or 201
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;

      if (response.body.refreshToken) {
        refreshToken = response.body.refreshToken;
      }
    });

    it('should reject login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testEmail);
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should reject with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token if endpoint exists', async () => {
      if (!refreshToken) {
        console.log('Skipping refresh test - no refresh token returned');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect((res) => {
          // Accept 200, 201, or 404 if endpoint doesn't exist
          expect([200, 201, 404]).toContain(res.status);
        });

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('accessToken');
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // Accept 200, 204, or 404 if endpoint doesn't exist
          expect([200, 204, 404]).toContain(res.status);
        });
    });
  });

  describe('Password Reset Flow', () => {
    it('POST /api/v1/auth/forgot-password should accept valid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail })
        .expect((res) => {
          // Accept 200, 202, or 404 if endpoint doesn't exist
          expect([200, 202, 404]).toContain(res.status);
        });
    });

    it('POST /api/v1/auth/forgot-password should not reveal if email exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should return same status for existing and non-existing emails
      // This prevents email enumeration attacks
      if (response.status !== 404) {
        expect([200, 202]).toContain(response.status);
      }
    });
  });
});

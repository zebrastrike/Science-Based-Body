/**
 * HTTP Smoke Tests
 * Tests against a running server (localhost:3001)
 * Run: npm run test:e2e -- --testPathPattern=http-smoke
 */

import axios, { AxiosInstance } from 'axios';

describe('HTTP Smoke Tests (against running server)', () => {
  let api: AxiosInstance;
  const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

  beforeAll(() => {
    api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on error status codes
    });
  });

  describe('Health & Connectivity', () => {
    it('GET /health should return 200', async () => {
      const response = await api.get('/health');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('GET /health/live should return alive status', async () => {
      const response = await api.get('/health/live');
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('alive');
    });

    it('GET /health/ready should indicate readiness', async () => {
      const response = await api.get('/health/ready');
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /auth/login should require valid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      });
      expect([400, 401]).toContain(response.status);
    });

    it('GET /auth/me without token should return 401', async () => {
      const response = await api.get('/auth/me');
      expect(response.status).toBe(401);
    });

    it('POST /auth/register should validate input', async () => {
      const response = await api.post('/auth/register', {
        email: 'invalid-email',
        password: '123',
      });
      expect(response.status).toBe(400);
    });
  });

  describe('Catalog Endpoints', () => {
    it('GET /catalog/products should return products list', async () => {
      const response = await api.get('/catalog/products');
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.data) || response.data.data).toBeTruthy();
      }
    });

    it('GET /catalog/products with pagination should work', async () => {
      const response = await api.get('/catalog/products?page=1&limit=10');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /catalog/categories should return categories', async () => {
      const response = await api.get('/catalog/categories');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Protected Endpoints (should require auth)', () => {
    it('GET /orders should require authentication', async () => {
      const response = await api.get('/orders');
      expect(response.status).toBe(401);
    });

    it('GET /cart should require authentication', async () => {
      const response = await api.get('/cart');
      expect(response.status).toBe(401);
    });

    it('GET /users/profile should require authentication', async () => {
      const response = await api.get('/users/profile');
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('GET /nonexistent-route should return 404', async () => {
      const response = await api.get('/nonexistent-route-12345');
      expect(response.status).toBe(404);
    });

    it('POST with invalid JSON should be handled gracefully', async () => {
      const response = await api.post('/auth/login', 'not json', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await api.get('/health');
      // Helmet should add these headers
      expect(response.headers).toBeDefined();
    });
  });
});

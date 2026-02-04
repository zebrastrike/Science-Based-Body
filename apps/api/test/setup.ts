/**
 * E2E Test Setup
 * Runs before all tests
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export {};

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Test utilities - exported for use in tests
export const testUtils = {
  // Generate random email for test users
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,

  // Generate random order number
  randomOrderNumber: () => `TEST-${Date.now()}`,

  // Wait helper
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Clean up after all tests
afterAll(async () => {
  // Allow pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
});

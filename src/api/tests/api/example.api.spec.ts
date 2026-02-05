/**
 * Example API Test using Playwright
 * Demonstrates best practices for API testing with the enhanced configuration
 */
import { expect, test } from '@playwright/test';

test.describe('Health API', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });
});

test.describe('Search API', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should return 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: {
        query: 'test',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should validate request body', async ({ request }) => {
    // First authenticate (you'll need to implement this)
    // const authResponse = await request.post('/api/auth/login', {...});
    // const token = (await authResponse.json()).token;

    const response = await request.post('/api/search', {
      data: {
        // Missing required 'query' field
        limit: 10,
      },
      // headers: { Authorization: `Bearer ${token}` }
    });

    // Should get validation error
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('validation');
  });
});

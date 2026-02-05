/**
 * Comprehensive API Integration Tests
 * Tests authentication, chat, search, and error handling
 */
import { expect, test } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

let authToken: string;
let testUserId: string;

test.describe('Authentication API', () => {
  test('should register a new user', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        email,
        password,
        name: 'Test User',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data.user).toHaveProperty('email', email);

    authToken = data.token;
    testUserId = data.user.id;
  });

  test('should login with valid credentials', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Register first
    await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: { email, password, name: 'Test User' },
    });

    // Login
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: { email, password },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data.user).toHaveProperty('email', email);
  });

  test('should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should validate password requirements', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: '123', // Too short
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

test.describe('Chat API', () => {
  test.beforeAll(async ({ request }) => {
    // Create test user and get token
    const email = `test-chat-${Date.now()}@example.com`;
    const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        email,
        password: 'TestPassword123!',
        name: 'Chat Test User',
      },
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/chat`, {
      data: {
        message: 'Hello',
        sessionId: 'test-session',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should send non-streaming chat message', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/chat`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        message: 'What is 2+2?',
        sessionId: 'test-session',
        stream: false,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('should validate message input', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/chat`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        message: '', // Empty message
        sessionId: 'test-session',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should handle streaming chat', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/chat`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        message: 'Count to 3',
        sessionId: 'test-session',
        stream: true,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/event-stream');

    // Verify we receive streaming data
    const body = await response.text();
    expect(body).toContain('data:');
  });
});

test.describe('Search API', () => {
  test.beforeAll(async ({ request }) => {
    // Create test user and get token
    const email = `test-search-${Date.now()}@example.com`;
    const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        email,
        password: 'TestPassword123!',
        name: 'Search Test User',
      },
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/search`, {
      data: {
        query: 'test',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should perform semantic search', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/search`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        query: 'machine learning',
        limit: 10,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.results)).toBeTruthy();
    expect(data).toHaveProperty('query', 'machine learning');
  });

  test('should validate search query', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/search`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        query: '', // Empty query
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should respect result limit', async ({ request }) => {
    const limit = 5;
    const response = await request.post(`${API_BASE_URL}/api/search`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        query: 'test query',
        limit,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.results.length).toBeLessThanOrEqual(limit);
  });
});

test.describe('Health Check API', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });
});

test.describe('Rate Limiting', () => {
  test('should enforce rate limits', async ({ request }) => {
    const email = `test-rate-${Date.now()}@example.com`;

    // Try to register many times
    const requests = Array.from({ length: 10 }, () =>
      request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          email,
          password: 'TestPassword123!',
          name: 'Rate Test User',
        },
      })
    );

    const responses = await Promise.all(requests);

    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);

    // Check rate limit headers
    const limitedResponse = rateLimited[0];
    expect(limitedResponse.headers()).toHaveProperty('x-ratelimit-limit');
    expect(limitedResponse.headers()).toHaveProperty('retry-after');
  });
});

test.describe('Error Handling', () => {
  test('should return 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/nonexistent`);
    expect(response.status()).toBe(404);
  });

  test('should handle malformed JSON', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'invalid json{',
    });

    expect(response.status()).toBe(400);
  });

  test('should validate request schema', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        // Missing required fields
        invalid: 'data',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

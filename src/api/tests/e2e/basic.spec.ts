import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DEMO_EMAIL = 'demomaster@pendoah.ai';
const DEMO_PASSWORD = 'Pendoah1225';

test.describe('Synapse Basic E2E Tests', () => {
  test('API Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('service');
    expect(data.service).toBe('Synapse API');
  });

  test('API Login Endpoint', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('email', DEMO_EMAIL);
    expect(data).toHaveProperty('token');
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
  });

  test('API Login with Invalid Credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(false);
  });

  test('Protected API Route Requires Authentication', async ({ request }) => {
    // Try to access protected route without token
    const response = await request.get(`${API_BASE_URL}/api/index-status`);
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Authentication required');
  });

  test('Protected API Route with Valid Token', async ({ request }) => {
    // First, login to get a token
    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Now try to access protected route with token
    const protectedResponse = await request.get(`${API_BASE_URL}/api/index-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(protectedResponse.ok()).toBeTruthy();
    const protectedData = await protectedResponse.json();
    expect(protectedData).toHaveProperty('hasIndex');
    expect(typeof protectedData.hasIndex).toBe('boolean');
  });

  test('Frontend Login Flow', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for login page to load
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', DEMO_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for navigation or dashboard to appear
    // The app should redirect after successful login
    await page.waitForTimeout(2000);
    
    // Check if we're logged in (look for user email or dashboard elements)
    const isLoggedIn = await page.evaluate(() => {
      return localStorage.getItem('synapse_auth_token') !== null;
    });
    
    expect(isLoggedIn).toBeTruthy();
  });

  test('Error Boundary Test', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Try to trigger an error by accessing a non-existent route or causing an error
    // This is a basic test - in a real scenario, you'd have a component that throws an error
    await page.evaluate(() => {
      // Simulate an error by trying to access a property that doesn't exist
      // This won't actually trigger the error boundary, but demonstrates the test structure
      console.log('Error boundary test placeholder');
    });
    
    // In a real test, you would:
    // 1. Navigate to a page with a component that can throw an error
    // 2. Trigger the error condition
    // 3. Verify the error boundary UI appears

  });
});

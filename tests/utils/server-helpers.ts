import { APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:3001';

/**
 * Server health check utilities
 */

export async function checkServerHealth(apiContext: APIRequestContext): Promise<boolean> {
  try {
    const response = await apiContext.get('/');
    return response.status() === 200 || response.status() === 404; // 404 is OK for root in production
  } catch {
    return false;
  }
}

export async function checkIndexStatus(apiContext: APIRequestContext): Promise<{ hasIndex: boolean; count: number }> {
  try {
    const response = await apiContext.get('/api/index-status');
    if (response.ok()) {
      return await response.json();
    }
    return { hasIndex: false, count: 0 };
  } catch {
    return { hasIndex: false, count: 0 };
  }
}

export async function testSemanticSearchEmpty(apiContext: APIRequestContext): Promise<{ status: number; error: string }> {
  try {
    const response = await apiContext.post('/api/semantic-search', {
      data: { query: 'test query' },
    });
    const data = await response.json();
    return {
      status: response.status(),
      error: data.error || '',
    };
  } catch (error: any) {
    return {
      status: 500,
      error: error.message || 'Unknown error',
    };
  }
}

export async function testAnalyzeEndpoint(apiContext: APIRequestContext, filePath: string): Promise<{ status: number; error?: string }> {
  try {
    const response = await apiContext.post('/api/analyze', {
      data: { filePath },
    });
    const data = await response.json();
    return {
      status: response.status(),
      error: data.message || data.error,
    };
  } catch (error: any) {
    return {
      status: 500,
      error: error.message || 'Unknown error',
    };
  }
}


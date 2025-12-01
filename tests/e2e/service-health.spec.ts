import { test, expect } from '../fixtures';
import { checkServerHealth, checkIndexStatus, testSemanticSearchEmpty, testAnalyzeEndpoint } from '../utils/server-helpers';

/**
 * Service Health Checks (SVC-01 to SVC-04)
 * These tests validate backend prerequisites before running UI tests
 */

test.describe('Service Health Checks', () => {
  test('SVC-01: Base Server Health', async ({ apiContext }) => {
    const isHealthy = await checkServerHealth(apiContext);
    expect(isHealthy).toBe(true);
  });

  test('SVC-02: AI Embedding Connection', async ({ apiContext }) => {
    const result = await testSemanticSearchEmpty(apiContext);
    
    // Should return 400 with "Index is empty" error (proves service is running)
    expect(result.status).toBe(400);
    expect(result.error.toLowerCase()).toContain('index');
  });

  test('SVC-03: AI Chat/Analysis Connection', async ({ apiContext }) => {
    // Test with non-existent file path
    const result = await testAnalyzeEndpoint(apiContext, '/tmp/nonexistent-file.txt');
    
    // Should return 500 with file system error (proves endpoint structure is correct)
    expect(result.status).toBe(500);
    expect(result.error).toBeTruthy();
  });

  test('SVC-04: In-Memory Persistence', async ({ apiContext, mockFilesDir }) => {
    // First, create an index
    const indexResponse = await apiContext.post('/api/index-files', {
      data: {
        baseDirectories: [{ path: mockFilesDir }],
      },
    });

    // Read the stream response
    const reader = indexResponse.body();
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) chunks.push(value);
    }

    // Check that indexing completed
    const finalData = Buffer.concat(chunks).toString();
    expect(finalData).toContain('"status":"complete"');

    // Verify index status
    const status = await checkIndexStatus(apiContext);
    expect(status.hasIndex).toBe(true);
    expect(status.count).toBeGreaterThan(0);
  });
});


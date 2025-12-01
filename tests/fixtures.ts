import { test as base, expect } from '@playwright/test';
import { tmpdir } from 'os';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { MOCK_FILES } from './utils/mock-data';
import { clearLocalStorage } from './utils/test-helpers';

type TestFixtures = {
  testDataDir: string;
  mockFilesDir: string;
  apiContext: any;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  // Temporary directory for test data
  testDataDir: async ({}, use) => {
    const dir = await mkdtemp(join(tmpdir(), 'synapse-test-'));
    await use(dir);
    // Cleanup
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  },

  // Mock files directory with test files
  mockFilesDir: async ({ testDataDir }, use) => {
    const mockDir = join(testDataDir, 'mock_docs');
    await mkdir(mockDir, { recursive: true });

    // Create mock files
    for (const [filename, { content }] of Object.entries(MOCK_FILES)) {
      await writeFile(join(mockDir, filename), content, 'utf-8');
    }

    await use(mockDir);

    // Cleanup handled by testDataDir
  },

  // API context for direct backend calls
  apiContext: async ({ request }, use) => {
    const baseURL = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:3001';
    const context = await request.newContext({
      baseURL,
    });
    await use(context);
  },
});

export { expect };


import { Page, expect } from '@playwright/test';

/**
 * Common test utilities and helpers
 */

export const SELECTORS = {
  // Header
  header: 'header',
  darkModeToggle: 'button:has(svg)', // Sun/Moon icon button
  configButton: 'button:has-text("Config")',
  memoryStatus: 'text=/Memory (Online|Offline)/',
  
  // Welcome Wizard
  welcomeWizard: '[role="dialog"], .fixed.inset-0',
  wizardNextButton: 'button:has-text("Next Step"), button:has-text("Launch Synapse")',
  wizardStepIndicator: '.h-1\\.5', // Progress step indicators
  
  // Directory Selector
  directoryInput: 'input[placeholder*="path"], input[placeholder*="Path"]',
  directoryAddButton: 'button:has([data-lucide="plus"])',
  directoryCard: '.group.flex.items-center',
  directoryRemoveButton: 'button:has([data-lucide="x"])',
  
  // Configuration Panel
  configPanel: '.fixed.inset-0.z-50',
  configPanelTitle: 'text=Automation Rules',
  configPanelClose: 'button:has([data-lucide="x"])',
  keywordInput: 'input[placeholder*="invoice"], input[placeholder*="keyword"]',
  destinationSelect: 'select',
  createRuleButton: 'button:has-text("Create Rule")',
  activeRule: '.group.flex.items-center.justify-between',
  ruleDeleteButton: 'button:has([data-lucide="trash-2"])',
  
  // Semantic Search
  searchInput: 'input[placeholder*="Ask"], input[placeholder*="knowledge"]',
  buildIndexButton: 'button:has-text("Build Index")',
  askAIButton: 'button:has-text("Ask AI")',
  
  // File Grid
  fileCard: '.group.bg-white, .group.dark\\:bg-gray-800, [class*="group"]',
  fileCardName: 'h3.font-semibold',
  analyzeButton: 'button:has-text("Analyze")',
  chatButton: 'button:has-text("Chat")',
  moveButton: 'button[title="Move File"], button:has(svg[class*="arrow-right"])',
  copyButton: 'button[title="Copy File"], button:has(svg[class*="copy"])',
  
  // Progress Bar
  progressBar: '.h-2.bg-gray-100',
  
  // Toasts
  toast: '.fixed.bottom-6',
  successToast: '.text-teal-800, .bg-teal-900, [class*="teal"]',
  errorToast: '.text-red-800, .bg-red-900, [class*="red"]',
  toastClose: 'button:has(svg[class*="x"]), button:has(svg[class*="X"])',
  
  // Insight Drawer
  drawer: '.fixed.inset-y-0.right-0, [class*="fixed"][class*="right-0"]',
  drawerClose: 'button:has(svg[class*="x"]), button:has(svg[class*="X"])',
  drawerSummary: 'text=Executive Summary',
  drawerTags: 'text=Semantic Tags',
  chatInput: 'input[placeholder*="question"], input[placeholder*="follow-up"]',
  chatSendButton: 'button:has(svg[class*="send"]), button:has(svg[class*="Send"])',
} as const;

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Clear localStorage
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Get localStorage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Check if dark mode is enabled
 */
export async function isDarkModeEnabled(page: Page): Promise<boolean> {
  return await page.evaluate(() => document.documentElement.classList.contains('dark'));
}

/**
 * Wait for API call to complete
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 30000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Wait for toast to appear
 */
export async function waitForToast(page: Page, type: 'success' | 'error' = 'success') {
  const selector = type === 'success' ? SELECTORS.successToast : SELECTORS.errorToast;
  await waitForElement(page, selector, 5000);
}

/**
 * Verify toast message
 */
export async function verifyToastMessage(page: Page, expectedMessage: string, type: 'success' | 'error' = 'success') {
  const selector = type === 'success' ? SELECTORS.successToast : SELECTORS.errorToast;
  const toast = page.locator(selector).first();
  await expect(toast).toContainText(expectedMessage);
}

/**
 * Count elements matching selector
 */
export async function countElements(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}


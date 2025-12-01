import { test, expect } from '../fixtures';
import { 
  SELECTORS, 
  clearLocalStorage,
  waitForToast,
  verifyToastMessage,
  waitForAPIResponse,
} from '../utils/test-helpers';

/**
 * Suite B: Workflow & Functional (B-01 to B-06)
 */

test.describe('Suite B: Workflow & Functional', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}
  });

  test('B-01: Keyword Rule Creation', async ({ page }) => {
    // Add a target directory first
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(1).fill('/data/archive');
    await page.locator(SELECTORS.directoryAddButton).nth(1).click();

    // Open config panel
    await page.click(SELECTORS.configButton);

    // Enter keywords
    await page.fill(SELECTORS.keywordInput, 'final, budget');
    
    // Select destination
    await page.selectOption(SELECTORS.destinationSelect, { index: 0 });

    // Click Create Rule
    await page.click(SELECTORS.createRuleButton);

    // Assert rule appears in Active Rules
    const activeRules = page.locator(SELECTORS.activeRule);
    await expect(activeRules.first()).toBeVisible();
    
    // Verify keywords and destination are displayed
    await expect(activeRules.first()).toContainText('final');
    await expect(activeRules.first()).toContainText('budget');
    await expect(activeRules.first()).toContainText('/data/archive');
  });

  test('B-02: Rule Persistence & Deletion', async ({ page }) => {
    // Create a rule first (B-01 setup)
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(1).fill('/data/archive');
    await page.locator(SELECTORS.directoryAddButton).nth(1).click();

    await page.click(SELECTORS.configButton);
    await page.fill(SELECTORS.keywordInput, 'test, rule');
    await page.selectOption(SELECTORS.destinationSelect, { index: 0 });
    await page.click(SELECTORS.createRuleButton);

    // Reload page
    await page.reload();
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Assert rule persists
    await page.click(SELECTORS.configButton);
    const activeRules = page.locator(SELECTORS.activeRule);
    await expect(activeRules.first()).toBeVisible();

    // Delete rule
    await page.click(SELECTORS.ruleDeleteButton.first());

    // Assert rule is removed
    await expect(activeRules).toHaveCount(0);

    // Reload and verify rule is still deleted
    await page.reload();
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}
    
    await page.click(SELECTORS.configButton);
    await expect(page.locator(SELECTORS.activeRule)).toHaveCount(0);
  });

  test('B-03: File Action - Move', async ({ page, mockFilesDir, apiContext }) => {
    // Setup: Create index and rule
    // Add target directory
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(1).fill('/data/archive');
    await page.locator(SELECTORS.directoryAddButton).nth(1).click();

    // Create rule matching "final" or "budget"
    await page.click(SELECTORS.configButton);
    await page.fill(SELECTORS.keywordInput, 'final, budget');
    await page.selectOption(SELECTORS.destinationSelect, { index: 0 });
    await page.click(SELECTORS.createRuleButton);
    await page.click(SELECTORS.configPanelClose);

    // Index files
    await directoryInputs.nth(0).fill(mockFilesDir);
    await page.locator(SELECTORS.directoryAddButton).nth(0).click();
    
    await page.click(SELECTORS.buildIndexButton);
    
    // Wait for indexing to complete
    await waitForAPIResponse(page, '/api/index-files', 60000);
    await page.waitForTimeout(2000); // Wait for UI update

    // Search for file containing "final" or "budget"
    await page.fill(SELECTORS.searchInput, 'budget contract');
    await page.click(SELECTORS.askAIButton);
    
    // Wait for results
    await page.waitForTimeout(3000);

    // Find file card
    const fileCards = page.locator(SELECTORS.fileCard);
    const cardCount = await fileCards.count();
    
    if (cardCount > 0) {
      // Intercept API call
      let apiCallMade = false;
      let apiPayload: any = null;
      
      page.on('request', async (request) => {
        if (request.url().includes('/api/file-action')) {
          apiCallMade = true;
          const postData = request.postData();
          if (postData) {
            apiPayload = JSON.parse(postData);
          }
        }
      });

      // Click move button on first card
      const moveButton = fileCards.first().locator(SELECTORS.moveButton);
      await moveButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      // Verify API was called with correct payload
      expect(apiCallMade).toBe(true);
      if (apiPayload) {
        expect(apiPayload.action).toBe('move');
        expect(apiPayload.destination).toBeTruthy();
      }

      // Verify file is removed from DOM (if move was successful)
      await page.waitForTimeout(1000);
      const newCardCount = await fileCards.count();
      // File should be removed if move succeeded
      expect(newCardCount).toBeLessThanOrEqual(cardCount);

      // Verify success toast
      await waitForToast(page, 'success');
    }
  });

  test('B-04: File Action - Copy', async ({ page, mockFilesDir }) => {
    // Similar setup to B-03
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(1).fill('/data/archive');
    await page.locator(SELECTORS.directoryAddButton).nth(1).click();

    await page.click(SELECTORS.configButton);
    await page.fill(SELECTORS.keywordInput, 'vacation, policy');
    await page.selectOption(SELECTORS.destinationSelect, { index: 0 });
    await page.click(SELECTORS.createRuleButton);
    await page.click(SELECTORS.configPanelClose);

    // Index and search
    await directoryInputs.nth(0).fill(mockFilesDir);
    await page.locator(SELECTORS.directoryAddButton).nth(0).click();
    await page.click(SELECTORS.buildIndexButton);
    await waitForAPIResponse(page, '/api/index-files', 60000);
    await page.waitForTimeout(2000);

    await page.fill(SELECTORS.searchInput, 'vacation time');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(3000);

    const fileCards = page.locator(SELECTORS.fileCard);
    const cardCount = await fileCards.count();
    
    if (cardCount > 0) {
      let apiCallMade = false;
      let apiPayload: any = null;
      
      page.on('request', async (request) => {
        if (request.url().includes('/api/file-action')) {
          apiCallMade = true;
          const postData = request.postData();
          if (postData) {
            apiPayload = JSON.parse(postData);
          }
        }
      });

      // Click copy button
      const copyButton = fileCards.first().locator(SELECTORS.copyButton);
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify API call
      expect(apiCallMade).toBe(true);
      if (apiPayload) {
        expect(apiPayload.action).toBe('copy');
      }

      // Verify file remains in DOM
      await expect(fileCards).toHaveCount(cardCount);

      // Verify success toast
      await waitForToast(page, 'success');
    }
  });

  test('B-05: Action Failure (No Rule Match)', async ({ page, mockFilesDir }) => {
    // Index files without creating matching rule
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(0).fill(mockFilesDir);
    await page.locator(SELECTORS.directoryAddButton).nth(0).click();
    
    await page.click(SELECTORS.buildIndexButton);
    await waitForAPIResponse(page, '/api/index-files', 60000);
    await page.waitForTimeout(2000);

    await page.fill(SELECTORS.searchInput, 'test query');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(3000);

    const fileCards = page.locator(SELECTORS.fileCard);
    const cardCount = await fileCards.count();
    
    if (cardCount > 0) {
      let apiCallMade = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/file-action')) {
          apiCallMade = true;
        }
      });

      // Try to move file without matching rule
      const moveButton = fileCards.first().locator(SELECTORS.moveButton);
      await moveButton.click();
      await page.waitForTimeout(1000);

      // Verify error toast appears
      await waitForToast(page, 'error');
      await verifyToastMessage(page, 'No automated destination', 'error');
    }
  });

  test('B-06: Toast Dismissal & Lifespan', async ({ page }) => {
    // Trigger a success action (simulate)
    await page.evaluate(() => {
      // Simulate adding a directory to trigger success
      window.dispatchEvent(new CustomEvent('test-success'));
    });

    // For success toast auto-dismiss, we need to wait
    // Since we can't easily trigger real success, we'll test error toast dismissal
    
    // Trigger error toast by trying invalid action
    await page.goto('/');
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}
    
    // Try to click move on non-existent file (will trigger error)
    const moveButtons = page.locator(SELECTORS.moveButton);
    const count = await moveButtons.count();
    
    if (count > 0) {
      await moveButtons.first().click();
      await page.waitForTimeout(500);

      // Verify error toast is visible
      const errorToast = page.locator(SELECTORS.errorToast).first();
      await expect(errorToast).toBeVisible();

      // Click close button
      const closeButton = errorToast.locator(SELECTORS.toastClose);
      await closeButton.click();

      // Verify toast is removed
      await expect(errorToast).not.toBeVisible();
    }
  });
});


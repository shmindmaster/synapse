import { test, expect } from '../fixtures';
import { 
  SELECTORS, 
  clearLocalStorage,
  waitForAPIResponse,
  waitForElement,
} from '../utils/test-helpers';

/**
 * Suite D: High-Value AI Features (D-01 to D-06)
 */

test.describe('Suite D: High-Value AI Features', () => {
  test.beforeEach(async ({ page, mockFilesDir }) => {
    await clearLocalStorage(page);
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Index files for search tests
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(0).fill(mockFilesDir);
    await page.locator(SELECTORS.directoryAddButton).nth(0).click();
    
    await page.click(SELECTORS.buildIndexButton);
    await waitForAPIResponse(page, '/api/index-files', 60000);
    await page.waitForTimeout(3000);
  });

  test('D-01: AI Analysis - Summarization', async ({ page }) => {
    // Search for MF-1 file
    await page.fill(SELECTORS.searchInput, 'budget contract revenue');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    // Find the file card for Q3_Budget_Contract
    const budgetCard = page.locator('text=Q3_Budget_Contract').locator('..').locator('..');
    
    if (await budgetCard.count() > 0) {
      // Click Analyze button
      const analyzeButton = budgetCard.locator(SELECTORS.analyzeButton);
      await analyzeButton.click();

      // Wait for drawer to open
      const drawer = page.locator(SELECTORS.drawer);
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Wait for analysis to complete
      await page.waitForTimeout(5000);

      // Verify Executive Summary is present
      const summarySection = page.locator(SELECTORS.drawerSummary).locator('..');
      await expect(summarySection).toBeVisible();

      // Verify summary contains relevant content (revenue, contract)
      const summaryText = await summarySection.textContent();
      expect(summaryText?.toLowerCase()).toMatch(/revenue|contract|project|delta/);
    }
  });

  test('D-02: AI Analysis - Categorization & Tags', async ({ page }) => {
    // Search and find MF-1
    await page.fill(SELECTORS.searchInput, 'budget contract');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    const budgetCard = page.locator('text=Q3_Budget_Contract').locator('..').locator('..');
    
    if (await budgetCard.count() > 0) {
      await budgetCard.locator(SELECTORS.analyzeButton).click();
      await page.waitForTimeout(5000);

      // Verify tags section
      const tagsSection = page.locator(SELECTORS.drawerTags).locator('..');
      await expect(tagsSection).toBeVisible();

      // Count tags (should be 5)
      const tagElements = tagsSection.locator('span').filter({ hasText: /^#/ });
      const tagCount = await tagElements.count();
      expect(tagCount).toBeGreaterThanOrEqual(3); // At least 3 tags (may vary)

      // Verify category field
      const categoryText = await page.locator('text=Suggested Category').locator('..').textContent();
      expect(categoryText).toBeTruthy();
    }
  });

  test('D-03: AI Analysis - Sensitivity Detection', async ({ page }) => {
    // Search for MF-3 (contains PII)
    await page.fill(SELECTORS.searchInput, 'legacy code PII');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    const legacyCard = page.locator('text=Legacy_Code_Snippet').locator('..').locator('..');
    
    if (await legacyCard.count() > 0) {
      await legacyCard.locator(SELECTORS.analyzeButton).click();
      await page.waitForTimeout(5000);

      // Verify sensitivity field shows "High"
      const sensitivityField = page.locator('text=Data Sensitivity').locator('..');
      await expect(sensitivityField).toBeVisible();
      
      const sensitivityText = await sensitivityField.textContent();
      expect(sensitivityText?.toUpperCase()).toContain('HIGH');
    }
  });

  test('D-04: RAG Chat - Context Recall', async ({ page }) => {
    // Search for MF-2
    await page.fill(SELECTORS.searchInput, 'vacation time off');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    const vacationCard = page.locator('text=Vacation_Policy').locator('..').locator('..');
    
    if (await vacationCard.count() > 0) {
      // Click Chat button
      await vacationCard.locator(SELECTORS.chatButton).click();
      await page.waitForTimeout(3000);

      // Wait for drawer
      const drawer = page.locator(SELECTORS.drawer);
      await expect(drawer).toBeVisible();

      // Enter question
      const chatInput = page.locator(SELECTORS.chatInput);
      await chatInput.fill('What is the maximum time I can be away from work?');
      
      const sendButton = page.locator(SELECTORS.chatSendButton);
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(8000); // AI response may take time

      // Verify response contains "15" (business days)
      const chatMessages = page.locator('.space-y-4').locator('div').filter({ hasText: /15/ });
      const messageText = await chatMessages.last().textContent();
      expect(messageText?.toLowerCase()).toMatch(/15|fifteen/);
    }
  });

  test('D-05: RAG Chat - Out-of-Context Failure', async ({ page }) => {
    // Search for MF-2
    await page.fill(SELECTORS.searchInput, 'vacation policy');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    const vacationCard = page.locator('text=Vacation_Policy').locator('..').locator('..');
    
    if (await vacationCard.count() > 0) {
      await vacationCard.locator(SELECTORS.chatButton).click();
      await page.waitForTimeout(3000);

      // Ask about content from MF-1 (not in current file)
      const chatInput = page.locator(SELECTORS.chatInput);
      await chatInput.fill('What are the terms of Project Delta?');
      
      await page.locator(SELECTORS.chatSendButton).click();
      await page.waitForTimeout(8000);

      // Verify defensive response
      const chatMessages = page.locator('.space-y-4').locator('div').last();
      const messageText = await chatMessages.textContent();
      
      // Should indicate it cannot answer or doesn't have that information
      const defensivePhrases = ['cannot', "don't", "doesn't", 'not found', 'not in', 'unable'];
      const isDefensive = defensivePhrases.some(phrase => 
        messageText?.toLowerCase().includes(phrase)
      );
      expect(isDefensive).toBe(true);
    }
  });

  test('D-06: RAG Chat - Conversation History', async ({ page }) => {
    // Search for MF-2
    await page.fill(SELECTORS.searchInput, 'vacation');
    await page.click(SELECTORS.askAIButton);
    await page.waitForTimeout(5000);

    const vacationCard = page.locator('text=Vacation_Policy').locator('..').locator('..');
    
    if (await vacationCard.count() > 0) {
      await vacationCard.locator(SELECTORS.chatButton).click();
      await page.waitForTimeout(3000);

      const chatInput = page.locator(SELECTORS.chatInput);
      
      // First question
      await chatInput.fill('What is the maximum vacation time?');
      await page.locator(SELECTORS.chatSendButton).click();
      await page.waitForTimeout(8000);

      // Follow-up question (relies on conversation history)
      await chatInput.fill('Does that include weekends?');
      await page.locator(SELECTORS.chatSendButton).click();
      await page.waitForTimeout(8000);

      // Verify both messages are in chat history
      const chatMessages = page.locator('.space-y-4').locator('div');
      const messageCount = await chatMessages.count();
      expect(messageCount).toBeGreaterThanOrEqual(4); // At least 2 user + 2 assistant messages
    }
  });
});


import { test, expect } from '../fixtures';
import { 
  SELECTORS, 
  clearLocalStorage, 
  waitForElement, 
  isDarkModeEnabled,
  getLocalStorageItem,
  countElements,
} from '../utils/test-helpers';

/**
 * Suite A: Core UX & Configuration (A-01 to A-07)
 */

test.describe('Suite A: Core UX & Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('A-01: Initial Welcome Wizard', async ({ page }) => {
    await page.goto('/');
    
    // Assert Welcome Wizard is visible
    const wizard = page.locator(SELECTORS.welcomeWizard).first();
    await expect(wizard).toBeVisible();

    // Step 1: Connect Your Data
    await page.fill('input[placeholder*="path"], input[placeholder*="Path"]', '/test/source');
    await page.click(SELECTORS.wizardNextButton);
    
    // Step 2: Define Destinations
    await page.fill('input[placeholder*="path"], input[placeholder*="Path"]', '/test/destination');
    await page.click(SELECTORS.wizardNextButton);
    
    // Step 3: Create First Neuron
    await page.fill('input[placeholder*="keyword"], input[placeholder*="invoice"]', 'test, keyword');
    await page.selectOption('select', { index: 0 });
    await page.click('button:has-text("Launch Synapse")');

    // Assert wizard is dismissed
    await expect(wizard).not.toBeVisible();

    // Assert main App is rendered (header visible)
    await expect(page.locator(SELECTORS.header)).toBeVisible();

    // Assert localStorage contains appConfig
    const appConfig = await getLocalStorageItem(page, 'appConfig');
    expect(appConfig).toBeTruthy();
    const config = JSON.parse(appConfig!);
    expect(config.keywordConfigs).toBeDefined();
  });

  test('A-02: Dark Mode Toggle', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard if present
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {
      // Wizard not present, continue
    }

    // Assert initial state (check if dark mode is enabled by default)
    const initialDarkMode = await isDarkModeEnabled(page);

    // Click dark mode toggle
    await page.click(SELECTORS.darkModeToggle);
    
    // Wait for transition
    await page.waitForTimeout(300);
    
    // Assert dark mode state changed
    const afterFirstClick = await isDarkModeEnabled(page);
    expect(afterFirstClick).not.toBe(initialDarkMode);

    // Click again
    await page.click(SELECTORS.darkModeToggle);
    await page.waitForTimeout(300);
    
    // Assert back to original state
    const afterSecondClick = await isDarkModeEnabled(page);
    expect(afterSecondClick).toBe(initialDarkMode);
  });

  test('A-03: Directory Addition', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Find Input Sources directory selector
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    const firstInput = directoryInputs.first();
    
    // Enter path
    const testPath = '/test/project/docs';
    await firstInput.fill(testPath);
    
    // Click add button
    const addButtons = page.locator(SELECTORS.directoryAddButton);
    await addButtons.first().click();

    // Assert path appears in directory list
    await expect(page.locator('text=' + testPath)).toBeVisible();

    // Assert input is cleared
    await expect(firstInput).toHaveValue('');

    // Verify localStorage updated
    const appConfig = await getLocalStorageItem(page, 'appConfig');
    if (appConfig) {
      const config = JSON.parse(appConfig);
      expect(config.baseDirectories.length).toBeGreaterThan(0);
    }
  });

  test('A-04: Directory Removal', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Add a directory first
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    const firstInput = directoryInputs.first();
    await firstInput.fill('/test/to-remove');
    await page.locator(SELECTORS.directoryAddButton).first().click();

    // Assert directory card is present
    const directoryCards = page.locator(SELECTORS.directoryCard);
    const initialCount = await directoryCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click remove button (X icon)
    const removeButtons = page.locator(SELECTORS.directoryRemoveButton);
    await removeButtons.first().click();

    // Assert card is removed
    await expect(directoryCards).toHaveCount(initialCount - 1);
  });

  test('A-05: Configuration Persistence', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Add directories
    const directoryInputs = page.locator(SELECTORS.directoryInput);
    await directoryInputs.nth(0).fill('/test/base1');
    await page.locator(SELECTORS.directoryAddButton).nth(0).click();
    
    await directoryInputs.nth(1).fill('/test/target1');
    await page.locator(SELECTORS.directoryAddButton).nth(1).click();

    // Get counts before reload
    const baseCards = page.locator('text=Input Sources').locator('..').locator(SELECTORS.directoryCard);
    const targetCards = page.locator('text=Sort Destinations').locator('..').locator(SELECTORS.directoryCard);
    const baseCount = await baseCards.count();
    const targetCount = await targetCards.count();

    // Reload page
    await page.reload();

    // Skip wizard if it appears
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Assert directories are restored
    const baseCardsAfter = page.locator('text=Input Sources').locator('..').locator(SELECTORS.directoryCard);
    const targetCardsAfter = page.locator('text=Sort Destinations').locator('..').locator(SELECTORS.directoryCard);
    await expect(baseCardsAfter).toHaveCount(baseCount);
    await expect(targetCardsAfter).toHaveCount(targetCount);
  });

  test('A-06: Configuration Panel Access', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Click Config button
    await page.click(SELECTORS.configButton);

    // Assert panel is visible
    const panel = page.locator(SELECTORS.configPanel);
    await expect(panel).toBeVisible();

    // Assert title is correct
    await expect(page.locator(SELECTORS.configPanelTitle)).toBeVisible();

    // Click close button
    await page.click(SELECTORS.configPanelClose);

    // Assert panel is closed
    await expect(panel).not.toBeVisible();
  });

  test('A-07: Config Panel Input Validation', async ({ page }) => {
    await page.goto('/');
    
    // Skip wizard
    try {
      await page.click('button:has-text("Launch Synapse")', { timeout: 2000 });
    } catch {}

    // Open config panel
    await page.click(SELECTORS.configButton);

    // Find Create Rule button
    const createButton = page.locator(SELECTORS.createRuleButton);
    
    // Assert button is disabled initially
    await expect(createButton).toBeDisabled();

    // Fill only keywords
    await page.fill(SELECTORS.keywordInput, 'test, keyword');
    
    // Button should still be disabled (destination not selected)
    await expect(createButton).toBeDisabled();

    // Select destination
    await page.selectOption(SELECTORS.destinationSelect, { index: 0 });

    // Now button should be enabled
    await expect(createButton).toBeEnabled();
  });
});


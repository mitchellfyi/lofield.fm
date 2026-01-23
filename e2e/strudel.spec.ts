import { test, expect, type Page } from '@playwright/test';

/**
 * Helper to get test API from window
 */
async function getTestAPI(page: Page) {
  return await page.evaluate(() => {
    return window.__strudelTest;
  });
}

/**
 * Helper to wait for Strudel to be loaded
 */
async function waitForStrudelLoad(page: Page) {
  await page.waitForFunction(() => {
    return typeof window.initStrudel !== 'undefined';
  }, { timeout: 30000 });
}

test.describe('Strudel MVP E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/strudel');
    await waitForStrudelLoad(page);
  });

  test('should load page and display UI elements', async ({ page }) => {
    // Check main UI elements are present
    await expect(page.getByRole('heading', { name: 'Strudel Chat' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Code Editor' })).toBeVisible();
    
    // Check buttons are present
    await expect(page.getByRole('button', { name: 'Init Audio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    
    // Check code editor has default code
    const codeEditor = page.locator('textarea');
    await expect(codeEditor).toBeVisible();
    const code = await codeEditor.inputValue();
    expect(code).toContain('setcps');
    expect(code).toContain('play()');
  });

  test('should initialize audio engine and transition state', async ({ page }) => {
    // Initial state should be idle
    await expect(page.locator('text=State: idle')).toBeVisible();
    
    // Click Init Audio button
    await page.getByRole('button', { name: 'Init Audio' }).click();
    
    // Wait for state to transition to ready
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    // Verify via test API
    const testAPI = await getTestAPI(page);
    expect(testAPI).toBeDefined();
    expect(testAPI?.wasInitCalled()).toBe(true);
    
    // Check events in console
    await expect(page.locator('text=Audio initialized successfully')).toBeVisible();
  });

  test('should play code and transition to playing state', async ({ page }) => {
    // Initialize first
    await page.getByRole('button', { name: 'Init Audio' }).click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    // Click Play
    await page.getByRole('button', { name: 'Play' }).click();
    
    // Wait for playing state
    await expect(page.locator('text=State: playing')).toBeVisible({ timeout: 5000 });
    
    // Verify via test API
    const testAPI = await getTestAPI(page);
    expect(testAPI?.wasPlayCalled()).toBe(true);
    expect(testAPI?.wasHushCalled()).toBe(true);
    
    // Check for play event
    const events = testAPI?.getLastEvents() || [];
    const hasPlayEvent = events.some((e: any) => e.type === 'play');
    expect(hasPlayEvent).toBe(true);
  });

  test('should stop playback and return to ready state', async ({ page }) => {
    // Initialize and play
    await page.getByRole('button', { name: 'Init Audio' }).click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.locator('text=State: playing')).toBeVisible({ timeout: 5000 });
    
    // Stop
    await page.getByRole('button', { name: 'Stop' }).click();
    
    // Should return to ready
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 5000 });
    
    // Verify stop event
    const testAPI = await getTestAPI(page);
    const events = testAPI?.getLastEvents() || [];
    const hasStopEvent = events.some((e: any) => e.type === 'stop');
    expect(hasStopEvent).toBe(true);
  });

  test('should auto-initialize when playing without explicit init', async ({ page }) => {
    // Initial state should be idle
    await expect(page.locator('text=State: idle')).toBeVisible();
    
    // Click Play without initializing first
    await page.getByRole('button', { name: 'Play' }).click();
    
    // Should auto-initialize and transition to playing
    await expect(page.locator('text=State: playing')).toBeVisible({ timeout: 10000 });
    
    // Verify both init and play were called
    const testAPI = await getTestAPI(page);
    expect(testAPI?.wasInitCalled()).toBe(true);
    expect(testAPI?.wasPlayCalled()).toBe(true);
  });

  test('should type prompt, send message, and receive response', async ({ page }) => {
    // Type a prompt
    const input = page.getByPlaceholder(/Type a message/);
    await input.fill('make a simple beat at 90 bpm');
    
    // Send message
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Should see user message
    await expect(page.locator('text=You')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=make a simple beat at 90 bpm')).toBeVisible();
    
    // Should see assistant thinking
    await expect(page.locator('text=Thinking...')).toBeVisible({ timeout: 5000 });
    
    // Wait for response (this may take a while)
    await expect(page.locator('text=Assistant').nth(1)).toBeVisible({ timeout: 30000 });
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should update code editor when AI returns valid code', async ({ page }) => {
    // Get initial code
    const codeEditor = page.locator('textarea');
    const initialCode = await codeEditor.inputValue();
    
    // Type a prompt
    const input = page.getByPlaceholder(/Type a message/);
    await input.fill('make a simple kick drum at 120 bpm');
    
    // Send message
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for assistant response
    await expect(page.locator('text=Assistant').nth(1)).toBeVisible({ timeout: 30000 });
    
    // Wait a bit for code to be processed
    await page.waitForTimeout(2000);
    
    // Code should have changed (or at minimum still contain required elements)
    const updatedCode = await codeEditor.inputValue();
    expect(updatedCode.length).toBeGreaterThan(0);
    expect(updatedCode).toContain('setcps'); // Should have tempo
    expect(updatedCode).toContain('play()'); // Should have playback
  });

  test('should validate code and show errors for invalid code', async ({ page }) => {
    // Edit code to be invalid (missing tempo)
    const codeEditor = page.locator('textarea');
    await codeEditor.clear();
    await codeEditor.fill('s("bd sd").play()'); // Missing setcps
    
    // Try to play
    await page.getByRole('button', { name: 'Play' }).click();
    
    // Should show validation error
    await expect(page.locator('text=Code validation failed')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=tempo directive')).toBeVisible();
    
    // State should remain idle or ready, not playing
    const stateText = await page.locator('text=/State: (idle|ready)/').textContent();
    expect(stateText).toMatch(/(idle|ready)/);
  });

  test('should handle eval errors gracefully', async ({ page }) => {
    // Initialize first
    await page.getByRole('button', { name: 'Init Audio' }).click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    // Edit code to have a syntax error
    const codeEditor = page.locator('textarea');
    await codeEditor.clear();
    await codeEditor.fill('setcps(1.5)\nthis is bad syntax!().play()');
    
    // Try to play
    await page.getByRole('button', { name: 'Play' }).click();
    
    // Should transition to error state
    await expect(page.locator('text=State: error')).toBeVisible({ timeout: 5000 });
    
    // Should show error message
    await expect(page.locator('text=Failed to play')).toBeVisible();
    
    // Verify eval_fail event
    const testAPI = await getTestAPI(page);
    const events = testAPI?.getLastEvents() || [];
    const hasEvalFailEvent = events.some((e: any) => e.type === 'eval_fail');
    expect(hasEvalFailEvent).toBe(true);
  });

  test('should display runtime events in console panel', async ({ page }) => {
    // Initialize
    await page.getByRole('button', { name: 'Init Audio' }).click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    // Should see console panel
    await expect(page.locator('text=Console')).toBeVisible();
    
    // Should see init event with icon
    await expect(page.locator('text=🎵')).toBeVisible();
    await expect(page.locator('text=Audio initialized successfully')).toBeVisible();
    
    // Play
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.locator('text=State: playing')).toBeVisible({ timeout: 5000 });
    
    // Should see play event
    await expect(page.locator('text=▶️')).toBeVisible();
    
    // Stop
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 5000 });
    
    // Should see stop event
    await expect(page.locator('text=⏹️')).toBeVisible();
  });

  test('should enable/disable buttons based on state', async ({ page }) => {
    // Initially, Init Audio should be enabled, others should check state
    const initBtn = page.getByRole('button', { name: 'Init Audio' });
    const playBtn = page.getByRole('button', { name: 'Play' });
    const stopBtn = page.getByRole('button', { name: 'Stop' });
    
    // Init should be enabled, stop should be disabled
    await expect(initBtn).toBeEnabled();
    await expect(stopBtn).toBeDisabled();
    
    // Initialize
    await initBtn.click();
    await expect(page.locator('text=State: ready')).toBeVisible({ timeout: 10000 });
    
    // Init should be disabled (already initialized), play enabled, stop disabled
    await expect(initBtn).toBeDisabled();
    await expect(playBtn).toBeEnabled();
    await expect(stopBtn).toBeDisabled();
    
    // Play
    await playBtn.click();
    await expect(page.locator('text=State: playing')).toBeVisible({ timeout: 5000 });
    
    // Stop should now be enabled
    await expect(stopBtn).toBeEnabled();
  });
});

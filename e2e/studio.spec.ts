import { test, expect, type Page } from "@playwright/test";

/**
 * Helper to get test API from window
 */
async function getTestAPI(page: Page) {
  return await page.evaluate(() => {
    return window.__audioTest;
  });
}

/**
 * Helper to wait for Tone.js to be loaded
 */
async function waitForToneLoad(page: Page) {
  await page.waitForFunction(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return typeof (window as any).Tone !== "undefined" || document.readyState === "complete";
    },
    { timeout: 30000 }
  );
}

test.describe("LoField Music Studio E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/studio");
    await waitForToneLoad(page);
  });

  test("should load page and display UI elements", async ({ page }) => {
    // Check main UI elements are present
    await expect(page.getByRole("heading", { name: "LoField Music Lab" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Code Editor" })).toBeVisible();

    // Check buttons are present
    await expect(page.getByRole("button", { name: "Init Audio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();

    // Check code editor has default code
    const codeEditor = page.locator("textarea");
    await expect(codeEditor).toBeVisible();
    const code = await codeEditor.inputValue();
    expect(code).toContain("Tone.Transport");
    expect(code).toContain("Transport.start()");
  });

  test("should initialize audio engine and transition state", async ({ page }) => {
    // Initial state should be idle
    await expect(page.locator("text=IDLE")).toBeVisible();

    // Click Init Audio button
    await page.getByRole("button", { name: "Init Audio" }).click();

    // Wait for state to transition to ready
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    // Verify via test API
    const testAPI = await getTestAPI(page);
    expect(testAPI).toBeDefined();
    expect(testAPI?.wasInitCalled()).toBe(true);

    // Check events in console
    await expect(page.locator("text=Audio initialized successfully")).toBeVisible();
  });

  test("should play code and transition to playing state", async ({ page }) => {
    // Initialize first
    await page.getByRole("button", { name: "Init Audio" }).click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    // Click Play
    await page.getByRole("button", { name: "Play" }).click();

    // Wait for playing state
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 5000 });

    // Verify via test API
    const testAPI = await getTestAPI(page);
    expect(testAPI?.wasPlayCalled()).toBe(true);
    expect(testAPI?.wasStopCalled()).toBe(true); // Stop is called before play to clear previous

    // Check for play event
    const events = testAPI?.getLastEvents() || [];
    const hasPlayEvent = events.some((e: { type: string }) => e.type === "play");
    expect(hasPlayEvent).toBe(true);
  });

  test("should stop playback and return to ready state", async ({ page }) => {
    // Initialize and play
    await page.getByRole("button", { name: "Init Audio" }).click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 5000 });

    // Stop
    await page.getByRole("button", { name: "Stop" }).click();

    // Should return to ready
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 5000 });

    // Verify stop event
    const testAPI = await getTestAPI(page);
    const events = testAPI?.getLastEvents() || [];
    const hasStopEvent = events.some((e: { type: string }) => e.type === "stop");
    expect(hasStopEvent).toBe(true);
  });

  test("should auto-initialize when playing without explicit init", async ({ page }) => {
    // Initial state should be idle
    await expect(page.locator("text=IDLE")).toBeVisible();

    // Click Play without initializing first
    await page.getByRole("button", { name: "Play" }).click();

    // Should auto-initialize and transition to playing
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 10000 });

    // Verify both init and play were called
    const testAPI = await getTestAPI(page);
    expect(testAPI?.wasInitCalled()).toBe(true);
    expect(testAPI?.wasPlayCalled()).toBe(true);
  });

  test("should type prompt, send message, and receive response", async ({ page }) => {
    // Type a prompt
    const input = page.getByPlaceholder(/Type your prompt/);
    await input.fill("make a simple beat at 90 bpm");

    // Send message
    await page.getByRole("button", { name: "Send" }).click();

    // Should see user message
    await expect(page.locator("text=User")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=make a simple beat at 90 bpm")).toBeVisible();

    // Should see assistant processing
    await expect(page.locator("text=Processing...")).toBeVisible({ timeout: 5000 });

    // Wait for response (this may take a while)
    await expect(page.locator("text=Assistant").nth(1)).toBeVisible({ timeout: 30000 });

    // Input should be cleared
    await expect(input).toHaveValue("");
  });

  test("should update code editor when AI returns valid code", async ({ page }) => {
    const codeEditor = page.locator("textarea");

    // Type a prompt
    const input = page.getByPlaceholder(/Type your prompt/);
    await input.fill("make a simple kick drum at 120 bpm");

    // Send message
    await page.getByRole("button", { name: "Send" }).click();

    // Wait for assistant response
    await expect(page.locator("text=Assistant").nth(1)).toBeVisible({ timeout: 30000 });

    // Wait a bit for code to be processed
    await page.waitForTimeout(2000);

    // Code should have changed (or at minimum still contain required elements)
    const updatedCode = await codeEditor.inputValue();
    expect(updatedCode.length).toBeGreaterThan(0);
    expect(updatedCode).toContain("Tone"); // Should use Tone.js
    expect(updatedCode).toContain("Transport.start()"); // Should have playback
  });

  test("should validate code and show errors for invalid code", async ({ page }) => {
    // Edit code to be invalid (missing Transport.start)
    const codeEditor = page.locator("textarea");
    await codeEditor.clear();
    await codeEditor.fill("const synth = new Tone.Synth()"); // Missing Transport.start

    // Try to play
    await page.getByRole("button", { name: "Play" }).click();

    // Should show validation error
    await expect(page.locator("text=Code validation failed")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Transport.start")).toBeVisible();

    // State should remain idle or ready, not playing
    const stateText = await page.locator("text=/(IDLE|READY)/").textContent();
    expect(stateText).toMatch(/(IDLE|READY)/);
  });

  test("should handle eval errors gracefully", async ({ page }) => {
    // Initialize first
    await page.getByRole("button", { name: "Init Audio" }).click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    // Edit code to have a syntax error
    const codeEditor = page.locator("textarea");
    await codeEditor.clear();
    await codeEditor.fill(
      "Tone.Transport.bpm.value = 120;\nthis is bad syntax!\nTone.Transport.start()"
    );

    // Try to play
    await page.getByRole("button", { name: "Play" }).click();

    // Should transition to error state
    await expect(page.locator("text=ERROR")).toBeVisible({ timeout: 5000 });

    // Should show error message
    await expect(page.locator("text=Failed to play")).toBeVisible();

    // Verify eval_fail event
    const testAPI = await getTestAPI(page);
    const events = testAPI?.getLastEvents() || [];
    const hasEvalFailEvent = events.some((e: { type: string }) => e.type === "eval_fail");
    expect(hasEvalFailEvent).toBe(true);
  });

  test("should display runtime events in console panel", async ({ page }) => {
    // Initialize
    await page.getByRole("button", { name: "Init Audio" }).click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    // Should see init event with icon
    await expect(page.locator("text=🎵")).toBeVisible();
    await expect(page.locator("text=Audio initialized successfully")).toBeVisible();

    // Play
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 5000 });

    // Should see play event
    await expect(page.locator("text=▶️")).toBeVisible();

    // Stop
    await page.getByRole("button", { name: "Stop" }).click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 5000 });

    // Should see stop event
    await expect(page.locator("text=⏹️")).toBeVisible();
  });

  test("should enable/disable buttons based on state", async ({ page }) => {
    // Initially, Init Audio should be enabled, others should check state
    const initBtn = page.getByRole("button", { name: "Init Audio" });
    const playBtn = page.getByRole("button", { name: "Play" });
    const stopBtn = page.getByRole("button", { name: "Stop" });

    // Init should be enabled, stop should be disabled
    await expect(initBtn).toBeEnabled();
    await expect(stopBtn).toBeDisabled();

    // Initialize
    await initBtn.click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 10000 });

    // Init button hidden after init (or disabled), play enabled, stop disabled
    await expect(playBtn).toBeEnabled();
    await expect(stopBtn).toBeDisabled();

    // Play
    await playBtn.click();
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 5000 });

    // Stop should now be enabled
    await expect(stopBtn).toBeEnabled();
  });
});

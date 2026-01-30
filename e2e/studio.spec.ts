import { test, expect, type Page } from "@playwright/test";

/**
 * Helper to check test API state via page.evaluate
 * We evaluate each method call separately because the test API methods
 * can't be serialized and passed back to Node.js
 */
async function wasInitCalled(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return window.__audioTest?.wasInitCalled() ?? false;
  });
}

async function wasPlayCalled(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return window.__audioTest?.wasPlayCalled() ?? false;
  });
}

async function wasStopCalled(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return window.__audioTest?.wasStopCalled() ?? false;
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
    // Mark tutorial as completed before loading page to prevent overlay from blocking interactions
    await page.addInitScript(() => {
      localStorage.setItem("lofield_tutorial_completed", "true");
    });
    await page.goto("/studio");
    await waitForToneLoad(page);
  });

  test("should load page and display UI elements", async ({ page }) => {
    // Check main UI elements are present
    await expect(page.getByRole("heading", { name: "LoField Music Lab" })).toBeVisible();

    // Check player state indicator shows IDLE initially
    await expect(page.locator("text=IDLE")).toBeVisible();

    // Check navigation buttons are present
    await expect(page.getByRole("button", { name: "My Tracks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preset Library" })).toBeVisible();

    // Check player control buttons are present
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();

    // Check initial button states
    await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Stop" })).toBeDisabled();
  });

  test("should display code editor with default Tone.js code", async ({ page }) => {
    // The code is displayed in code editor area - look for Tone.js code content
    const codeContent = page.locator("text=Tone.Transport.bpm.value");
    await expect(codeContent.first()).toBeVisible();

    // Also check for other Tone.js patterns in the default code
    const transportStart = page.locator("text=Tone.Transport.swing");
    await expect(transportStart.first()).toBeVisible();
  });

  test("should auto-initialize and play when clicking Play", async ({ page }) => {
    // Initial state should be idle
    await expect(page.locator("text=IDLE")).toBeVisible();

    // Click Play button - this should auto-initialize audio and start playback
    await page.getByRole("button", { name: "Play" }).click();

    // Wait for state to transition to playing
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 10000 });

    // Verify via test API that both init and play were called
    const initCalled = await wasInitCalled(page);
    const playCalled = await wasPlayCalled(page);
    expect(initCalled).toBe(true);
    expect(playCalled).toBe(true);
  });

  test("should stop playback and return to ready state", async ({ page }) => {
    // Start playback first
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 10000 });

    // Stop should now be enabled
    await expect(page.getByRole("button", { name: "Stop" })).toBeEnabled();

    // Click Stop
    await page.getByRole("button", { name: "Stop" }).click();

    // Should return to ready state
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 5000 });

    // Verify stop was called via test API
    const stopCalled = await wasStopCalled(page);
    expect(stopCalled).toBe(true);
  });

  test("should enable/disable buttons based on playback state", async ({ page }) => {
    const playBtn = page.getByRole("button", { name: "Play" });
    const stopBtn = page.getByRole("button", { name: "Stop" });

    // Initially: Play enabled, Stop disabled
    await expect(playBtn).toBeEnabled();
    await expect(stopBtn).toBeDisabled();

    // Start playback
    await playBtn.click();
    await expect(page.locator("text=PLAYING")).toBeVisible({ timeout: 10000 });

    // While playing: Stop should be enabled
    await expect(stopBtn).toBeEnabled();

    // Stop playback
    await stopBtn.click();
    await expect(page.locator("text=READY")).toBeVisible({ timeout: 5000 });

    // After stopping: Stop should be disabled again
    await expect(stopBtn).toBeDisabled();
  });

  test("should display tweaks panel with sliders", async ({ page }) => {
    // Check tweaks panel header is visible
    await expect(page.getByRole("button", { name: "Tweaks" })).toBeVisible();

    // Check individual tweak labels exist (use first() to handle multiple matches)
    await expect(
      page.locator(".text-xs.font-medium.text-slate-300:text('BPM')").first()
    ).toBeVisible();
    await expect(page.locator("text=Swing").first()).toBeVisible();
    await expect(page.locator("text=Filter").first()).toBeVisible();
    await expect(page.locator("text=Reverb").first()).toBeVisible();
    await expect(page.locator("text=Delay").first()).toBeVisible();

    // Check sliders are present (multiple sliders exist)
    const sliders = page.getByRole("slider");
    await expect(sliders.first()).toBeVisible();
    expect(await sliders.count()).toBeGreaterThan(0);
  });

  test("should display layers panel", async ({ page }) => {
    // Check layers panel header is visible (it's a button that can expand/collapse)
    await expect(page.getByRole("button", { name: /Layers/ })).toBeVisible();

    // Check default layer exists with "main" name
    await expect(page.locator("text=main")).toBeVisible();

    // Check mute (M) and solo (S) buttons are present (use exact: true)
    await expect(page.getByRole("button", { name: "M", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "S", exact: true })).toBeVisible();

    // Check Add Layer button exists
    await expect(page.getByRole("button", { name: "Add Layer" })).toBeVisible();
  });

  test("should display timeline section", async ({ page }) => {
    // Check timeline panel header is visible
    await expect(page.getByRole("button", { name: "Timeline" })).toBeVisible();

    // Check section indicators (A, B, C, D for 32-bar arrangement)
    // Use more specific selectors
    const sectionA = page.locator("text=/^A$/");
    const sectionB = page.locator("text=/^B$/");
    const sectionC = page.locator("text=/^C$/");
    const sectionD = page.locator("text=/^D$/");
    await expect(sectionA.first()).toBeVisible();
    await expect(sectionB.first()).toBeVisible();
    await expect(sectionC.first()).toBeVisible();
    await expect(sectionD.first()).toBeVisible();
  });

  test("should show API key prompt when no key is configured", async ({ page }) => {
    // In E2E mode, mock Supabase should show no API key
    // The API Key Required prompt should be visible
    await expect(page.locator("text=API Key Required")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add API Key" })).toBeVisible();
  });

  test("should display action buttons in toolbar", async ({ page }) => {
    // Check action buttons are present (use exact: true where needed)
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Redo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save As" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Revert" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();

    // Undo/Redo should be disabled initially (no history)
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  test("should show model selector button", async ({ page }) => {
    // Check AI model selector is present
    await expect(page.getByRole("button", { name: "Select AI Model" })).toBeVisible();
  });

  test("should show Live mode toggle in code panel", async ({ page }) => {
    // Check Live mode indicator is present in the code panel
    // The "Live" button should be visible
    await expect(page.getByRole("button", { name: "Live" })).toBeVisible();
  });
});

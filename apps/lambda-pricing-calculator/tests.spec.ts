/**
 * AWS Lambda + SnapStart Pricing Calculator — Playwright Tests
 *
 * This app estimates AWS Lambda costs with and without SnapStart.
 * Users configure requests, memory, duration, architecture, free tier,
 * and SnapStart settings (cache/restore). Results update live and include
 * a detailed cost breakdown. State is persisted in the URL for sharing.
 *
 * These tests verify all core features and serve as living documentation.
 */

import { test, expect } from "@playwright/test";

const APP_URL = "/lambda-pricing-calculator/";

test.describe("Lambda Pricing Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("page loads with title, inputs card, and results card", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(
      "AWS Lambda + SnapStart Pricing Calculator"
    );
    await expect(page.locator("h1")).toContainText(
      "AWS Lambda Pricing Calculator"
    );

    // Inputs card
    await expect(page.locator("#requests")).toBeVisible();
    await expect(page.locator("#memoryMb")).toBeVisible();
    await expect(page.locator("#durationMs")).toBeVisible();

    // Results card
    await expect(page.locator("#totalNoSnap")).toBeVisible();
    await expect(page.locator("#totalWithSnap")).toBeVisible();
  });

  test("default values are populated on load", async ({ page }) => {
    await expect(page.locator("#period")).toHaveValue("month");
    await expect(page.locator("#requests")).toHaveValue("100000");
    await expect(page.locator("#memoryMb")).toHaveValue("512");
    await expect(page.locator("#durationMs")).toHaveValue("250");
    await expect(page.locator("#arch")).toHaveValue("x86_64");
    await expect(page.locator("#freeTier")).toBeChecked();
    await expect(page.locator("#snapStartOn")).not.toBeChecked();
  });

  test("results update when request count changes", async ({ page }) => {
    const initialCost = await page.locator("#totalNoSnap").textContent();

    await page.locator("#requests").fill("10000000");
    await page.locator("#requests").dispatchEvent("input");

    const updatedCost = await page.locator("#totalNoSnap").textContent();
    expect(updatedCost).not.toBe(initialCost);
  });

  test("results update when memory changes", async ({ page }) => {
    // Disable free tier so cost is non-zero and changes are visible
    await page.locator("#freeTier").uncheck();
    await page.locator("#freeTier").dispatchEvent("input");
    const initialCost = await page.locator("#totalNoSnap").textContent();

    await page.locator("#memoryMb").fill("2048");
    await page.locator("#memoryMb").dispatchEvent("input");

    const updatedCost = await page.locator("#totalNoSnap").textContent();
    expect(updatedCost).not.toBe(initialCost);
  });

  test("results update when duration changes", async ({ page }) => {
    // Disable free tier so cost is non-zero and changes are visible
    await page.locator("#freeTier").uncheck();
    await page.locator("#freeTier").dispatchEvent("input");
    const initialCost = await page.locator("#totalNoSnap").textContent();

    await page.locator("#durationMs").fill("1000");
    await page.locator("#durationMs").dispatchEvent("input");

    const updatedCost = await page.locator("#totalNoSnap").textContent();
    expect(updatedCost).not.toBe(initialCost);
  });

  test("free tier checkbox reduces cost", async ({ page }) => {
    // Disable free tier first
    await page.locator("#freeTier").uncheck();
    await page.locator("#freeTier").dispatchEvent("change");
    const costWithoutFree = await page.locator("#totalNoSnap").textContent();

    // Re-enable free tier
    await page.locator("#freeTier").check();
    await page.locator("#freeTier").dispatchEvent("change");
    const costWithFree = await page.locator("#totalNoSnap").textContent();

    // Cost with free tier should be less than or equal to cost without
    expect(parseDollar(costWithFree!)).toBeLessThanOrEqual(
      parseDollar(costWithoutFree!)
    );
  });

  test("enabling SnapStart shows additional costs", async ({ page }) => {
    // SnapStart off — cache and restore should be $0
    await expect(page.locator("#snapCacheCost")).toHaveText("$0.00");
    await expect(page.locator("#snapRestoreCost")).toHaveText("$0.00");

    // Enable SnapStart
    await page.locator("#snapStartOn").check();
    await page.locator("#snapStartOn").dispatchEvent("input");

    // Cache cost should now be > $0
    const cacheCost = await page.locator("#snapCacheCost").textContent();
    expect(parseDollar(cacheCost!)).toBeGreaterThan(0);
  });

  test("SnapStart total includes base + SnapStart costs", async ({ page }) => {
    await page.locator("#snapStartOn").check();
    await page.locator("#snapStartOn").dispatchEvent("input");

    const noSnap = parseDollar(
      (await page.locator("#totalNoSnap").textContent())!
    );
    const withSnap = parseDollar(
      (await page.locator("#totalWithSnap").textContent())!
    );

    expect(withSnap).toBeGreaterThanOrEqual(noSnap);
  });

  test("period selector changes active hours default on change", async ({
    page,
  }) => {
    await page.locator("#period").selectOption("day");
    await page.locator("#period").dispatchEvent("change");
    await expect(page.locator("#activeHours")).toHaveValue("24");

    await page.locator("#period").selectOption("week");
    await page.locator("#period").dispatchEvent("change");
    await expect(page.locator("#activeHours")).toHaveValue("168");

    await page.locator("#period").selectOption("month");
    await page.locator("#period").dispatchEvent("change");
    await expect(page.locator("#activeHours")).toHaveValue("720");
  });

  test("reset button restores default values", async ({ page }) => {
    // Change some values
    await page.locator("#requests").fill("999999");
    await page.locator("#memoryMb").fill("4096");
    await page.locator("#requests").dispatchEvent("input");

    // Click reset
    await page.locator("#reset").click();

    await expect(page.locator("#requests")).toHaveValue("100000");
    await expect(page.locator("#memoryMb")).toHaveValue("512");
    await expect(page.locator("#durationMs")).toHaveValue("250");
    await expect(page.locator("#period")).toHaveValue("month");
    await expect(page.locator("#snapStartOn")).not.toBeChecked();
  });

  test("derived info line shows request count, memory, duration, and GB-s", async ({
    page,
  }) => {
    const derived = await page.locator("#derived").textContent();
    expect(derived).toContain("100,000 req");
    expect(derived).toContain("512 MB");
    expect(derived).toContain("250 ms");
    expect(derived).toContain("GB-s");
  });

  test("notes textarea contains assumptions text", async ({ page }) => {
    const notes = await page.locator("#notes").inputValue();
    expect(notes).toContain("What this estimates:");
    expect(notes).toContain("GB-seconds compute");
    expect(notes).toContain("SnapStart is OFF");
  });

  test("state is persisted in the URL", async ({ page }) => {
    await page.locator("#requests").fill("777777");
    await page.locator("#requests").dispatchEvent("input");

    const url = page.url();
    expect(url).toContain("requests=777777");
  });

  test("state loads from URL parameters", async ({ page }) => {
    await page.goto(APP_URL + "?requests=250000&memoryMb=1024&durationMs=500");

    await expect(page.locator("#requests")).toHaveValue("250000");
    await expect(page.locator("#memoryMb")).toHaveValue("1024");
    await expect(page.locator("#durationMs")).toHaveValue("500");
  });

  test("custom region preset shows warning", async ({ page }) => {
    await expect(page.locator("#rateWarning")).not.toBeVisible();

    await page.locator("#regionPreset").selectOption("custom");
    await page.locator("#regionPreset").dispatchEvent("change");

    await expect(page.locator("#rateWarning")).toBeVisible();
    await expect(page.locator("#rateWarning")).toContainText("Custom rates");
  });

  test("zero requests results in zero cost", async ({ page }) => {
    await page.locator("#requests").fill("0");
    await page.locator("#requests").dispatchEvent("input");

    await expect(page.locator("#totalNoSnap")).toHaveText("$0.00");
    await expect(page.locator("#reqCost")).toHaveText("$0.00");
    await expect(page.locator("#computeCost")).toHaveText("$0.00");
  });

  test("responsive layout — no horizontal scroll on narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(APP_URL);

    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

// --- Helpers ---

function parseDollar(text: string): number {
  return parseFloat(text.replace(/[^0-9.\-]/g, "")) || 0;
}

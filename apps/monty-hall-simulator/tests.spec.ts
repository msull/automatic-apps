/**
 * Monty Hall Simulator — Playwright Tests
 *
 * This app simulates the Monty Hall problem with configurable number of doors,
 * trials, seed, and switch probability. It compares three strategies: keep,
 * switch, and mixed (switch with probability p). Results include a win rate
 * table, bar chart, and theoretical probabilities.
 *
 * These tests verify all core features and serve as living documentation.
 */

import { test, expect } from "@playwright/test";

const APP_URL = "/monty-hall-simulator/";

test.describe("Monty Hall Simulator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("page loads with title and simulation inputs", async ({ page }) => {
    await expect(page).toHaveTitle("Monty Hall Simulator");
    await expect(page.locator("h1")).toContainText("Monty Hall Simulator");

    await expect(page.locator("#doors")).toBeVisible();
    await expect(page.locator("#trials")).toBeVisible();
    await expect(page.locator("#seed")).toBeVisible();
    await expect(page.locator("#switchProb")).toBeVisible();
  });

  test("default input values are populated", async ({ page }) => {
    await expect(page.locator("#doors")).toHaveValue("3");
    await expect(page.locator("#trials")).toHaveValue("100000");
    await expect(page.locator("#seed")).toHaveValue("");
    await expect(page.locator("#switchProb")).toHaveValue("0.50");
  });

  test("theoretical probabilities are shown on load for 3 doors", async ({
    page,
  }) => {
    const keepTheory = await page.locator("#theoryKeep").textContent();
    expect(keepTheory).toContain("33.333%");

    const switchTheory = await page.locator("#theorySwitch").textContent();
    expect(switchTheory).toContain("66.667%");
  });

  test("theoretical probabilities update when doors change", async ({
    page,
  }) => {
    await page.locator("#doors").fill("10");
    await page.locator("#doors").dispatchEvent("input");

    const keepTheory = await page.locator("#theoryKeep").textContent();
    expect(keepTheory).toContain("10.000%");

    const switchTheory = await page.locator("#theorySwitch").textContent();
    expect(switchTheory).toContain("90.000%");
  });

  test("run simulation produces results in the table", async ({ page }) => {
    // Use a seed for deterministic results
    await page.locator("#seed").fill("test123");
    await page.locator("#trials").fill("1000");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run").click();

    // Table should now have strategy rows
    const rows = page.locator("#tbody tr");
    await expect(rows).toHaveCount(3);

    // Each row should have win rate data
    const firstRow = await rows.nth(0).textContent();
    expect(firstRow).toContain("Keep");
    expect(firstRow).toContain("%");

    const secondRow = await rows.nth(1).textContent();
    expect(secondRow).toContain("Switch");
  });

  test("switch strategy wins more often than keep for 3 doors", async ({
    page,
  }) => {
    await page.locator("#seed").fill("deterministic");
    await page.locator("#trials").fill("10000");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run").click();

    const rows = page.locator("#tbody tr");
    const keepRate = await extractWinRate(rows.nth(0));
    const switchRate = await extractWinRate(rows.nth(1));

    expect(switchRate).toBeGreaterThan(keepRate);
  });

  test("run x10 button produces results", async ({ page }) => {
    await page.locator("#seed").fill("test456");
    await page.locator("#trials").fill("100");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run10").click();

    // Meta should show 1,000 trials (100 x 10)
    const meta = await page.locator("#meta").textContent();
    expect(meta).toContain("1,000 trials");
  });

  test("elapsed time is displayed after running", async ({ page }) => {
    await page.locator("#trials").fill("1000");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run").click();

    const elapsed = await page.locator("#elapsed").textContent();
    expect(elapsed).toContain("ms");
    expect(elapsed).not.toBe("—");
  });

  test("reset button restores defaults and clears results", async ({
    page,
  }) => {
    // Change values and run
    await page.locator("#doors").fill("5");
    await page.locator("#trials").fill("500");
    await page.locator("#seed").fill("abc");
    await page.locator("#run").click();

    // Reset
    await page.locator("#reset").click();

    await expect(page.locator("#doors")).toHaveValue("3");
    await expect(page.locator("#trials")).toHaveValue("100000");
    await expect(page.locator("#seed")).toHaveValue("");
    await expect(page.locator("#switchProb")).toHaveValue("0.5");

    // Results should be cleared
    const tbody = await page.locator("#tbody").textContent();
    expect(tbody).toContain("Run a simulation to see results.");
    await expect(page.locator("#elapsed")).toHaveText("—");
  });

  test("validation rejects doors < 3", async ({ page }) => {
    await page.locator("#doors").fill("2");
    await page.locator("#run").click();

    const err = await page.locator("#err").textContent();
    expect(err).toContain("Doors");
  });

  test("validation rejects invalid switch probability", async ({ page }) => {
    await page.locator("#switchProb").fill("1.5");
    await page.locator("#run").click();

    const err = await page.locator("#err").textContent();
    expect(err).toContain("Switch probability");
  });

  test("seeded runs produce consistent results", async ({ page }) => {
    await page.locator("#seed").fill("consistency");
    await page.locator("#trials").fill("5000");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run").click();
    const rows1 = page.locator("#tbody tr");
    const keepRate1 = await extractWinRate(rows1.nth(0));

    // Run again with same seed
    await page.locator("#run").click();
    const rows2 = page.locator("#tbody tr");
    const keepRate2 = await extractWinRate(rows2.nth(0));

    expect(keepRate1).toBe(keepRate2);
  });

  test("chart canvas is rendered", async ({ page }) => {
    await expect(page.locator("#chart")).toBeVisible();
  });

  test("N=10 doors shows higher switch win rate", async ({ page }) => {
    await page.locator("#doors").fill("10");
    await page.locator("#seed").fill("n10test");
    await page.locator("#trials").fill("10000");
    await page.locator("#trials").dispatchEvent("input");

    await page.locator("#run").click();

    const rows = page.locator("#tbody tr");
    const keepRate = await extractWinRate(rows.nth(0));
    const switchRate = await extractWinRate(rows.nth(1));

    // With 10 doors, switch should win ~90% vs keep ~10%
    expect(switchRate).toBeGreaterThan(80);
    expect(keepRate).toBeLessThan(20);
  });
});

// --- Helpers ---

async function extractWinRate(row: ReturnType<typeof import("@playwright/test").Page.prototype.locator>): Promise<number> {
  const text = await row.locator("td").nth(3).textContent();
  return parseFloat(text!.replace("%", ""));
}

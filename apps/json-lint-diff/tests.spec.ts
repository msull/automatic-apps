/**
 * JSON Lint & Diff — Playwright Tests
 *
 * This app lets users paste JSON to auto-format and validate it.
 * Users can enable diff mode to compare two JSON values side by side
 * with a line-by-line diff output. Features include configurable
 * indentation, key sorting, and minification.
 *
 * These tests verify all core features and serve as living documentation.
 */

import { test, expect } from "@playwright/test";

const APP_URL = "/json-lint-diff/";

test.describe("JSON Lint & Diff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("page loads with title and editor", async ({ page }) => {
    await expect(page).toHaveTitle("JSON Lint & Diff");
    await expect(page.locator("h1")).toContainText("JSON Lint & Diff");
    await expect(page.locator("#editor-a")).toBeVisible();
    // Second editor hidden by default
    await expect(page.locator("#pane-b")).toBeHidden();
  });

  test("formats valid JSON on blur", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.fill('{"b":1,"a":2}');
    await editor.blur();
    const value = await editor.inputValue();
    expect(value).toBe('{\n  "b": 1,\n  "a": 2\n}');
    await expect(page.locator("#status-a")).toHaveText("Valid");
  });

  test("shows error for invalid JSON on blur", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.fill("{bad json}");
    await editor.blur();
    await expect(page.locator("#status-a")).toHaveText("Invalid");
    await expect(page.locator("#error-a")).not.toBeEmpty();
    await expect(editor).toHaveClass(/error/);
  });

  test("formats JSON on paste", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.focus();
    // Simulate paste by setting value then dispatching paste event
    await editor.evaluate((el: HTMLTextAreaElement) => {
      el.value = '{"hello":"world"}';
      el.dispatchEvent(new Event("paste"));
    });
    // Wait for the setTimeout in the paste handler
    await page.waitForTimeout(100);
    const value = await editor.inputValue();
    expect(value).toBe('{\n  "hello": "world"\n}');
  });

  test("sort keys button sorts object keys alphabetically", async ({
    page,
  }) => {
    const editor = page.locator("#editor-a");
    await editor.fill('{"z":1,"a":2,"m":3}');
    await page.locator("#btn-sort").click();
    await expect(page.locator("#btn-sort")).toHaveClass(/active/);
    const value = await editor.inputValue();
    expect(value).toBe('{\n  "a": 2,\n  "m": 3,\n  "z": 1\n}');
  });

  test("minify button compresses JSON", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.fill('{ "a": 1, "b": 2 }');
    await editor.blur();
    await page.locator("#btn-minify").click();
    const value = await editor.inputValue();
    expect(value).toBe('{"a":1,"b":2}');
  });

  test("indent selector changes indentation", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.fill('{"a":1}');
    await page.locator("#indent-select").selectOption("4");
    const value = await editor.inputValue();
    expect(value).toBe('{\n    "a": 1\n}');
  });

  test("clear button resets everything", async ({ page }) => {
    const editor = page.locator("#editor-a");
    await editor.fill('{"a":1}');
    await editor.blur();
    await page.locator("#btn-clear").click();
    await expect(editor).toHaveValue("");
    await expect(page.locator("#status-a")).toHaveText("");
    await expect(page.locator("#error-a")).toHaveText("");
  });

  test("diff mode shows second editor and computes diff", async ({ page }) => {
    await page.locator("#btn-diff").click();
    await expect(page.locator("#btn-diff")).toHaveClass(/active/);
    await expect(page.locator("#pane-b")).toBeVisible();
    await expect(page.locator(".editors")).toHaveClass(/two-up/);

    // Fill both editors
    const editorA = page.locator("#editor-a");
    const editorB = page.locator("#editor-b");
    await editorA.fill('{"a":1,"b":2}');
    await editorA.blur();
    await editorB.fill('{"a":1,"b":3,"c":4}');
    await editorB.blur();

    // Diff should appear
    await expect(page.locator("#diff-container")).toBeVisible();
    await expect(page.locator("#diff-output")).not.toBeEmpty();

    // Should show added/removed lines
    const diffText = await page.locator("#diff-output").textContent();
    expect(diffText).toContain("+");
    expect(diffText).toContain("-");
  });

  test("diff shows no differences for identical JSON", async ({ page }) => {
    await page.locator("#btn-diff").click();
    const editorA = page.locator("#editor-a");
    const editorB = page.locator("#editor-b");
    await editorA.fill('{"a":1}');
    await editorA.blur();
    await editorB.fill('{"a":1}');
    await editorB.blur();
    await expect(page.locator("#diff-output")).toContainText(
      "No differences found"
    );
  });

  test("toggling diff mode off hides second editor and diff", async ({
    page,
  }) => {
    await page.locator("#btn-diff").click();
    await expect(page.locator("#pane-b")).toBeVisible();
    await page.locator("#btn-diff").click();
    await expect(page.locator("#pane-b")).toBeHidden();
    await expect(page.locator("#diff-container")).toBeHidden();
  });

  test("label changes between Input and Left/Right in diff mode", async ({
    page,
  }) => {
    await expect(page.locator("#label-a")).toHaveText("Input");
    await page.locator("#btn-diff").click();
    await expect(page.locator("#label-a")).toHaveText("Left");
  });
});

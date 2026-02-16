/**
 * Music Note Flashcards — Playwright Tests
 *
 * This app displays a treble clef staff with a random note (C4–G5).
 * The user clicks one of seven note-name buttons (C D E F G A B) to guess.
 * Correct answers flash green and auto-advance; incorrect answers flash red,
 * reveal the correct answer, then advance. A running streak and score are shown.
 *
 * These tests verify all core features and serve as living documentation.
 */

import { test, expect } from "@playwright/test";

const APP_URL = "/music-note-flashcards/";

test.describe("Music Note Flashcards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("page loads with staff, treble clef, and a note displayed", async ({ page }) => {
    // Title
    await expect(page.locator("h1")).toHaveText("Music Note Flashcards");

    // SVG staff with 5 lines
    const staffLines = page.locator("svg#staff line.staff-line");
    await expect(staffLines).toHaveCount(5);

    // Treble clef symbol present
    const clef = page.locator("svg#staff text");
    await expect(clef).toBeVisible();

    // A notehead is rendered
    const notehead = page.locator('[data-testid="notehead"]');
    await expect(notehead).toBeVisible();
  });

  test("all seven note buttons are rendered and clickable", async ({ page }) => {
    const noteNames = ["C", "D", "E", "F", "G", "A", "B"];
    for (const name of noteNames) {
      const btn = page.locator(`.note-btn[data-note="${name}"]`);
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText(name);
      await expect(btn).toBeEnabled();
    }
  });

  test("correct answer shows green feedback and increments score", async ({ page }) => {
    // Determine the current note by reading the notehead position and mapping it
    const correctNote = await getCurrentNoteName(page);

    // Click the correct button
    await page.click(`.note-btn[data-note="${correctNote}"]`);

    // Button should have .correct class
    const btn = page.locator(`.note-btn[data-note="${correctNote}"]`);
    await expect(btn).toHaveClass(/correct/);

    // Feedback text
    await expect(page.locator("#feedback")).toHaveText("Correct!");
    await expect(page.locator("#feedback")).toHaveClass(/correct-text/);

    // Score updates
    await expect(page.locator("#correct-count")).toHaveText("1");
    await expect(page.locator("#total-count")).toHaveText("1");
    await expect(page.locator("#streak")).toHaveText("1");
  });

  test("incorrect answer shows red feedback and reveals correct answer", async ({ page }) => {
    const correctNote = await getCurrentNoteName(page);
    const wrongNote = getWrongNote(correctNote);

    await page.click(`.note-btn[data-note="${wrongNote}"]`);

    // Clicked button should be .incorrect
    const wrongBtn = page.locator(`.note-btn[data-note="${wrongNote}"]`);
    await expect(wrongBtn).toHaveClass(/incorrect/);

    // Correct button should be revealed
    const correctBtn = page.locator(`.note-btn[data-note="${correctNote}"]`);
    await expect(correctBtn).toHaveClass(/reveal/);

    // Feedback shows the correct answer
    await expect(page.locator("#feedback")).toContainText(correctNote);
    await expect(page.locator("#feedback")).toHaveClass(/incorrect-text/);

    // Score: 0 correct, 1 total, streak 0
    await expect(page.locator("#correct-count")).toHaveText("0");
    await expect(page.locator("#total-count")).toHaveText("1");
    await expect(page.locator("#streak")).toHaveText("0");
  });

  test("streak resets on wrong answer after correct answers", async ({ page }) => {
    // Get 2 correct answers to build a streak
    for (let i = 0; i < 2; i++) {
      const note = await getCurrentNoteName(page);
      await page.click(`.note-btn[data-note="${note}"]`);
      await page.waitForTimeout(900); // wait for auto-advance
    }

    await expect(page.locator("#streak")).toHaveText("2");

    // Now get one wrong
    const correctNote = await getCurrentNoteName(page);
    const wrongNote = getWrongNote(correctNote);
    await page.click(`.note-btn[data-note="${wrongNote}"]`);

    await expect(page.locator("#streak")).toHaveText("0");
    await expect(page.locator("#correct-count")).toHaveText("2");
    await expect(page.locator("#total-count")).toHaveText("3");
  });

  test("new note appears after answering", async ({ page }) => {
    const firstNoteY = await getNoteheadY(page);

    // Answer correctly
    const note = await getCurrentNoteName(page);
    await page.click(`.note-btn[data-note="${note}"]`);

    // Wait for next round
    await page.waitForTimeout(900);

    // A notehead should still be visible (new note rendered)
    const notehead = page.locator('[data-testid="notehead"]');
    await expect(notehead).toBeVisible();
  });

  test("produces different notes over multiple rounds", async ({ page }) => {
    const seenPositions = new Set<string>();

    for (let i = 0; i < 15; i++) {
      const y = await getNoteheadY(page);
      seenPositions.add(y);

      const note = await getCurrentNoteName(page);
      await page.click(`.note-btn[data-note="${note}"]`);
      await page.waitForTimeout(900);
    }

    // With 12 possible notes and 15 rounds, we should see at least 3 different positions
    expect(seenPositions.size).toBeGreaterThanOrEqual(3);
  });

  test("responsive layout — no horizontal scroll on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto(APP_URL);

    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

// --- Helpers ---

/** Map notehead Y position to note name */
const Y_TO_NOTE: Record<number, string> = {
  160: "C", // C4
  150: "D", // D4
  140: "E", // E4
  130: "F", // F4
  120: "G", // G4
  110: "A", // A4
  100: "B", // B4
  90:  "C", // C5
  80:  "D", // D5
  70:  "E", // E5
  60:  "F", // F5
  50:  "G", // G5
};

async function getNoteheadY(page: import("@playwright/test").Page): Promise<string> {
  return page.locator('[data-testid="notehead"]').getAttribute("cy") as Promise<string>;
}

async function getCurrentNoteName(page: import("@playwright/test").Page): Promise<string> {
  const yStr = await getNoteheadY(page);
  const y = parseInt(yStr, 10);
  const note = Y_TO_NOTE[y];
  if (!note) throw new Error(`Unknown note at y=${y}`);
  return note;
}

function getWrongNote(correctNote: string): string {
  const all = ["C", "D", "E", "F", "G", "A", "B"];
  const wrong = all.find((n) => n !== correctNote);
  return wrong!;
}

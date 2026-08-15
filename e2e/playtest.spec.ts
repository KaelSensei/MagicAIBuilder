import { test, expect } from "@playwright/test";
import { seedDeckWithCards, suppressOnboarding } from "./helpers";

/**
 * The playtest engine, its store and the five zone components were all written
 * and unit-tested but never imported by anything outside their own tests — the
 * modal still ran the old hand-only hook. These tests exercise the wiring end to
 * end so the engine cannot silently become orphaned again.
 */
test.describe("Playtest mode", () => {
  test.beforeEach(async ({ page, request }) => {
    // A deck with cards is required: the builder's "New Deck" button creates an
    // empty one, and playtesting that draws no opening hand at all.
    const deckId = await seedDeckWithCards(request, 20);

    await suppressOnboarding(page);
    await page.goto(`/builder/${deckId}`);

    // The deck loads asynchronously. Starting the playtest before its cards
    // arrive shuffles an empty pool and deals a hand of zero.
    await page.waitForLoadState("networkidle");

    // Targeted by title: the visible label collapses to an icon below the `sm`
    // breakpoint, so the accessible name is viewport-dependent.
    await page.getByTitle("Playtest this deck").click();
  });

  test("opens on the opening-hand prompt", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /draw opening hand/i })
    ).toBeVisible();
  });

  test("deals a hand and reveals the phase, life and board zones", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();

    // Phase tracker: every phase is listed, Draw is the active one.
    await expect(page.getByTestId("phase-Draw")).toHaveAttribute(
      "data-active",
      "true"
    );
    await expect(page.getByTestId("phase-Combat")).toBeVisible();

    // Commander life total.
    await expect(page.getByText("40", { exact: true })).toBeVisible();

    // Board zones.
    await expect(page.getByText(/No permanents in play/i)).toBeVisible();
    await expect(page.getByText(/Hand: \d+ cards/)).toBeVisible();
  });

  test("steps through phases and rolls over to the next turn", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();

    await page.getByRole("button", { name: /next phase/i }).click();
    await expect(page.getByTestId("phase-Main1")).toHaveAttribute(
      "data-active",
      "true"
    );

    await page.getByRole("button", { name: /next turn/i }).click();
    await expect(page.getByRole("heading", { name: "Turn 2" })).toBeVisible();
  });

  test("tracks life changes", async ({ page }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();

    await page.getByRole("button", { name: "-5" }).click();
    await expect(page.getByText("35", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "+1" }).click();
    await expect(page.getByText("36", { exact: true })).toBeVisible();
  });

  // Exact hand sizes are asserted in PlaytestModal.test.tsx against the real
  // store. Here the deck reaching the builder is not hydrated with its cards on
  // a cold page load, so this level checks the mulligan is wired and correctly
  // gated, not how many cards it leaves.
  test("records the mulligan and closes it off once the turn advances", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await expect(page.getByRole("button", { name: /mulligan/i })).toBeEnabled();

    await page.getByRole("button", { name: /mulligan/i }).click();
    await expect(page.getByText(/1 mulligan/)).toBeVisible();

    await page.getByRole("button", { name: /next turn/i }).click();
    await expect(page.getByRole("button", { name: /mulligan/i })).toBeDisabled();
  });

  test("restart clears the mulligans taken", async ({ page }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await page.getByRole("button", { name: /mulligan/i }).click();
    await expect(page.getByText(/1 mulligan/)).toBeVisible();

    await page.getByRole("button", { name: /restart/i }).click();

    await expect(page.getByText(/mulligan/i).first()).toBeVisible();
    await expect(page.getByText(/1 mulligan/)).toBeHidden();
  });

  test("closing discards the session instead of resuming it", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await page.getByRole("button", { name: /close playtest/i }).click();

    // Targeted by title: the visible label collapses to an icon below the `sm`
    // breakpoint, so the accessible name is viewport-dependent.
    await page.getByTitle("Playtest this deck").click();

    await expect(
      page.getByRole("button", { name: /draw opening hand/i })
    ).toBeVisible();
  });
});

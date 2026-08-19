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

    // The builder lazy-loads the deck's cards after mount. Opening the
    // playtest before they arrive snapshots a short library, and the
    // opening hand comes up smaller than seven — the intermittent failure
    // this wait exists to prevent.
    await expect(page.getByText("Fixture Card 0").first()).toBeVisible();

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

  test("mulligans to a smaller hand and closes off once the turn advances", async ({
    page,
  }) => {
    const handHeading = page.getByText(/Hand: \d+ cards/);

    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await expect(handHeading).toHaveText("Hand: 7 cards");

    await page.getByRole("button", { name: /mulligan/i }).click();
    await expect(handHeading).toHaveText("Hand: 6 cards");
    await expect(page.getByText(/1 mulligan/)).toBeVisible();

    await page.getByRole("button", { name: /next turn/i }).click();
    await expect(page.getByRole("button", { name: /mulligan/i })).toBeDisabled();
  });

  test("restart deals a fresh seven-card hand", async ({ page }) => {
    const handHeading = page.getByText(/Hand: \d+ cards/);

    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await page.getByRole("button", { name: /mulligan/i }).click();
    await expect(handHeading).toHaveText("Hand: 6 cards");

    await page.getByRole("button", { name: /restart/i }).click();

    await expect(handHeading).toHaveText("Hand: 7 cards");
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

import { test, expect } from "./fixtures";
import { fixtureCards, suppressOnboarding } from "./helpers";

/**
 * The playtest engine, its store and the five zone components were all written
 * and unit-tested but never imported by anything outside their own tests — the
 * modal still ran the old hand-only hook. These tests exercise the wiring end to
 * end so the engine cannot silently become orphaned again.
 */
test.describe("Playtest mode", () => {
  test.beforeEach(async ({ page, seededDeck }) => {
    // A deck with cards is required: the builder's "New Deck" button creates an
    // empty one, and playtesting that draws no opening hand at all. The fixture
    // deletes the deck after each test.
    const deckId = await seededDeck.create({
      name: "Playtest Deck",
      cards: fixtureCards(20),
    });

    await suppressOnboarding(page);
    await page.goto(`/builder/${deckId}`);

    // The deck panel's own toolbar: the search panel has a "List view" toggle
    // too, but only while it shows results, so its position is not stable.
    await page
      .getByRole("toolbar", { name: "Deck view" })
      .getByRole("button", { name: "List view" })
      .click();
    // The builder lazy-loads the deck's cards after mount. Opening the
    // playtest before they arrive snapshots a short library, and the
    // opening hand comes up smaller than seven — the intermittent failure
    // this wait exists to prevent. The generous timeout is deliberate:
    // under full-suite parallelism the single next-dev process queues this
    // fetch behind the heavy proxy-export tests, and the default 5s was
    // observed timing out while the load was merely slow, not broken.
    await expect(page.getByRole("button", { name: "Move Fixture Card 0 to Considering" })).toBeVisible({
      timeout: 30_000,
    });

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

  test("takes a free Commander mulligan, bottoms a chosen card on the next, and closes off once the turn advances", async ({
    page,
  }) => {
    const handHeading = page.getByText(/Hand: \d+ cards/);
    const mulligan = page.getByRole("button", { name: /mulligan/i });

    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await expect(handHeading).toHaveText("Hand: 7 cards");

    // CR 103.5c: in a multiplayer game the first mulligan is a free fresh seven.
    await mulligan.click();
    await expect(page.getByText(/1 mulligan/)).toBeVisible();
    await expect(handHeading).toHaveText("Hand: 7 cards");

    // The second one counts: a new seven, then one card of the player's choice
    // goes to the bottom before the game moves on.
    await mulligan.click();
    const choice = page.getByRole("group", { name: /choose 1 card to put on the bottom/i });
    await expect(choice).toBeVisible();
    await expect(page.getByRole("button", { name: /next turn/i })).toBeDisabled();

    await choice.getByRole("button", { pressed: false }).first().click();
    await page.getByRole("button", { name: "Put 1 card on the bottom" }).click();
    await expect(handHeading).toHaveText("Hand: 6 cards");
    await expect(page.getByText(/2 mulligans/)).toBeVisible();

    await page.getByRole("button", { name: /next turn/i }).click();
    await expect(mulligan).toBeDisabled();
  });

  test("restart deals a fresh seven-card hand", async ({ page }) => {
    const handHeading = page.getByText(/Hand: \d+ cards/);

    await page.getByRole("button", { name: /draw opening hand/i }).click();
    await page.getByRole("button", { name: /mulligan/i }).click();
    await expect(page.getByText(/1 mulligan/)).toBeVisible();

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

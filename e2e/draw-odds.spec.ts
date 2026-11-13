/**
 * The draw odds panel in the builder (I-97): the exact chance of three or more
 * lands in the opening seven, shown with its inputs, and the same digits after
 * a reload. The unit tests drive the panel and the formula; this spec proves
 * the builder mounts the panel on the saved deck's library.
 *
 * @module e2e/draw-odds
 */
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  fixtureCards,
  suppressOnboarding,
  waitForBuilder,
  type DeckCardSeed,
} from "./helpers";

/**
 * 36 basic Forests in one row. A basic land is exempt from the Commander
 * singleton rule (CR 903.5b), so one row may hold them all.
 */
const FORESTS: DeckCardSeed = {
  scryfallId: "00000000-0000-4000-8000-100000000036",
  name: "Forest",
  typeLine: "Basic Land — Forest",
  category: "land",
  colorIdentity: [],
  quantity: 36,
};

/** The draw odds panel, by its accessible name. */
function drawOddsPanel(page: Page): Locator {
  return page.getByRole("region", { name: "Draw Odds" });
}

/**
 * The value shown beside one input of the formula.
 *
 * @param panel The draw odds panel.
 * @param label The input's label, as the panel's list shows it.
 */
function inputValue(panel: Locator, label: string): Locator {
  return panel.locator(`dt:text-is("${label}") + dd`);
}

test("the builder shows the chance of three or more lands in the opening seven, and the same digits after a reload", async ({
  page,
  seededDeck,
}) => {
  // Seeding posts 64 card rows one by one, then two page loads each wait for
  // the cards; the default 30 s leaves no margin on a loaded host.
  test.setTimeout(60_000);

  // The I-97 definition of done: a 99-card library with 36 lands. The deck's
  // name differs from the panel's title, so a name query cannot match both.
  const deckId = await seededDeck.create({
    name: "Opening Lands",
    cards: [FORESTS, ...fixtureCards(63)],
  });

  await suppressOnboarding(page);
  await page.goto(`/builder/${deckId}`);
  await waitForBuilder(page);

  const panel = drawOddsPanel(page);
  // 26,736,733 / 53,358,536 ≈ 0.50108. The cards load after the builder
  // mounts; the generous timeout covers that load, as in playtest.spec.ts.
  await expect(panel.getByRole("status")).toHaveText("50.1%", {
    timeout: 30_000,
  });
  await expect(inputValue(panel, "Cards in the library")).toHaveText("99");
  await expect(inputValue(panel, "Matching cards")).toHaveText("36");
  await expect(inputValue(panel, "Cards drawn")).toHaveText("7");
  await expect(inputValue(panel, "At least")).toHaveText("3");
  await expect(
    panel.getByText(
      "This is a count of equally likely hands, not a recorded game."
    )
  ).toBeVisible();

  await page.reload();
  await waitForBuilder(page);

  await expect(drawOddsPanel(page).getByRole("status")).toHaveText("50.1%", {
    timeout: 30_000,
  });
});

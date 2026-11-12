/**
 * Visual stability of the deck editor: the commander banner keeps its box while
 * the warnings open and close, and hovering a row opens a fixed preview that
 * does not push the row.
 *
 * The banner is found by its group name, the row by its "Remove {name}" button
 * and the preview by its image name (audit TT-11). The row's name text is not
 * unique: the "Card to explain" select in the stats panel repeats it as an
 * option.
 *
 * @module e2e/deck-editor-visual
 */
import { test, expect } from "./fixtures";
import { deckCardRow, openDeckInListView, type DeckSeed } from "./helpers";

const COMMANDER_ID = "00000000-0000-4000-8000-000000000301";
const SPELL_ID = "00000000-0000-4000-8000-000000000302";

const RED_ONE_DROP = {
  manaCost: "{R}",
  cmc: 1,
  quantity: 1,
  imageUri: "https://cards.scryfall.io/normal/front/a/b/visual.jpg",
};

/** A red commander and one red instant, both with an image, so the banner and the preview render. */
const VISUAL_DECK: DeckSeed = {
  name: "Deck Editor Visual",
  cards: [
    {
      ...RED_ONE_DROP,
      scryfallId: COMMANDER_ID,
      name: "Visual Commander",
      zone: "main",
      isCommander: true,
      category: "commander",
      typeLine: "Legendary Creature",
      colorIdentity: ["R"],
    },
    {
      ...RED_ONE_DROP,
      scryfallId: SPELL_ID,
      name: "Visual Spell",
      zone: "main",
      isCommander: false,
      category: "instant",
      typeLine: "Instant",
      colorIdentity: ["R"],
    },
  ],
};

test.describe("Deck editor visual stability", () => {
  test("keeps the commander banner box stable while warnings open and close", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(VISUAL_DECK);

    await openDeckInListView(page, deckId);
    const banner = page.getByRole("group", { name: "Visual Commander" });
    await expect(banner).toBeVisible();
    const before = await banner.boundingBox();
    expect(before?.height).toBeCloseTo(82, 0);

    await page.getByRole("button", { name: "Dismiss deck warnings" }).click();
    const dismissed = await banner.boundingBox();
    expect(dismissed?.height).toBeCloseTo(before?.height ?? 0, 0);
    expect(dismissed?.y).toBeCloseTo(before?.y ?? 0, 0);

    await page.getByRole("button", { name: "Toggle deck warnings" }).click();
    const reopened = await banner.boundingBox();
    expect(reopened?.height).toBeCloseTo(before?.height ?? 0, 0);
    expect(reopened?.y).toBeCloseTo(before?.y ?? 0, 0);
  });

  test("opens a fixed card preview without moving the card row", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(VISUAL_DECK);

    await openDeckInListView(page, deckId);
    const row = deckCardRow(page, "Visual Spell");
    await expect(row).toBeVisible();
    // Measure the settled row, not its entrance translation. The row is the
    // button's parent: it animates in, the button does not.
    await expect(row.locator("..")).toHaveCSS("transform", "none");
    const before = await row.boundingBox();

    await row.hover();
    const preview = page.getByRole("img", { name: "Visual Spell" });
    await expect(preview).toBeVisible();
    const position = await preview.evaluate((node) => {
      const parent = node.parentElement;
      return parent ? getComputedStyle(parent).position : "";
    });
    expect(position).toBe("fixed");

    const after = await row.boundingBox();
    expect(after).toEqual(before);
  });
});

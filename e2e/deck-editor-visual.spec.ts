/**
 * Visual stability of the deck editor: the commander banner keeps its box while
 * the warnings open and close, hovering a row opens a fixed preview that does
 * not push the row, and the view and density toggles are targets of 24 px or
 * more.
 *
 * The banner is found by its group name, the row by its "Remove {name}" button
 * and the preview by its image name (audit TT-11). The row's name text is not
 * unique: the "Card to explain" select in the stats panel repeats it as an
 * option.
 *
 * @module e2e/deck-editor-visual
 */
import { test, expect } from "./fixtures";
import {
  deckCardRow,
  openDeckInListView,
  suppressOnboarding,
  waitForBuilder,
  type DeckSeed,
} from "./helpers";

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

  // WCAG 2.2 SC 2.5.8 (https://www.w3.org/TR/WCAG22/#target-size-minimum,
  // read 2026-11-26): each target is at least 24 by 24 px, and 24 px circles
  // centred on neighbouring targets do not overlap. The toggles were 20 px
  // (design audit S3); the segmented control makes them 28 px.
  test("sizes every view and density toggle at 24 px or more, with room between them", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(VISUAL_DECK);

    await suppressOnboarding(page);
    await page.goto(`/builder/${deckId}`);
    await waitForBuilder(page);
    const toolbar = page.getByRole("toolbar", { name: "Deck view" });
    await toolbar.getByRole("button", { name: "Grid view" }).click();
    const toggles = [
      toolbar.getByRole("button", { name: "List view" }),
      toolbar.getByRole("button", { name: "Grid view" }),
      ...[2, 3, 4, 6, 8].map((count) =>
        toolbar.getByRole("button", { name: `${count} cards per row` })
      ),
    ];
    await expect(
      toolbar.getByRole("button", { name: "8 cards per row" })
    ).toBeVisible();

    const boxes = await Promise.all(
      toggles.map((toggle) => toggle.boundingBox())
    );
    for (const box of boxes) {
      expect(box?.width).toBeGreaterThanOrEqual(24);
      expect(box?.height).toBeGreaterThanOrEqual(24);
    }
    const centres = boxes.map((box) => (box ? box.x + box.width / 2 : 0));
    const gaps = centres
      .slice(1)
      .map((centre, index) => centre - (centres[index] ?? 0));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(24);
  });
});

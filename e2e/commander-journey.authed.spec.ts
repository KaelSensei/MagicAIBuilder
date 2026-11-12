/**
 * Command-zone journey through the builder: the player picks a commander,
 * replaces it, adds a partner and clears the zone. Each change shows on
 * screen, survives a reload and is in the deck record.
 *
 * Why this spec exists: `deck-editor-visual`, `deck-export` and
 * `community-discovery` seed the command zone through the API, so nothing
 * drove `setCommander`, `setPartner` or `clearCommander` from the screen. The
 * saving path behind them is being rewritten into one `PATCH …/command-zone`
 * in one transaction. This journey pins what the player sees and what the deck
 * record holds, and must stay green across that rewrite: it never waits on a
 * particular write request, it polls the deck record instead.
 *
 * Scryfall is stubbed with `page.route`, as `natural-language-search` does.
 * Every browser search answers from the three cards below, and their images
 * answer from an inline SVG, so the browser never reaches the network. The
 * server still asks Scryfall itself when it checks a commander-partner pair
 * (`commandPairProblem`, `duplicatesOtherCommandSlot`). Scryfall answers
 * `not_found` for the ids below and the server lets the pair through: the
 * partner test is the one place that depends on the server's network.
 *
 * Every control is found by role and accessible name (audit TT-11): a search
 * toggle by its label, a search result by its "Add {name} to deck" button, a
 * command slot by the group named after its card, and the slot's clear
 * control by "Remove {name}".
 *
 * @module e2e/commander-journey
 */
import type { APIRequestContext, Page } from "@playwright/test";
import { z } from "zod";
import { test, expect } from "./fixtures";
import { getThroughApi, suppressOnboarding, waitForBuilder } from "./helpers";

/**
 * How long a persisted-state poll waits. The old saving path sends up to
 * three requests in a row; a loaded gate host answers each in well under a
 * second, so this is slack, not a retry.
 */
const PERSISTENCE_TIMEOUT_MS = 15_000;

/**
 * The journey reloads the builder three times and polls the record after each
 * step; on a loaded gate host that exceeds Playwright's 30 s default.
 */
const JOURNEY_TIMEOUT_MS = 120_000;

/** A legendary creature the stubbed Scryfall returns. */
interface StubCommander {
  /** A UUID: the card routes answer 400 to any other id. */
  readonly id: string;
  readonly name: string;
  readonly typeLine: string;
  /** The Oracle text the partner rules read (CR 702.124). */
  readonly oracleText: string;
  /** One colour, so the banner shows one pip. */
  readonly color: "W" | "U" | "G";
}

/** A commander with no partner ability: picking it opens no second slot. */
const ALPHA: StubCommander = {
  id: "00000000-0000-4000-8000-000000000601",
  name: "Journey Commander Alpha",
  typeLine: "Legendary Creature — Human Knight",
  oracleText: "Vigilance",
  color: "W",
};

// CR 702.124h: two cards that each have "partner" can both be commanders.
const PARTNER_ONE: StubCommander = {
  id: "00000000-0000-4000-8000-000000000602",
  name: "Journey Partner One",
  typeLine: "Legendary Creature — Elf Druid",
  oracleText: "Partner",
  color: "G",
};
const PARTNER_TWO: StubCommander = {
  id: "00000000-0000-4000-8000-000000000603",
  name: "Journey Partner Two",
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText: "Partner",
  color: "U",
};

const STUB_COMMANDERS: readonly StubCommander[] = [
  ALPHA,
  PARTNER_ONE,
  PARTNER_TWO,
];

/** A blank card face: the image URL only has to resolve, nothing reads it. */
const CARD_IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="223" height="310"></svg>';

/**
 * The card as Scryfall's search would list it. The image URLs are absolute
 * because the card routes validate `imageUri` as a URL; they are routed to
 * {@link CARD_IMAGE_SVG}, so no image request leaves the browser.
 */
function scryfallCardOf(card: StubCommander) {
  const image = `https://cards.scryfall.io/normal/front/0/0/${card.id}.jpg`;
  return {
    object: "card",
    id: card.id,
    oracle_id: card.id,
    name: card.name,
    layout: "normal",
    mana_cost: `{2}{${card.color}}`,
    cmc: 3,
    type_line: card.typeLine,
    oracle_text: card.oracleText,
    colors: [card.color],
    color_identity: [card.color],
    power: "2",
    toughness: "2",
    image_uris: { small: image, normal: image, large: image, art_crop: image },
    prices: { usd: "1.00" },
    legalities: { commander: "legal" },
    set: "cmr",
    rarity: "rare",
  };
}

/**
 * Which stubbed cards a Scryfall query lists.
 *
 * The commander toggle searches `is:commander …`; the partner toggle searches
 * the commander's partner requirement, `is:commander o:"Partner" …` for a card
 * with plain partner (`buildPartnerSearchQuery`). Both list every stub
 * commander: the player picks the card, the stub need not filter. Everything
 * else the editor searches on its own (Game Changers, the banlist, the empty
 * name search) is an empty list, so the run needs no network for them either.
 */
function stubbedSearchResults(query: string): readonly StubCommander[] {
  if (query.includes("is:commander")) return STUB_COMMANDERS;
  return [];
}

/**
 * Answers every Scryfall search and card image from this file, and tells the
 * shared search cache to miss so each search reaches the stub.
 */
async function stubScryfall(page: Page): Promise<void> {
  await page.route("**/api/cache/search**", async (route) => {
    await route.fulfill({ json: { hit: false } });
  });
  await page.route("https://api.scryfall.com/cards/search**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") ?? "";
    const data = stubbedSearchResults(query).map(scryfallCardOf);
    await route.fulfill({
      json: { object: "list", total_cards: data.length, has_more: false, data },
    });
  });
  await page.route("https://cards.scryfall.io/**", async (route) => {
    await route.fulfill({ contentType: "image/svg+xml", body: CARD_IMAGE_SVG });
  });
}

/** Opens a seeded deck in the builder with Scryfall stubbed; call before any navigation. */
async function openSeededDeck(page: Page, deckId: string): Promise<void> {
  await suppressOnboarding(page);
  await stubScryfall(page);
  await page.goto(`/builder/${deckId}`);
  await waitForBuilder(page);
}

/** Reloads the builder and waits for the deck, so the next assertion reads a fresh load. */
async function reloadBuilder(page: Page): Promise<void> {
  await page.reload();
  await waitForBuilder(page);
}

/** The search panel's commander toggle: its results are commanders, and a click on one sets the commander. */
function commanderSearchToggle(page: Page) {
  return page.getByRole("button", { name: "Commander", exact: true });
}

/** The partner toggle, shown only once the commander can pair (CR 702.124). */
function partnerSearchToggle(page: Page) {
  return page.getByRole("button", { name: "Partner", exact: true });
}

/** A search result's click surface, which fills the slot the active toggle names. */
function searchResult(page: Page, card: StubCommander) {
  return page.getByRole("button", {
    name: `Add ${card.name} to deck`,
    exact: true,
  });
}

/** The command-zone slot showing `card`: a group named after the card. */
function commandSlot(page: Page, card: StubCommander) {
  return page.getByRole("group", { name: card.name, exact: true });
}

/** The clear control of the slot showing `card`. */
function clearSlot(page: Page, card: StubCommander) {
  return page.getByRole("button", { name: `Remove ${card.name}`, exact: true });
}

/** What the builder shows while the deck has no commander. */
function emptyCommandZone(page: Page) {
  return page.getByText("Search for a commander above");
}

/** The fields of `GET /api/decks/[id]` the command zone is read from. */
const deckRecordSchema = z.object({
  commanderId: z.string().nullable(),
  partnerId: z.string().nullable(),
  cards: z.array(
    z.object({
      scryfallId: z.string(),
      name: z.string(),
      isCommander: z.boolean(),
      isPartner: z.boolean(),
    })
  ),
});

/** One row flagged as a command-zone card. */
interface CommandRow {
  readonly scryfallId: string;
  readonly isPartner: boolean;
}

/**
 * The persisted command zone: the two slot ids on the deck record, the rows
 * flagged as command-zone cards and every row's name. Readers of the deck
 * find the commander through the flagged rows, so a stray row is a bug even
 * when the slot ids are right.
 */
interface CommandZoneRecord {
  readonly commanderId: string | null;
  readonly partnerId: string | null;
  /** Sorted by printing id: the API does not order rows. */
  readonly commandRows: readonly CommandRow[];
  /** Sorted by name. */
  readonly cardNames: readonly string[];
}

/** Reads the persisted command zone of `deckId` through the deck API. */
async function readCommandZone(
  request: APIRequestContext,
  deckId: string
): Promise<CommandZoneRecord> {
  const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
  if (!loaded.ok()) {
    throw new Error(
      `deck load failed: ${loaded.status()} ${await loaded.text()}`
    );
  }
  const deck = deckRecordSchema.parse(await loaded.json());
  const commandRows = deck.cards
    .filter((card) => card.isCommander)
    .map(({ scryfallId, isPartner }) => ({ scryfallId, isPartner }))
    .sort((a, b) => a.scryfallId.localeCompare(b.scryfallId));
  const cardNames = deck.cards
    .map((card) => card.name)
    .sort((a, b) => a.localeCompare(b));
  return {
    commanderId: deck.commanderId,
    partnerId: deck.partnerId,
    commandRows,
    cardNames,
  };
}

/** The record of a deck whose only command-zone card is `commander`. */
function soleCommanderRecord(commander: StubCommander): CommandZoneRecord {
  return {
    commanderId: commander.id,
    partnerId: null,
    commandRows: [{ scryfallId: commander.id, isPartner: false }],
    cardNames: [commander.name],
  };
}

/** The record of a deck with no command-zone card and no other row. */
const EMPTY_RECORD: CommandZoneRecord = {
  commanderId: null,
  partnerId: null,
  commandRows: [],
  cardNames: [],
};

/**
 * Waits until the deck record equals `expected`. A poll rather than a wait on
 * a request, so the assertion holds whichever requests the save sends.
 */
async function expectPersisted(
  request: APIRequestContext,
  deckId: string,
  expected: CommandZoneRecord
): Promise<void> {
  await expect
    .poll(() => readCommandZone(request, deckId), {
      timeout: PERSISTENCE_TIMEOUT_MS,
    })
    .toEqual(expected);
}

/** Picks `card` as the commander from the search panel and waits for its slot. */
async function pickCommander(page: Page, card: StubCommander): Promise<void> {
  await commanderSearchToggle(page).click();
  await searchResult(page, card).click();
  await expect(commandSlot(page, card)).toBeVisible();
}

test.describe("Command zone journey", () => {
  test("picks a commander, replaces it and clears it, persisting each step", async ({
    page,
    request,
    seededDeck,
  }) => {
    test.setTimeout(JOURNEY_TIMEOUT_MS);
    const deckId = await seededDeck.create({ name: "Commander Journey" });

    await openSeededDeck(page, deckId);
    await expect(emptyCommandZone(page)).toBeVisible();

    // Pick: the slot shows the card, the record names it once, and a fresh
    // load shows it again.
    await pickCommander(page, ALPHA);
    await expectPersisted(request, deckId, soleCommanderRecord(ALPHA));
    await reloadBuilder(page);
    await expect(commandSlot(page, ALPHA)).toBeVisible();
    await expect(emptyCommandZone(page)).toHaveCount(0);

    // Change: the old commander leaves the slot and the deck, with no stray
    // row, before and after a reload.
    await pickCommander(page, PARTNER_ONE);
    await expect(commandSlot(page, ALPHA)).toHaveCount(0);
    await expectPersisted(request, deckId, soleCommanderRecord(PARTNER_ONE));
    await reloadBuilder(page);
    await expect(commandSlot(page, PARTNER_ONE)).toBeVisible();
    await expect(commandSlot(page, ALPHA)).toHaveCount(0);

    // Clear: the zone is empty again and the deck holds no row.
    await clearSlot(page, PARTNER_ONE).click();
    await expect(emptyCommandZone(page)).toBeVisible();
    await expect(commandSlot(page, PARTNER_ONE)).toHaveCount(0);
    await expectPersisted(request, deckId, EMPTY_RECORD);
    await reloadBuilder(page);
    await expect(emptyCommandZone(page)).toBeVisible();
    await expect(commandSlot(page, PARTNER_ONE)).toHaveCount(0);
  });

  test("adds a partner beside a partner commander, and clearing the commander clears both", async ({
    page,
    request,
    seededDeck,
  }) => {
    test.setTimeout(JOURNEY_TIMEOUT_MS);
    const deckId = await seededDeck.create({
      name: "Commander Journey Partner",
    });

    await openSeededDeck(page, deckId);
    // The partner toggle exists only once the commander can pair.
    await expect(partnerSearchToggle(page)).toHaveCount(0);
    await pickCommander(page, PARTNER_ONE);
    await expectPersisted(request, deckId, soleCommanderRecord(PARTNER_ONE));

    // CR 702.124h: both cards have partner, so both sit in the command zone.
    await partnerSearchToggle(page).click();
    await searchResult(page, PARTNER_TWO).click();
    await expect(commandSlot(page, PARTNER_ONE)).toBeVisible();
    await expect(commandSlot(page, PARTNER_TWO)).toBeVisible();
    await expectPersisted(request, deckId, {
      commanderId: PARTNER_ONE.id,
      partnerId: PARTNER_TWO.id,
      commandRows: [
        { scryfallId: PARTNER_ONE.id, isPartner: false },
        { scryfallId: PARTNER_TWO.id, isPartner: true },
      ],
      cardNames: [PARTNER_ONE.name, PARTNER_TWO.name],
    });
    await reloadBuilder(page);
    await expect(commandSlot(page, PARTNER_ONE)).toBeVisible();
    await expect(commandSlot(page, PARTNER_TWO)).toBeVisible();

    // A partner cannot stay without a commander: clearing the commander
    // empties the whole zone.
    await clearSlot(page, PARTNER_ONE).click();
    await expect(emptyCommandZone(page)).toBeVisible();
    await expect(commandSlot(page, PARTNER_TWO)).toHaveCount(0);
    await expectPersisted(request, deckId, EMPTY_RECORD);
    await reloadBuilder(page);
    await expect(emptyCommandZone(page)).toBeVisible();
    await expect(commandSlot(page, PARTNER_ONE)).toHaveCount(0);
    await expect(commandSlot(page, PARTNER_TWO)).toHaveCount(0);
  });
});

/**
 * Characterization suite for the exact add-card request each deck store
 * action sends, and for the one request a command-zone change sends.
 *
 * Seven actions build the 18-field add-card body by hand today. DB-10 replaces
 * those literals with one payload builder; this suite pins every body first,
 * so the builder cannot drop, rename or re-derive a field unnoticed. The
 * bodies are read where the server reads them: the JSON a stubbed `fetch`
 * receives. No internal module is mocked.
 *
 * The command-zone cards are chosen so the expected requests hold both before
 * and after `fix/commander-pairing-variants`: a commander with no partner
 * ability and no partner to keep, and a Partner commander given a Partner.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as StoreModule from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

const DECK_ID = "deck-1";
const DECK_ROUTE = `/api/decks/${DECK_ID}`;
const CARDS_ROUTE = `${DECK_ROUTE}/cards`;

// ---------------------------------------------------------------------------
// Fake deck API
// ---------------------------------------------------------------------------

/** One request as the deck API received it. */
interface ReceivedRequest {
  /** "METHOD /path", without the query string. */
  readonly route: string;
  /** The parsed JSON body, or undefined when none was sent. */
  readonly body: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Stands in for the deck API routes: records each request and answers it
 * with a plausible success. A new card row gets the id `row-saved-<n>`.
 */
function createDeckServer() {
  const received: ReceivedRequest[] = [];
  let savedRows = 0;

  async function fetch(
    input: string | URL | Request,
    init: RequestInit = {}
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input.toString();
    const method = init.method ?? "GET";
    const body: unknown =
      typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    received.push({ route: `${method} ${url.split("?")[0]}`, body });
    if (method === "DELETE") return new Response(null, { status: 204 });
    if (method === "POST") savedRows += 1;
    const answer =
      method === "POST"
        ? { ...(isRecord(body) ? body : {}), id: `row-saved-${savedRows}` }
        : {};
    return new Response(JSON.stringify(answer), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { fetch, received };
}

// ---------------------------------------------------------------------------
// Cards and the open deck
// ---------------------------------------------------------------------------

const BEARS_GRID = "https://img.test/grizzly-bears-grid.webp";
const BEARS_ART = "https://img.test/grizzly-bears-art.webp";

const GRIZZLY_BEARS: ScryfallCard = {
  id: "scry-grizzly-bears",
  name: "Grizzly Bears",
  mana_cost: "{1}{G}",
  cmc: 2,
  type_line: "Creature — Bear",
  oracle_text: "",
  power: "2",
  toughness: "2",
  color_identity: ["G"],
  prices: { usd: "0.25" },
  image_uris: { grid: BEARS_GRID, art: BEARS_ART },
  keywords: [],
};

/** The printed facts every add request copies from Grizzly Bears. */
const BEARS_FACTS = {
  scryfallId: "scry-grizzly-bears",
  name: "Grizzly Bears",
  manaCost: "{1}{G}",
  cmc: 2,
  typeLine: "Creature — Bear",
  oracleText: "",
  power: "2",
  toughness: "2",
  colorIdentity: ["G"],
  price: 0.25,
  imageUri: BEARS_GRID,
  artCropUri: BEARS_ART,
};

const RELENTLESS_RATS: ScryfallCard = {
  id: "scry-relentless-rats",
  name: "Relentless Rats",
  mana_cost: "{1}{B}{B}",
  cmc: 3,
  type_line: "Creature — Rat",
  oracle_text: "A deck can have any number of cards named Relentless Rats.",
  power: "2",
  toughness: "2",
  color_identity: ["B"],
  image_uris: {
    grid: "https://img.test/rats-grid.webp",
    art: "https://img.test/rats-art.webp",
  },
  keywords: [],
};

const PURPHOROS: ScryfallCard = {
  id: "scry-purphoros",
  name: "Purphoros, God of the Forge",
  mana_cost: "{3}{R}",
  cmc: 4,
  type_line: "Legendary Enchantment Creature — God",
  oracle_text: "Indestructible",
  power: "6",
  toughness: "5",
  color_identity: ["R"],
  prices: { usd: "3.10" },
  image_uris: {
    grid: "https://img.test/purphoros-grid.webp",
    art: "https://img.test/purphoros-art.webp",
  },
  keywords: ["Indestructible"],
};

const TYMNA: ScryfallCard = {
  id: "scry-tymna",
  name: "Tymna the Weaver",
  mana_cost: "{1}{W}{B}",
  cmc: 3,
  type_line: "Legendary Creature — Human Cleric",
  oracle_text:
    "Lifelink\nPartner (You can have two commanders if both have partner.)",
  power: "2",
  toughness: "2",
  color_identity: ["W", "B"],
  image_uris: {
    grid: "https://img.test/tymna-grid.webp",
    art: "https://img.test/tymna-art.webp",
  },
  keywords: ["Lifelink", "Partner"],
};

const LURRUS: ScryfallCard = {
  id: "scry-lurrus",
  name: "Lurrus of the Dream-Den",
  mana_cost: "{1}{W/B}{W/B}",
  cmc: 3,
  type_line: "Legendary Creature — Cat Nightmare",
  oracle_text:
    "Companion — Each permanent card in your starting deck has mana value 2 or less.\nLifelink",
  power: "3",
  toughness: "2",
  color_identity: ["W", "B"],
  image_uris: {
    grid: "https://img.test/lurrus-grid.webp",
    art: "https://img.test/lurrus-art.webp",
  },
  keywords: ["Companion", "Lifelink"],
};

function deckCard(
  overrides: Partial<DeckCard> & Pick<DeckCard, "id" | "name">
): DeckCard {
  return {
    manaCost: "",
    cmc: 0,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "artifact",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

const KRENKO = deckCard({
  id: "row-krenko",
  scryfallId: "scry-krenko",
  name: "Krenko, Mob Boss",
  typeLine: "Legendary Creature — Goblin Warrior",
  category: "commander",
});
const THRASIOS = deckCard({
  id: "row-thrasios",
  scryfallId: "scry-thrasios",
  name: "Thrasios, Triton Hero",
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText:
    "{4}: Scry 1, then reveal the top card of your library.\nPartner (You can have two commanders if both have partner.)",
  category: "commander",
});
const JEGANTHA = deckCard({
  id: "row-jegantha",
  scryfallId: "scry-jegantha",
  name: "Jegantha, the Wellspring",
  typeLine: "Legendary Creature — Elemental Elk",
  category: "companion",
});
const SOL_RING = deckCard({
  id: "row-sol-ring",
  scryfallId: "scry-sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  oracleText: "{T}: Add {C}{C}.",
  price: 1.5,
  imageUri: "https://img.test/sol-ring-grid.webp",
  artCropUri: "https://img.test/sol-ring-art.webp",
  category: "ramp",
});

function openDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: DECK_ID,
    name: "Goblins",
    commander: KRENKO,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-11-10T00:00:00.000Z"),
    updatedAt: new Date("2026-11-10T00:00:00.000Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let server: ReturnType<typeof createDeckServer>;
let useDeckStore: (typeof StoreModule)["useDeckStore"];

beforeEach(async () => {
  server = createDeckServer();
  vi.stubGlobal("fetch", server.fetch);
  vi.resetModules();
  ({ useDeckStore } = await import("@/lib/deck/store"));
  useDeckStore.setState({
    decks: { [DECK_ID]: openDeck() },
    activeDeckId: DECK_ID,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The bodies of the add-card requests received so far. */
function addCardBodies(): unknown[] {
  return server.received
    .filter((request) => request.route === `POST ${CARDS_ROUTE}`)
    .map((request) => request.body);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("the add-card request each action sends", () => {
  it("addCard sends a main-deck row with the card's printed facts", async () => {
    await useDeckStore.getState().addCard(GRIZZLY_BEARS);

    expect(addCardBodies()).toEqual([
      {
        ...BEARS_FACTS,
        isGameChanger: false,
        isBanned: false,
        category: "creature",
        quantity: 1,
        isCommander: false,
        isPartner: false,
        zone: "main",
      },
    ]);
  });

  it("addCard sends the quantity and zone it was asked for", async () => {
    await useDeckStore.getState().addCard(RELENTLESS_RATS, { quantity: 12, zone: "sideboard" });

    expect(addCardBodies()).toEqual([
      {
        scryfallId: "scry-relentless-rats",
        name: "Relentless Rats",
        manaCost: "{1}{B}{B}",
        cmc: 3,
        typeLine: "Creature — Rat",
        oracleText:
          "A deck can have any number of cards named Relentless Rats.",
        power: "2",
        toughness: "2",
        colorIdentity: ["B"],
        isGameChanger: false,
        isBanned: false,
        price: null,
        imageUri: "https://img.test/rats-grid.webp",
        artCropUri: "https://img.test/rats-art.webp",
        category: "creature",
        quantity: 12,
        isCommander: false,
        isPartner: false,
        zone: "sideboard",
      },
    ]);
  });

  it("addCard flags a card named on the store's Game Changer and banned lists", async () => {
    useDeckStore.setState({
      gameChangerNames: new Set(["Grizzly Bears"]),
      bannedNames: new Set(["Grizzly Bears"]),
    });

    await useDeckStore.getState().addCard(GRIZZLY_BEARS);

    expect(addCardBodies()).toEqual([
      expect.objectContaining({
        name: "Grizzly Bears",
        isGameChanger: true,
        isBanned: true,
      }),
    ]);
  });

  it("addDeckCard sends the row as given, with Game Changer and banned flags from the store's lists rather than the row's own", async () => {
    useDeckStore.setState({ bannedNames: new Set(["Sol Ring"]) });

    await useDeckStore.getState().addDeckCard({
      ...SOL_RING,
      isGameChanger: true,
      zone: "sideboard",
      quantity: 2,
    });

    expect(addCardBodies()).toEqual([
      {
        scryfallId: "scry-sol-ring",
        name: "Sol Ring",
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Artifact",
        oracleText: "{T}: Add {C}{C}.",
        power: null,
        toughness: null,
        colorIdentity: [],
        isGameChanger: false,
        isBanned: true,
        price: 1.5,
        imageUri: "https://img.test/sol-ring-grid.webp",
        artCropUri: "https://img.test/sol-ring-art.webp",
        category: "ramp",
        quantity: 2,
        isCommander: false,
        isPartner: false,
        zone: "sideboard",
      },
    ]);
  });

  it("addDeckCard sends the row id as the printing id when the row has none", async () => {
    await useDeckStore.getState().addDeckCard({
      ...SOL_RING,
      id: "scry-sol-ring-c21",
      scryfallId: undefined,
    });

    expect(addCardBodies()).toEqual([
      expect.objectContaining({ scryfallId: "scry-sol-ring-c21" }),
    ]);
  });

  it("addToMaybeboard sends a maybeboard row, currently without the Game Changer flag from the store's list (pinned; see B2-36)", async () => {
    useDeckStore.setState({ gameChangerNames: new Set(["Grizzly Bears"]) });

    await useDeckStore.getState().addToMaybeboard(GRIZZLY_BEARS);

    expect(addCardBodies()).toEqual([
      {
        ...BEARS_FACTS,
        isGameChanger: false,
        isBanned: false,
        category: "creature",
        quantity: 1,
        isCommander: false,
        isPartner: false,
        zone: "maybeboard",
      },
    ]);
  });

  it("undo of a removal sends the removed row back with its zone and quantity", async () => {
    useDeckStore.setState({
      decks: {
        [DECK_ID]: openDeck({
          cards: [{ ...SOL_RING, zone: "sideboard", quantity: 1 }],
        }),
      },
    });
    await useDeckStore.getState().removeCard(SOL_RING.id);

    await useDeckStore.getState().undo();

    expect(addCardBodies()).toEqual([
      {
        scryfallId: "scry-sol-ring",
        name: "Sol Ring",
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Artifact",
        oracleText: "{T}: Add {C}{C}.",
        power: null,
        toughness: null,
        colorIdentity: [],
        isGameChanger: false,
        isBanned: false,
        price: 1.5,
        imageUri: "https://img.test/sol-ring-grid.webp",
        artCropUri: "https://img.test/sol-ring-art.webp",
        category: "ramp",
        quantity: 1,
        isCommander: false,
        isPartner: false,
        zone: "sideboard",
      },
    ]);
  });
});

describe("the one request a command-zone change sends", () => {
  const COMMAND_ZONE_ROUTE = `PATCH ${DECK_ROUTE}/command-zone`;

  it("setCommander clears the commander slot, adds a commander row flagged from the store's lists and writes the deck's command fields", async () => {
    useDeckStore.setState({
      gameChangerNames: new Set(["Purphoros, God of the Forge"]),
    });

    await useDeckStore.getState().setCommander(PURPHOROS);

    expect(server.received).toEqual([
      {
        route: COMMAND_ZONE_ROUTE,
        body: {
          removeCardIds: [],
          clearCommandSlots: ["commander"],
          addCards: [
            {
              scryfallId: "scry-purphoros",
              name: "Purphoros, God of the Forge",
              manaCost: "{3}{R}",
              cmc: 4,
              typeLine: "Legendary Enchantment Creature — God",
              oracleText: "Indestructible",
              power: "6",
              toughness: "5",
              colorIdentity: ["R"],
              isGameChanger: true,
              isBanned: false,
              price: 3.1,
              imageUri: "https://img.test/purphoros-grid.webp",
              artCropUri: "https://img.test/purphoros-art.webp",
              category: "commander",
              quantity: 1,
              isCommander: true,
              isPartner: false,
              zone: "main",
            },
          ],
          commandZone: {
            commanderId: "scry-purphoros",
            commanderName: "Purphoros, God of the Forge",
            pairingType: "none",
          },
        },
      },
    ]);
  });

  it("setPartner clears the partner slot and adds a partner row, currently without the Game Changer flag from the store's list (pinned; see B2-30)", async () => {
    useDeckStore.setState({
      decks: {
        [DECK_ID]: openDeck({ commander: THRASIOS, pairingType: "partner" }),
      },
      gameChangerNames: new Set(["Tymna the Weaver"]),
    });

    await useDeckStore.getState().setPartner(TYMNA);

    expect(server.received).toEqual([
      {
        route: COMMAND_ZONE_ROUTE,
        body: {
          removeCardIds: [],
          clearCommandSlots: ["partner"],
          addCards: [
            {
              scryfallId: "scry-tymna",
              name: "Tymna the Weaver",
              manaCost: "{1}{W}{B}",
              cmc: 3,
              typeLine: "Legendary Creature — Human Cleric",
              oracleText:
                "Lifelink\nPartner (You can have two commanders if both have partner.)",
              power: "2",
              toughness: "2",
              colorIdentity: ["W", "B"],
              isGameChanger: false,
              isBanned: false,
              price: null,
              imageUri: "https://img.test/tymna-grid.webp",
              artCropUri: "https://img.test/tymna-art.webp",
              category: "commander",
              quantity: 1,
              isCommander: true,
              isPartner: true,
              zone: "main",
            },
          ],
          commandZone: { partnerId: "scry-tymna", pairingType: "partner" },
        },
      },
    ]);
  });

  it("setCompanion clears the companion slot, adds the new row, currently without the Game Changer flag from the store's list (pinned; see B2-30), and writes companionId", async () => {
    useDeckStore.setState({
      decks: { [DECK_ID]: openDeck({ companion: JEGANTHA }) },
      gameChangerNames: new Set(["Lurrus of the Dream-Den"]),
    });

    await useDeckStore.getState().setCompanion(LURRUS);

    expect(server.received).toEqual([
      {
        route: COMMAND_ZONE_ROUTE,
        body: {
          removeCardIds: [],
          clearCommandSlots: ["companion"],
          addCards: [
            {
              scryfallId: "scry-lurrus",
              name: "Lurrus of the Dream-Den",
              manaCost: "{1}{W/B}{W/B}",
              cmc: 3,
              typeLine: "Legendary Creature — Cat Nightmare",
              oracleText:
                "Companion — Each permanent card in your starting deck has mana value 2 or less.\nLifelink",
              power: "3",
              toughness: "2",
              colorIdentity: ["W", "B"],
              isGameChanger: false,
              isBanned: false,
              price: null,
              imageUri: "https://img.test/lurrus-grid.webp",
              artCropUri: "https://img.test/lurrus-art.webp",
              category: "companion",
              quantity: 1,
              isCommander: false,
              isPartner: false,
              zone: "main",
            },
          ],
          commandZone: { companionId: "scry-lurrus" },
        },
      },
    ]);
  });
});

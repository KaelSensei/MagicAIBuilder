/**
 * A command-zone change is one request: the deck store sends the commander,
 * partner or companion change (rows that leave, rows that enter, the deck
 * fields) to `PATCH /api/decks/[id]/command-zone`, and the server stores it in
 * one transaction. When that request fails, nothing is stored and the store
 * shows the previous command zone again, with the existing failure toast.
 *
 * Why: the store used to send two or three requests per change, and a failure
 * between them left the saved deck half-changed (B2, "command zone atomic").
 * The deck API is the shared in-memory fake (`src/test/fake-deck-client.ts`),
 * which applies a change all or nothing, as the route does.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";
import { apiDeckToStoreDeck } from "./store-factories";
import type { Deck } from "./types";
import { useDeckStore } from "./store";

const deckApi = installFakeDeckClient();
const addToast = recordToasts();

const DECK_ID = "deck-1";

/**
 * Build the Scryfall card a player picks for the command zone.
 * @param id - Scryfall printing id
 * @param name - Card name
 * @param overrides - Fields that differ from a vanilla legendary creature
 * @returns A Scryfall card fixture
 */
function scryfallCard(
  id: string,
  name: string,
  overrides: Partial<ScryfallCard> = {}
): ScryfallCard {
  return {
    id,
    name,
    mana_cost: "{4}",
    cmc: 4,
    type_line: "Legendary Creature",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "mythic",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
    ...overrides,
  };
}

/**
 * A saved row, as `GET /api/decks/[id]` returns it.
 * @param id - Row id
 * @param card - The printing the row holds
 * @param row - Flags that differ from a main-deck row
 * @returns The row
 */
function savedRow(
  id: string,
  card: ScryfallCard,
  row: Partial<ApiDeckCard> = {}
): ApiDeckCard {
  return {
    id,
    deckId: DECK_ID,
    scryfallId: card.id,
    name: card.name,
    manaCost: card.mana_cost ?? "",
    cmc: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text ?? "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    notes: null,
    isCommander: false,
    isPartner: false,
    zone: "main",
    ...row,
  };
}

const PARTNER_LINE =
  "Partner (You can have two commanders if both have partner.)";
const ATRAXA = scryfallCard("atraxa-printing", "Atraxa, Praetors' Voice");
const KENRITH = scryfallCard("kenrith-printing", "Kenrith, the Returned King");
const THRASIOS = scryfallCard("thrasios-printing", "Thrasios, Triton Hero", {
  oracle_text: PARTNER_LINE,
  keywords: ["Partner"],
});
const TYMNA = scryfallCard("tymna-printing", "Tymna the Weaver", {
  oracle_text: PARTNER_LINE,
  keywords: ["Partner"],
});
const KRAUM = scryfallCard("kraum-printing", "Kraum, Ludevic's Opus", {
  oracle_text: PARTNER_LINE,
  keywords: ["Partner"],
});
const LURRUS = scryfallCard("lurrus-printing", "Lurrus of the Dream-Den", {
  oracle_text:
    "Companion — Each permanent card in your starting deck has mana value 2 or less.",
  keywords: ["Companion", "Lifelink"],
});
const JEGANTHA = scryfallCard("jegantha-printing", "Jegantha, the Wellspring", {
  oracle_text:
    "Companion — No card in your starting deck has more than one of the same mana symbol in its mana cost.",
  keywords: ["Companion"],
});
const SOL_RING = scryfallCard("sol-ring-printing", "Sol Ring", {
  type_line: "Artifact",
});

const ATRAXA_ROW = savedRow("row-atraxa", ATRAXA, {
  category: "commander",
  isCommander: true,
});
const THRASIOS_ROW = savedRow("row-thrasios", THRASIOS, {
  category: "commander",
  isCommander: true,
});
const TYMNA_ROW = savedRow("row-tymna", TYMNA, {
  category: "commander",
  isCommander: true,
  isPartner: true,
});
const JEGANTHA_ROW = savedRow("row-jegantha", JEGANTHA, {
  category: "companion",
});
const SOL_RING_ROW = savedRow("row-sol-ring", SOL_RING, { category: "ramp" });
const KENRITH_IN_DECK_ROW = savedRow("row-kenrith", KENRITH);

/**
 * Seed the saved deck and open it in the store, as a load would.
 * @param deck - The deck's command fields
 * @param cards - Its saved rows, command zone included
 * @returns The deck the store shows
 */
function openSavedDeck(
  deck: Partial<ApiDeck>,
  cards: readonly ApiDeckCard[]
): Deck {
  const saved: ApiDeck = {
    ...emptyApiDeck(DECK_ID, "Command Zone"),
    ...deck,
    cards: [...cards],
  };
  deckApi.seedDeck(saved);
  const open = apiDeckToStoreDeck(saved);
  useDeckStore.setState({
    decks: { [DECK_ID]: open },
    activeDeckId: DECK_ID,
    isSyncing: false,
    undoStack: [],
    gameChangerNames: new Set<string>(),
    bannedNames: new Set<string>(),
  });
  return open;
}

/** @returns The deck the store shows */
function shownDeck(): Deck {
  const deck = useDeckStore.getState().decks[DECK_ID];
  if (!deck) throw new Error("the deck is not open");
  return deck;
}

/** @returns The deck as the fake server holds it */
function savedDeck(): ApiDeck {
  const deck = deckApi.savedDeck(DECK_ID);
  if (!deck) throw new Error("the deck is not saved");
  return deck;
}

/** @returns Name and role of every saved row, in load order */
function savedRows(): readonly { name: string; role: string }[] {
  return savedDeck().cards.map((row) => {
    let role = "deck";
    if (row.isPartner) role = "partner";
    else if (row.isCommander) role = "commander";
    else if (row.category === "companion") role = "companion";
    return { name: row.name, role };
  });
}

/** The operations the old flows used, which a one-request change never sends. */
function expectOneRequestOnly(): void {
  expect(deckApi.changeCommandZone).toHaveBeenCalledTimes(1);
  expect(deckApi.updateDeck).not.toHaveBeenCalled();
  expect(deckApi.addCard).not.toHaveBeenCalled();
  expect(deckApi.removeCard).not.toHaveBeenCalled();
}

const SERVER_DOWN = new DeckApiRefusal(500, "Failed to save the command zone");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setCommander", () => {
  beforeEach(() => {
    openSavedDeck({ commanderId: ATRAXA.id, commanderName: ATRAXA.name }, [
      ATRAXA_ROW,
      SOL_RING_ROW,
    ]);
  });

  it("replaces the commander, its row and the deck's command fields in one request", async () => {
    await useDeckStore.getState().setCommander(KENRITH);

    expectOneRequestOnly();
    expect(savedDeck()).toMatchObject({
      commanderId: KENRITH.id,
      commanderName: KENRITH.name,
      pairingType: "none",
    });
    expect(savedRows()).toEqual([
      { name: "Sol Ring", role: "deck" },
      { name: KENRITH.name, role: "commander" },
    ]);
    expect(shownDeck().commander).toMatchObject({
      name: KENRITH.name,
      id: savedDeck().cards[1]?.id,
    });
  });

  it("leaves the saved deck as it was and shows the previous commander again when the request fails", async () => {
    deckApi.changeCommandZone.mockRejectedValueOnce(SERVER_DOWN);

    await useDeckStore.getState().setCommander(KENRITH);

    expect(savedDeck()).toMatchObject({
      commanderId: ATRAXA.id,
      commanderName: ATRAXA.name,
    });
    expect(savedRows()).toEqual([
      { name: ATRAXA.name, role: "commander" },
      { name: "Sol Ring", role: "deck" },
    ]);
    expect(shownDeck().commander).toMatchObject({
      id: ATRAXA_ROW.id,
      name: ATRAXA.name,
    });
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Could not save commander — try again"
    );
  });
});

describe("clearCommander", () => {
  it("removes the commander, the partner and their rows in one request", async () => {
    openSavedDeck(
      {
        commanderId: THRASIOS.id,
        commanderName: THRASIOS.name,
        partnerId: TYMNA.id,
        pairingType: "partner",
      },
      [THRASIOS_ROW, TYMNA_ROW, SOL_RING_ROW]
    );

    await useDeckStore.getState().clearCommander();

    expectOneRequestOnly();
    expect(savedDeck()).toMatchObject({
      commanderId: null,
      commanderName: null,
      partnerId: null,
      pairingType: "none",
    });
    expect(savedRows()).toEqual([{ name: "Sol Ring", role: "deck" }]);
    expect(shownDeck()).toMatchObject({ commander: null, partner: null });
  });
});

describe("setPartner", () => {
  beforeEach(() => {
    openSavedDeck(
      {
        commanderId: THRASIOS.id,
        commanderName: THRASIOS.name,
        partnerId: TYMNA.id,
        pairingType: "partner",
      },
      [THRASIOS_ROW, TYMNA_ROW]
    );
  });

  it("replaces the partner, its row and the deck's partner fields in one request", async () => {
    await useDeckStore.getState().setPartner(KRAUM);

    expectOneRequestOnly();
    expect(savedDeck()).toMatchObject({
      partnerId: KRAUM.id,
      pairingType: "partner",
    });
    expect(savedRows()).toEqual([
      { name: THRASIOS.name, role: "commander" },
      { name: KRAUM.name, role: "partner" },
    ]);
    expect(shownDeck().partner).toMatchObject({
      name: KRAUM.name,
      id: savedDeck().cards[1]?.id,
    });
  });

  it("leaves the saved deck as it was and shows the previous partner again when the request fails", async () => {
    deckApi.changeCommandZone.mockRejectedValueOnce(SERVER_DOWN);

    await useDeckStore.getState().setPartner(KRAUM);

    expect(savedDeck().partnerId).toBe(TYMNA.id);
    expect(savedRows()).toEqual([
      { name: THRASIOS.name, role: "commander" },
      { name: TYMNA.name, role: "partner" },
    ]);
    expect(shownDeck().partner).toMatchObject({
      id: TYMNA_ROW.id,
      name: TYMNA.name,
    });
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Could not save partner — try again"
    );
  });

  it("removes the partner and its row in one request", async () => {
    await useDeckStore.getState().setPartner(null);

    expectOneRequestOnly();
    expect(savedDeck().partnerId).toBeNull();
    expect(savedRows()).toEqual([{ name: THRASIOS.name, role: "commander" }]);
    expect(shownDeck().partner).toBeNull();
  });
});

describe("setCompanion", () => {
  beforeEach(() => {
    openSavedDeck(
      {
        commanderId: ATRAXA.id,
        commanderName: ATRAXA.name,
        companionId: JEGANTHA.id,
      },
      [ATRAXA_ROW, JEGANTHA_ROW]
    );
  });

  it("replaces the companion, its row and the deck's companionId in one request", async () => {
    await useDeckStore.getState().setCompanion(LURRUS);

    expectOneRequestOnly();
    expect(savedDeck().companionId).toBe(LURRUS.id);
    expect(savedRows()).toEqual([
      { name: ATRAXA.name, role: "commander" },
      { name: LURRUS.name, role: "companion" },
    ]);
    expect(shownDeck().companion).toMatchObject({
      name: LURRUS.name,
      id: savedDeck().cards[1]?.id,
    });
  });

  it("keeps the previous companion saved and shown when the request fails", async () => {
    deckApi.changeCommandZone.mockRejectedValueOnce(SERVER_DOWN);

    await useDeckStore.getState().setCompanion(LURRUS);

    expect(savedDeck().companionId).toBe(JEGANTHA.id);
    expect(savedRows()).toEqual([
      { name: ATRAXA.name, role: "commander" },
      { name: JEGANTHA.name, role: "companion" },
    ]);
    expect(shownDeck().companion).toMatchObject({ id: JEGANTHA_ROW.id });
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Could not save companion — try again"
    );
  });

  it("removes the companion and its row in one request", async () => {
    await useDeckStore.getState().setCompanion(null);

    expectOneRequestOnly();
    expect(savedDeck().companionId).toBeNull();
    expect(savedRows()).toEqual([{ name: ATRAXA.name, role: "commander" }]);
    expect(shownDeck().companion).toBeNull();
  });

  it("keeps the companion saved and shown when removing it fails", async () => {
    deckApi.changeCommandZone.mockRejectedValueOnce(SERVER_DOWN);

    await useDeckStore.getState().setCompanion(null);

    expect(savedDeck().companionId).toBe(JEGANTHA.id);
    expect(savedRows()).toHaveLength(2);
    expect(shownDeck().companion).toMatchObject({ id: JEGANTHA_ROW.id });
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Could not remove companion — try again"
    );
  });
});

describe("promoteToCommander", () => {
  beforeEach(() => {
    openSavedDeck({ commanderId: ATRAXA.id, commanderName: ATRAXA.name }, [
      ATRAXA_ROW,
      KENRITH_IN_DECK_ROW,
      SOL_RING_ROW,
    ]);
  });

  it("takes the card out of the deck list and seats it as commander in one request", async () => {
    await useDeckStore.getState().promoteToCommander(KENRITH_IN_DECK_ROW.id);

    expectOneRequestOnly();
    expect(savedDeck()).toMatchObject({
      commanderId: KENRITH.id,
      commanderName: KENRITH.name,
    });
    expect(savedRows()).toEqual([
      { name: "Sol Ring", role: "deck" },
      { name: KENRITH.name, role: "commander" },
    ]);
    expect(shownDeck().cards.map((card) => card.name)).toEqual(["Sol Ring"]);
    expect(shownDeck().commander?.name).toBe(KENRITH.name);
  });

  it("puts the card back in the deck list and shows the previous commander again when the request fails", async () => {
    deckApi.changeCommandZone.mockRejectedValueOnce(SERVER_DOWN);

    await useDeckStore.getState().promoteToCommander(KENRITH_IN_DECK_ROW.id);

    expect(savedDeck().commanderId).toBe(ATRAXA.id);
    expect(savedRows()).toHaveLength(3);
    expect(shownDeck().cards.map((card) => card.name)).toEqual([
      KENRITH.name,
      "Sol Ring",
    ]);
    expect(shownDeck().commander).toMatchObject({ id: ATRAXA_ROW.id });
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Could not save commander — try again"
    );
  });
});

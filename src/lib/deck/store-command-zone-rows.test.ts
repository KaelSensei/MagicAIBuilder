/**
 * Command-zone changes as the next load sees them.
 *
 * The editor, the public deck views and the snapshot route find the commander
 * and partner by the `isCommander` / `isPartner` flags on deck rows. A change
 * that leaves the previous row behind brings that card back on the next load.
 *
 * The deck API is the shared in-memory fake (`src/test/fake-deck-client.ts`),
 * holding the open deck: it keeps rows in insertion order and rejects a delete
 * for a row id it does not hold, as the real routes do.
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { ApiDeck } from "@/lib/db/deck-api";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { emptyApiDeck, installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";
import { createEmptyDeck } from "./store-factories";
import type { Deck } from "./types";
import { useDeckStore } from "./store";

const deckApi = installFakeDeckClient();
recordToasts();

/** The open deck as the fake server holds it. */
const server = {
  /** The saved deck, with its rows as `rows`. */
  get saved(): ApiDeck & { readonly rows: ApiDeck["cards"] } {
    const deck = deckApi.savedDeck("deck-1") ?? emptyApiDeck("deck-1");
    return { ...deck, rows: deck.cards };
  },
  /** Deletes every saved row behind the store's back. */
  dropRows(): void {
    const deck = deckApi.savedDeck("deck-1");
    if (deck) deckApi.seedDeck({ ...deck, cards: [] });
  },
};

/**
 * Build the Scryfall card a player picks for the command zone.
 * @param id - Scryfall printing id
 * @param name - Card name
 * @param keywords - Pairing keywords, empty for a lone commander
 * @returns A Scryfall card fixture
 */
function commandCard(
  id: string,
  name: string,
  keywords: readonly string[] = []
): ScryfallCard {
  return {
    id,
    name,
    mana_cost: "{4}",
    cmc: 4,
    type_line: "Legendary Creature",
    oracle_text: keywords.join(", "),
    color_identity: [],
    colors: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "mythic",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [...keywords],
    legalities: { commander: "legal" },
  };
}

const ATRAXA = commandCard("atraxa-printing", "Atraxa, Praetors' Voice");
const KENRITH = commandCard("kenrith-printing", "Kenrith, the Returned King");
const THRASIOS = commandCard("thrasios-printing", "Thrasios, Triton Hero", [
  "Partner",
]);
const TYMNA = commandCard("tymna-printing", "Tymna the Weaver", ["Partner"]);
const KRAUM = commandCard("kraum-printing", "Kraum, Ludevic's Opus", [
  "Partner",
]);

/**
 * Read the open deck.
 * @returns The deck the editor shows
 */
function openDeck(): Deck | undefined {
  return useDeckStore.getState().decks["deck-1"];
}

/**
 * List the command-zone rows the server holds, in load order.
 * @returns Name and slot of every saved commander or partner row
 */
function commandRows(): readonly {
  readonly name: string;
  readonly isPartner: boolean;
}[] {
  return server.saved.rows
    .filter((row) => row.isCommander)
    .map((row) => ({ name: row.name, isPartner: row.isPartner }));
}

describe("command zone after a save and reload", () => {
  beforeEach(() => {
    deckApi.seedDeck({
      ...emptyApiDeck("deck-1", "Command Zone"),
      targetBracket: 3,
    });
    useDeckStore.setState({
      decks: { "deck-1": createEmptyDeck("deck-1", "Command Zone") },
      activeDeckId: "deck-1",
      isSyncing: false,
      undoStack: [],
      gameChangerNames: new Set<string>(),
      bannedNames: new Set<string>(),
    });
  });

  it("holds the saved row id for the commander it shows", async () => {
    await useDeckStore.getState().setCommander(ATRAXA);

    const [row] = server.saved.rows;
    expect(openDeck()?.commander).toMatchObject({
      id: row?.id,
      scryfallId: ATRAXA.id,
    });
    expect(server.saved.commanderId).toBe(ATRAXA.id);
  });

  it("shows the replacement commander, not the one it replaced", async () => {
    await useDeckStore.getState().setCommander(ATRAXA);
    await useDeckStore.getState().setCommander(KENRITH);
    await useDeckStore.getState().forceSave();

    expect(openDeck()?.commander?.name).toBe(KENRITH.name);
    expect(commandRows()).toEqual([{ name: KENRITH.name, isPartner: false }]);
    expect(server.saved.commanderId).toBe(KENRITH.id);
  });

  it("shows the replacement partner, not the one it replaced", async () => {
    await useDeckStore.getState().setCommander(THRASIOS);
    await useDeckStore.getState().setPartner(TYMNA);
    await useDeckStore.getState().setPartner(KRAUM);
    await useDeckStore.getState().forceSave();

    expect(openDeck()?.partner?.name).toBe(KRAUM.name);
    expect(commandRows()).toEqual([
      { name: THRASIOS.name, isPartner: false },
      { name: KRAUM.name, isPartner: true },
    ]);
    expect(server.saved.partnerId).toBe(KRAUM.id);
  });

  it("keeps a removed partner off the command zone", async () => {
    await useDeckStore.getState().setCommander(THRASIOS);
    await useDeckStore.getState().setPartner(TYMNA);
    await useDeckStore.getState().setPartner(null);
    await useDeckStore.getState().forceSave();

    expect(openDeck()?.partner).toBeNull();
    expect(commandRows()).toEqual([{ name: THRASIOS.name, isPartner: false }]);
  });

  it("drops the partner a replacement commander cannot pair with", async () => {
    await useDeckStore.getState().setCommander(THRASIOS);
    await useDeckStore.getState().setPartner(TYMNA);
    await useDeckStore.getState().setCommander(ATRAXA);
    await useDeckStore.getState().forceSave();

    expect(openDeck()?.commander?.name).toBe(ATRAXA.name);
    expect(openDeck()?.partner).toBeNull();
    expect(commandRows()).toEqual([{ name: ATRAXA.name, isPartner: false }]);
    expect(server.saved.partnerId).toBeNull();
  });

  it("keeps the commander cleared when its row is already gone", async () => {
    await useDeckStore.getState().setCommander(ATRAXA);
    server.dropRows();

    await useDeckStore.getState().clearCommander();

    expect(openDeck()?.commander).toBeNull();
    expect(server.saved.commanderId).toBeNull();
  });

  it("keeps a cleared commander and partner cleared", async () => {
    await useDeckStore.getState().setCommander(THRASIOS);
    await useDeckStore.getState().setPartner(TYMNA);
    await useDeckStore.getState().clearCommander();
    await useDeckStore.getState().forceSave();

    expect(openDeck()?.commander).toBeNull();
    expect(openDeck()?.partner).toBeNull();
    expect(commandRows()).toEqual([]);
  });
});

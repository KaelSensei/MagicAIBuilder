/**
 * Command-zone changes as the next load sees them.
 *
 * The editor, the public deck views and the snapshot route find the commander
 * and partner by the `isCommander` / `isPartner` flags on deck rows. A change
 * that leaves the previous row behind brings that card back on the next load.
 *
 * The deck API is replaced by an in-memory server that keeps rows in insertion
 * order and rejects a delete for a row id it does not hold, as the real routes do.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AddCardPayload, ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { createEmptyDeck } from "./store-factories";
import type { CommanderPairingType, Deck } from "./types";

/** Deck fields and rows the fake server persists. */
interface SavedDeck {
  commanderId: string | null;
  commanderName: string | null;
  partnerId: string | null;
  pairingType: CommanderPairingType;
  rows: ApiDeckCard[];
}

/** Deck fields a command-zone change patches. */
type CommandZonePatch = Partial<
  Pick<ApiDeck, "commanderId" | "commanderName" | "partnerId" | "pairingType">
>;

const server = vi.hoisted(() => {
  const saved: SavedDeck = {
    commanderId: null,
    commanderName: null,
    partnerId: null,
    pairingType: "none",
    rows: [],
  };
  let rowCount = 0;

  const toApiDeck = (): ApiDeck => ({
    id: "deck-1",
    name: "Command Zone",
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    companion: null,
    companionId: null,
    maybeboard: [],
    commanderId: saved.commanderId,
    commanderName: saved.commanderName,
    partnerId: saved.partnerId,
    pairingType: saved.pairingType,
    cards: [...saved.rows],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  });

  return {
    saved,
    reset(): void {
      saved.commanderId = null;
      saved.commanderName = null;
      saved.partnerId = null;
      saved.pairingType = "none";
      saved.rows = [];
      rowCount = 0;
    },
    async updateDeck(
      _deckId: string,
      patch: CommandZonePatch
    ): Promise<ApiDeck> {
      if (patch.commanderId !== undefined)
        saved.commanderId = patch.commanderId;
      if (patch.commanderName !== undefined)
        saved.commanderName = patch.commanderName;
      if (patch.partnerId !== undefined) saved.partnerId = patch.partnerId;
      if (patch.pairingType !== undefined)
        saved.pairingType = patch.pairingType;
      return toApiDeck();
    },
    async addCard(
      deckId: string,
      payload: AddCardPayload
    ): Promise<ApiDeckCard> {
      rowCount += 1;
      const row: ApiDeckCard = {
        id: `row-${rowCount}`,
        deckId,
        scryfallId: payload.scryfallId,
        name: payload.name,
        manaCost: payload.manaCost ?? "",
        cmc: payload.cmc ?? 0,
        typeLine: payload.typeLine ?? "",
        oracleText: payload.oracleText ?? "",
        colorIdentity: payload.colorIdentity ?? [],
        isGameChanger: false,
        isBanned: false,
        price: null,
        imageUri: "",
        artCropUri: "",
        category: payload.category === "commander" ? "commander" : "other",
        quantity: 1,
        notes: null,
        isCommander: payload.isCommander ?? false,
        isPartner: payload.isPartner ?? false,
        zone: payload.zone ?? "main",
      };
      saved.rows.push(row);
      return row;
    },
    async removeCard(_deckId: string, cardId: string): Promise<void> {
      const index = saved.rows.findIndex((row) => row.id === cardId);
      if (index === -1) throw new Error("Card not found");
      saved.rows.splice(index, 1);
    },
    async fetchDeck(): Promise<ApiDeck> {
      return toApiDeck();
    },
  };
});

vi.mock(import("@/lib/db/deck-api"), () => ({
  updateDeck: server.updateDeck,
  addCard: server.addCard,
  removeCard: server.removeCard,
  fetchDeck: server.fetchDeck,
}));
vi.mock(import("@/hooks/useToast"), async (importOriginal) => {
  const { useToastStore } = await importOriginal();
  useToastStore.setState({ add: vi.fn() });
  return { useToastStore };
});

const { useDeckStore } = await import("./store");

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
    server.reset();
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
    server.saved.rows = [];

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

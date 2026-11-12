/**
 * Undo history around a bulk text edit.
 *
 * A bulk edit is saved by the server in one change. Undo entries recorded
 * before it name rows the edit may have removed or replaced, so replaying them
 * afterwards would act on a deck that no longer matches them.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import type { DeckCard } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DeckApiRefusal, installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

interface OwnedCard {
  readonly name: string;
  readonly quantity: number;
  readonly scryfallId: string;
}

const collection = vi.hoisted(() => ({
  collectionCards: new Map<string, OwnedCard>(),
}));
const getCardById = vi.hoisted(() => vi.fn());

vi.mock("@/lib/collection/store", () => ({
  useCollectionStore: {
    getState: () => ({
      collectionCards: Object.fromEntries(collection.collectionCards),
      collectionCardsFoil: {},
    }),
  },
}));
vi.mock(import("@/lib/scryfall/client"), () => ({ getCardById }));

import { useDeckStore } from "./store";
import { apiDeckToStoreDeck } from "./store-factories";

const api = installFakeDeckClient();
recordToasts();

/** A saved row, as the API returns it. */
function apiRow(id: string, name: string): ApiDeckCard {
  return {
    id,
    deckId: "deck-1",
    scryfallId: `${id}-printing`,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    notes: null,
    isCommander: false,
    isPartner: false,
    zone: "main",
  };
}

/** The deck as the API returns it, holding these rows. */
function apiDeck(cards: ApiDeckCard[]): ApiDeck {
  return {
    id: "deck-1",
    name: "Artifacts",
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
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
    cards,
  };
}

function scryfallCard(name: string): ScryfallCard {
  return {
    id: `${name.toLowerCase().replaceAll(/\W+/g, "-")}-printing`,
    name,
    mana_cost: "{2}",
    cmc: 2,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmm",
    set_name: "Commander Masters",
    rarity: "uncommon",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
  };
}

function deckCards(): readonly DeckCard[] {
  return useDeckStore.getState().decks["deck-1"]?.cards ?? [];
}

describe("deck store — cards a bulk edit adds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collection.collectionCards.clear();
    useDeckStore.setState({
      decks: { "deck-1": apiDeckToStoreDeck(apiDeck([])) },
      activeDeckId: "deck-1",
      gameChangerNames: new Set(["Mana Vault"]),
      bannedNames: new Set(),
      undoStack: [],
    });
    api.applyCardChanges.mockResolvedValue(apiDeck([]));
  });

  it("adds the printing the player owns, as adding the card by hand does", async () => {
    collection.collectionCards.set("owned", {
      name: "Sol Ring",
      quantity: 1,
      scryfallId: "sol-ring-owned-printing",
    });
    getCardById.mockResolvedValue({
      ...scryfallCard("Sol Ring"),
      id: "sol-ring-owned-printing",
    });

    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [],
      quantityChanges: [],
      additions: [
        { card: scryfallCard("Sol Ring"), quantity: 1, zone: "main" },
      ],
      commandZone: null,
    });

    expect(api.applyCardChanges).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        addCards: [
          expect.objectContaining({
            name: "Sol Ring",
            scryfallId: "sol-ring-owned-printing",
          }),
        ],
      })
    );
  });

  it("flags a Game Changer it adds", async () => {
    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [],
      quantityChanges: [],
      additions: [
        { card: scryfallCard("Mana Vault"), quantity: 1, zone: "main" },
      ],
      commandZone: null,
    });

    expect(api.applyCardChanges).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        addCards: [
          expect.objectContaining({ name: "Mana Vault", isGameChanger: true }),
        ],
      })
    );
  });

  it("keeps the open deck and its history when the server refuses the edit", async () => {
    const before = useDeckStore.getState().decks["deck-1"];
    useDeckStore.setState({
      undoStack: [
        {
          type: "MOVE_ZONE",
          deckId: "deck-1",
          cardId: "x",
          from: "main",
          to: "sideboard",
        },
      ],
    });
    api.applyCardChanges.mockRejectedValue(new DeckApiRefusal(409));

    await expect(
      useDeckStore.getState().applyBulkEdit({
        removedCardIds: ["x"],
        quantityChanges: [],
        additions: [],
        commandZone: null,
      })
    ).rejects.toThrow("HTTP 409");

    expect(useDeckStore.getState().decks["deck-1"]).toBe(before);
    expect(useDeckStore.getState().undoStack).toHaveLength(1);
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

describe("deck store — the deck version a bulk edit carries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collection.collectionCards.clear();
    useDeckStore.setState({
      decks: { "deck-1": apiDeckToStoreDeck({ ...apiDeck([]), version: 7 }) },
      activeDeckId: "deck-1",
      gameChangerNames: new Set(),
      bannedNames: new Set(),
      undoStack: [],
    });
  });

  it("sends the version the deck was read at and adopts the one the server answers", async () => {
    api.applyCardChanges.mockResolvedValue({ ...apiDeck([]), version: 8 });

    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [],
      quantityChanges: [],
      additions: [
        { card: scryfallCard("Sol Ring"), quantity: 1, zone: "main" },
      ],
      commandZone: null,
    });

    expect(api.applyCardChanges).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({ expectedVersion: 7 })
    );
    expect(useDeckStore.getState().decks["deck-1"]?.version).toBe(8);
  });

  it("sends the version a card added by hand was answered with, not the one the deck was read at", async () => {
    // The hand-made add moved the server's version past the one read; the
    // bulk edit carries the one the add answered, or it would be refused for
    // a change this very tab made.
    api.addCard.mockResolvedValue({
      ...apiRow("sol-ring-row", "Sol Ring"),
      version: 8,
    });
    api.applyCardChanges.mockResolvedValue(apiDeck([]));
    await useDeckStore.getState().addCard(scryfallCard("Sol Ring"));

    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: ["sol-ring-row"],
      quantityChanges: [],
      additions: [],
      commandZone: null,
    });

    const [, changes] = api.applyCardChanges.mock.calls[0] ?? [];
    expect(changes).toBeDefined();
    expect(changes?.expectedVersion).toBe(8);
  });
});

describe("deck store — undo after a bulk edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const removedSolRing = apiDeckToStoreDeck(
      apiDeck([apiRow("sol-ring-old", "Sol Ring")])
    ).cards[0];
    useDeckStore.setState({
      decks: {
        "deck-1": apiDeckToStoreDeck(
          apiDeck([apiRow("signet-row", "Arcane Signet")])
        ),
      },
      activeDeckId: "deck-1",
      gameChangerNames: new Set(),
      bannedNames: new Set(),
      // The player removed Sol Ring before opening Bulk Edit.
      undoStack: removedSolRing
        ? [{ type: "REMOVE_CARD", deckId: "deck-1", card: removedSolRing }]
        : [],
    });
  });

  it("does not replay a removal that the bulk edit already undid", async () => {
    // The bulk edit types Sol Ring back in.
    api.applyCardChanges.mockResolvedValue(
      apiDeck([
        apiRow("signet-row", "Arcane Signet"),
        apiRow("sol-ring-new", "Sol Ring"),
      ])
    );
    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [],
      quantityChanges: [],
      additions: [
        { card: scryfallCard("Sol Ring"), quantity: 1, zone: "main" },
      ],
      commandZone: null,
    });

    await useDeckStore.getState().undo();

    expect(deckCards().filter((card) => card.name === "Sol Ring")).toHaveLength(
      1
    );
    expect(api.addCard).not.toHaveBeenCalled();
  });

  it("undoes a card added after the bulk edit", async () => {
    api.applyCardChanges.mockResolvedValue(
      apiDeck([apiRow("signet-row", "Arcane Signet")])
    );
    api.addCard.mockImplementation(async (_target, payload) =>
      apiRow("thought-vessel-row", payload.name)
    );
    api.removeCard.mockResolvedValue(undefined);
    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [],
      quantityChanges: [{ cardId: "signet-row", quantity: 1 }],
      additions: [],
      commandZone: null,
    });
    await useDeckStore.getState().addCard(scryfallCard("Thought Vessel"));

    await useDeckStore.getState().undo();

    expect(api.removeCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      "thought-vessel-row"
    );
    expect(deckCards().map((card) => card.name)).toEqual(["Arcane Signet"]);
  });
});

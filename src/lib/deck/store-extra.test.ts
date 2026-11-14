/**
 * Unit tests for previously-uncovered deck store actions.
 *
 * Covers: undo, setCommander, clearCommander, setPartner, setCompanion,
 * updateCardQuantity, updateCardNotes, moveCardToZone, addToMaybeboard,
 * removeFromMaybeboard, moveToMaybeboard, moveToDeck, updateDeckDescription,
 * addTag, removeTag, duplicateDeck, setDeckGridCols.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const toastAdd = vi.hoisted(() => vi.fn());

vi.mock(import("@/lib/db/deck-api"), () => ({
  // The store's own PATCHes read the write budget from the client module.
  DECK_WRITE_TIMEOUT_MS: 15_000 as const,
  fetchDecks: vi
    .fn()
    .mockResolvedValue({ decks: [], total: 0, page: 0, limit: 20 }),
  createDeck: vi.fn().mockResolvedValue({
    id: "deck-1",
    name: "Test Deck",
    format: "commander",
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    commanderId: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    cards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  updateDeck: vi.fn().mockResolvedValue({}),
  deleteDeck: vi.fn().mockResolvedValue(undefined),
  addCard: vi.fn().mockResolvedValue({
    id: "saved-db-id",
    deckId: "deck-1",
    scryfallId: "scryfall-id-1",
    name: "Lightning Bolt",
    manaCost: "{R}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Deal 3 damage.",
    colorIdentity: ["R"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    zone: "main",
  }),
  removeCard: vi.fn().mockResolvedValue(undefined),
  updateCardCategory: vi.fn().mockResolvedValue({}),
  updateCardNotes: vi.fn().mockResolvedValue({}),
  updateCardZone: vi.fn().mockResolvedValue({}),
  // Answers each added command-zone row under the saved id `saved-db-id`.
  changeCommandZone: vi
    .fn()
    .mockImplementation(
      async (
        deckId: string,
        change: { readonly addCards: readonly Record<string, unknown>[] }
      ) => ({
        cards: change.addCards.map((payload) => ({
          ...payload,
          id: "saved-db-id",
          deckId,
          notes: null,
        })),
        version: 1,
      })
    ),
}));

vi.mock(import("@/hooks/useToast"), async (importOriginal) => {
  const { useToastStore } = await importOriginal();
  useToastStore.setState({ add: toastAdd });
  return { useToastStore };
});

import * as deckApi from "@/lib/db/deck-api";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

const { useDeckStore } = await import("@/lib/deck/store");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeActiveDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeScryfallCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "scryfall-id-1",
    name: "Lightning Bolt",
    mana_cost: "{R}",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Deal 3 damage.",
    color_identity: ["R"],
    colors: ["R"],
    set: "lea",
    set_name: "Limited Edition Alpha",
    rarity: "common",
    prices: { usd: "1.00", usd_foil: null, eur: null },
    image_uris: {
      small: "",
      normal: "",
      large: "",
      art_crop: "",
      border_crop: "",
      png: "",
    },
    card_faces: undefined,
    keywords: [],
    legalities: { commander: "legal" },
    ...overrides,
  };
}

function makeDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Counterspell",
    manaCost: "{U}{U}",
    cmc: 2,
    typeLine: "Instant",
    oracleText: "Counter target spell.",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function seedDeck(deck: Deck = makeActiveDeck()): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    gameChangerNames: new Set<string>(),
    bannedNames: new Set<string>(),
    undoStack: [],
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useDeckStore — undo", () => {
  beforeEach(() => seedDeck());

  it("does not announce a late successful undo for a deleted deck", async () => {
    const card = makeDeckCard();
    seedDeck(makeActiveDeck({ cards: [card] }));
    useDeckStore.setState({
      undoStack: [{ type: "ADD_CARD", deckId: "deck-1", card }],
    });
    const pending = Promise.withResolvers<deckApi.VersionedAnswer>();
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pending.promise);
    vi.mocked(deckApi.deleteDeck).mockResolvedValueOnce(undefined);
    toastAdd.mockClear();
    const undo = useDeckStore.getState().undo();

    await useDeckStore.getState().deleteDeck("deck-1");
    pending.resolve({});
    await undo;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(useDeckStore.getState().undoStack).toEqual([]);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("does not announce a late successful restoration for a deleted deck", async () => {
    const card = makeDeckCard();
    useDeckStore.setState({
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });
    const pending =
      Promise.withResolvers<Awaited<ReturnType<typeof deckApi.addCard>>>();
    vi.mocked(deckApi.addCard).mockReturnValueOnce(pending.promise);
    vi.mocked(deckApi.deleteDeck).mockResolvedValueOnce(undefined);
    toastAdd.mockClear();
    const undo = useDeckStore.getState().undo();

    await useDeckStore.getState().deleteDeck("deck-1");
    pending.resolve({
      ...card,
      id: "saved-card",
      deckId: "deck-1",
      scryfallId: card.id,
      isCommander: false,
      isPartner: false,
    });
    await undo;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(useDeckStore.getState().undoStack).toEqual([]);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("does not restore a failed pending addition undo after its deck is deleted", async () => {
    const card = makeDeckCard();
    const action: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: "deck-1",
      card,
    };
    seedDeck(makeActiveDeck({ cards: [card] }));
    useDeckStore.setState({ undoStack: [action] });
    const pending = Promise.withResolvers<deckApi.VersionedAnswer>();
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pending.promise);
    vi.mocked(deckApi.deleteDeck).mockResolvedValueOnce(undefined);
    const undo = useDeckStore.getState().undo();

    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("Deck deleted"));
    await undo;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(useDeckStore.getState().undoStack).toEqual([]);
  });

  it("does not restore a failed pending removal undo after its deck is deleted", async () => {
    const action: import("@/lib/deck/store").DeckAction = {
      type: "REMOVE_CARD",
      deckId: "deck-1",
      card: makeDeckCard(),
    };
    useDeckStore.setState({ undoStack: [action] });
    const pending =
      Promise.withResolvers<Awaited<ReturnType<typeof deckApi.addCard>>>();
    vi.mocked(deckApi.addCard).mockReturnValueOnce(pending.promise);
    vi.mocked(deckApi.deleteDeck).mockResolvedValueOnce(undefined);
    const undo = useDeckStore.getState().undo();

    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("Deck deleted"));
    await undo;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(useDeckStore.getState().undoStack).toEqual([]);
  });

  it("keeps another deck's undo usable after deleting the latest action's deck", async () => {
    const card = makeDeckCard();
    const deletedCard = makeDeckCard({ id: "deleted-card" });
    const retainedAction: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: "deck-1",
      card,
    };
    const deletedAction: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: "deck-2",
      card: deletedCard,
    };
    useDeckStore.setState({
      decks: {
        "deck-1": makeActiveDeck({ cards: [card] }),
        "deck-2": makeActiveDeck({ id: "deck-2", cards: [deletedCard] }),
      },
      undoStack: [retainedAction, deletedAction],
    });
    vi.mocked(deckApi.deleteDeck).mockResolvedValueOnce(undefined);
    vi.mocked(deckApi.removeCard).mockClear();

    await useDeckStore.getState().deleteDeck("deck-2");

    expect(useDeckStore.getState().undoStack).toEqual([retainedAction]);
    expect(useDeckStore.getState().activeDeckId).toBe("deck-1");
    await useDeckStore.getState().undo();
    expect(deckApi.removeCard).toHaveBeenCalledWith({ deckId: "deck-1" }, card.id);
    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([]);
  });

  it("preserves the deck and undo history when deletion is rejected", async () => {
    const deck = makeActiveDeck();
    const action: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: deck.id,
      card: makeDeckCard(),
    };
    useDeckStore.setState({ decks: { [deck.id]: deck }, undoStack: [action] });
    vi.mocked(deckApi.deleteDeck).mockRejectedValueOnce(
      new Error("Deletion rejected")
    );

    await expect(useDeckStore.getState().deleteDeck(deck.id)).rejects.toThrow(
      "Deletion rejected"
    );

    expect(useDeckStore.getState().decks[deck.id]).toEqual(deck);
    expect(useDeckStore.getState().undoStack).toEqual([action]);
    expect(useDeckStore.getState().activeDeckId).toBe(deck.id);
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("preserves cards and the undo action when name-only matching is ambiguous", async () => {
    const cards = ["printing-1", "printing-2"].map((id) =>
      makeDeckCard({ id, name: "Counterspell", isMaybeboard: false })
    );
    const action: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: "deck-1",
      card: makeDeckCard({ id: "missing-id", name: "Counterspell" }),
    };
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards }) },
      undoStack: [action],
    });
    vi.mocked(deckApi.removeCard).mockClear();
    toastAdd.mockClear();

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual(cards);
    expect(useDeckStore.getState().undoStack).toEqual([action]);
    expect(deckApi.removeCard).not.toHaveBeenCalled();
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
  });

  it("undoes the recorded card rather than an earlier printing with the same name", async () => {
    const earlier = makeDeckCard({
      id: "earlier-printing",
      name: "Counterspell",
      isMaybeboard: false,
    });
    const added = makeDeckCard({
      id: "added-printing",
      name: "Counterspell",
      isMaybeboard: false,
    });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [earlier, added] }) },
      undoStack: [{ type: "ADD_CARD", deckId: "deck-1", card: added }],
    });

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([earlier]);
    expect(deckApi.removeCard).toHaveBeenLastCalledWith(
      { deckId: "deck-1" },
      "added-printing"
    );
  });

  it.each(["ADD_CARD", "REMOVE_CARD"])(
    "preserves %s undo when its deck is not loaded",
    async (type) => {
      const card = makeDeckCard({ id: "card-1" });
      const action: import("@/lib/deck/store").DeckAction =
        type === "ADD_CARD"
          ? { type: "ADD_CARD", deckId: "unloaded-deck", card }
          : { type: "REMOVE_CARD", deckId: "unloaded-deck", card };
      useDeckStore.setState({ undoStack: [action] });
      toastAdd.mockClear();
      vi.mocked(deckApi.addCard).mockClear();
      vi.mocked(deckApi.removeCard).mockClear();

      await useDeckStore.getState().undo();

      expect(useDeckStore.getState().undoStack).toEqual([action]);
      expect(deckApi.addCard).not.toHaveBeenCalled();
      expect(deckApi.removeCard).not.toHaveBeenCalled();
      expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    }
  );

  it("does not add a duplicate when a removed card is already present", async () => {
    const card = makeDeckCard({
      id: "card-1",
      isMaybeboard: false,
      zone: "sideboard",
      quantity: 3,
    });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card] }) },
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });
    vi.mocked(deckApi.addCard).mockClear();

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([card]);
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  it("uses the printing identifier when restoring a removed card", async () => {
    const card = makeDeckCard({ id: "old-row-id", scryfallId: "printing-id" });
    useDeckStore.setState({
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });
    await useDeckStore.getState().undo();
    expect(deckApi.addCard).toHaveBeenLastCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({ scryfallId: "printing-id" })
    );
  });

  it("uses the saved row identifier for subsequent removal of a restored card", async () => {
    const card = makeDeckCard({
      id: "old-row-id",
      scryfallId: "printing-id",
      zone: "sideboard",
      quantity: 3,
    });
    useDeckStore.setState({
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });
    await useDeckStore.getState().undo();
    const restored = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((entry) => entry.name === card.name);
    expect(restored).toMatchObject({
      id: "saved-db-id",
      scryfallId: "printing-id",
      zone: "sideboard",
      quantity: 3,
    });
    await useDeckStore.getState().removeCard("saved-db-id");
    expect(deckApi.removeCard).toHaveBeenLastCalledWith(
      { deckId: "deck-1" },
      "saved-db-id"
    );
  });

  it("removes the unsaved restored card and keeps retry when undoing a removal fails", async () => {
    const card = makeDeckCard({ id: "card-1", zone: "sideboard", quantity: 3 });
    const action: import("@/lib/deck/store").DeckAction = {
      type: "REMOVE_CARD",
      deckId: "deck-1",
      card,
    };
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [] }) },
      undoStack: [action],
    });
    toastAdd.mockClear();
    vi.mocked(deckApi.addCard).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(0);
    expect(useDeckStore.getState().undoStack).toEqual([action]);
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    expect(toastAdd).not.toHaveBeenCalledWith("info", expect.any(String));
  });

  it("restores the card and retry action when undoing an addition fails", async () => {
    const card = makeDeckCard({
      id: "card-1",
      isMaybeboard: false,
      quantity: 3,
      zone: "sideboard",
    });
    const action: import("@/lib/deck/store").DeckAction = {
      type: "ADD_CARD",
      deckId: "deck-1",
      card,
    };
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card] }) },
      undoStack: [action],
    });
    toastAdd.mockClear();
    vi.mocked(deckApi.removeCard).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([card]);
    expect(useDeckStore.getState().undoStack).toEqual([action]);
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    expect(toastAdd).not.toHaveBeenCalledWith("info", expect.any(String));
  });

  it.each(["ADD_CARD", "REMOVE_CARD"])(
    "targets the recorded deck for %s after switching decks",
    async (type) => {
      const card = makeDeckCard({
        id: "card-1",
        name: "Counterspell",
        isMaybeboard: false,
      });
      const recordedAction: import("@/lib/deck/store").DeckAction =
        type === "ADD_CARD"
          ? { type: "ADD_CARD", deckId: "deck-1", card }
          : { type: "REMOVE_CARD", deckId: "deck-1", card };
      useDeckStore.setState({
        decks: {
          "deck-1": makeActiveDeck({
            cards: type === "ADD_CARD" ? [card] : [],
          }),
          "deck-2": makeActiveDeck({ id: "deck-2", cards: [card] }),
        },
        activeDeckId: "deck-2",
        undoStack: [recordedAction],
      });

      await useDeckStore.getState().undo();

      expect(useDeckStore.getState().decks["deck-2"].cards).toEqual([card]);
      expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(
        type === "ADD_CARD" ? 0 : 1
      );
      expect(useDeckStore.getState().activeDeckId).toBe("deck-2");
    }
  );

  it("does nothing when undo stack is empty", async () => {
    useDeckStore.setState({ undoStack: [] });
    await useDeckStore.getState().undo();
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("undoes ADD_CARD by removing the card", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
      undoStack: [{ type: "ADD_CARD", deckId: "deck-1", card }],
    });

    await useDeckStore.getState().undo();

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(0);
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("undoes REMOVE_CARD by re-adding the card", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [] }) },
      activeDeckId: "deck-1",
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });

    await useDeckStore.getState().undo();

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].name).toBe("Counterspell");
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("pops the last action from undo stack", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    const card2 = makeDeckCard({ id: "card-2", name: "Force of Will" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card, card2] }) },
      activeDeckId: "deck-1",
      undoStack: [
        { type: "ADD_CARD", deckId: "deck-1", card },
        { type: "ADD_CARD", deckId: "deck-1", card: card2 },
      ],
    });

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().undoStack).toHaveLength(1);
    const deck = useDeckStore.getState().decks["deck-1"];
    // card2 was removed (last undo)
    expect(deck.cards.find((c) => c.name === "Force of Will")).toBeUndefined();
  });
});

describe("useDeckStore — setCommander", () => {
  beforeEach(() => seedDeck());

  it("sets the commander on the active deck", async () => {
    const card = makeScryfallCard({ name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.name).toBe("Atraxa");
  });

  it("sets commander category to commander", async () => {
    const card = makeScryfallCard({ name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.category).toBe("commander");
  });

  it("sends the commander's printing id in the one command-zone request", async () => {
    const card = makeScryfallCard({ id: "atraxa-id", name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    expect(deckApi.changeCommandZone).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        commandZone: expect.objectContaining({ commanderId: "atraxa-id" }),
      })
    );
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });

  it("marks commander as game changer when name is in gameChangerNames", async () => {
    useDeckStore.setState({ gameChangerNames: new Set(["Rhystic Study"]) });
    const card = makeScryfallCard({ name: "Rhystic Study" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.isGameChanger).toBe(true);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.changeCommandZone).mockClear();
    await useDeckStore.getState().setCommander(makeScryfallCard());
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — clearCommander", () => {
  beforeEach(() => {
    const deck = makeActiveDeck({
      commander: makeDeckCard({
        id: "cmd-1",
        name: "Atraxa",
        category: "commander",
      }),
    });
    seedDeck(deck);
  });

  it("clears the commander", async () => {
    await useDeckStore.getState().clearCommander();
    expect(useDeckStore.getState().decks["deck-1"].commander).toBeNull();
  });

  it("clears the partner as well", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          partner: makeDeckCard({ name: "Partner" }),
        },
      },
    }));
    await useDeckStore.getState().clearCommander();
    expect(useDeckStore.getState().decks["deck-1"].partner).toBeNull();
  });

  it("empties the commander and partner fields in the one command-zone request", async () => {
    await useDeckStore.getState().clearCommander();
    expect(deckApi.changeCommandZone).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        clearCommandSlots: ["commander", "partner"],
        commandZone: expect.objectContaining({
          commanderId: null,
          partnerId: null,
        }),
      })
    );
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.changeCommandZone).mockClear();
    await useDeckStore.getState().clearCommander();
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — setPartner", () => {
  beforeEach(() => seedDeck());

  it("keeps a Father & son pair unchanged when given a generic Partner", async () => {
    const previousPartner = makeDeckCard({
      id: "atreus",
      name: "Atreus, Impulsive Son",
      typeLine: "Legendary Creature — God Archer",
      oracleText:
        "Partner—Father & son (You can have two commanders if both have this ability.)",
    });
    seedDeck(
      makeActiveDeck({
        commander: makeDeckCard({
          id: "kratos",
          name: "Kratos, Stoic Father",
          typeLine: "Legendary Creature — God Warrior",
          oracleText:
            "Partner—Father & son (You can have two commanders if both have this ability.)",
        }),
        partner: previousPartner,
        pairingType: "father_son",
      })
    );
    vi.mocked(deckApi.changeCommandZone).mockClear();
    toastAdd.mockClear();

    await useDeckStore.getState().setPartner(
      makeScryfallCard({
        name: "Tymna the Weaver",
        type_line: "Legendary Creature — Human Cleric",
        keywords: ["Partner"],
        oracle_text:
          "Partner (You can have two commanders if both have partner.)",
      })
    );

    expect(useDeckStore.getState().decks["deck-1"].partner).toEqual(
      previousPartner
    );
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
    expect(toastAdd).toHaveBeenCalledWith(
      "warning",
      "Tymna the Weaver cannot share the command zone with Kratos, Stoic Father."
    );
  });

  it("sets partner on the active deck", async () => {
    const card = makeScryfallCard({
      name: "Tana, the Bloodsower",
      keywords: ["Partner"],
    });
    await useDeckStore.getState().setPartner(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner?.name).toBe("Tana, the Bloodsower");
  });

  it("clears partner when null is passed", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          partner: makeDeckCard({ name: "Tana" }),
        },
      },
    }));
    await useDeckStore.getState().setPartner(null);

    expect(useDeckStore.getState().decks["deck-1"].partner).toBeNull();
  });

  it("sends the partner's printing id in the one command-zone request", async () => {
    const card = makeScryfallCard({ id: "tana-id", name: "Tana" });
    await useDeckStore.getState().setPartner(card);
    expect(deckApi.changeCommandZone).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        clearCommandSlots: ["partner"],
        commandZone: expect.objectContaining({ partnerId: "tana-id" }),
      })
    );
  });

  it("restores the previous partner when saving the replacement fails", async () => {
    const previousPartner = makeDeckCard({
      id: "previous-partner",
      name: "Tana, the Bloodsower",
      category: "commander",
    });
    seedDeck(
      makeActiveDeck({
        partner: previousPartner,
        pairingType: "partner",
      })
    );
    vi.mocked(deckApi.changeCommandZone).mockRejectedValueOnce(
      new Error("Save failed")
    );
    toastAdd.mockClear();

    await useDeckStore.getState().setPartner(
      makeScryfallCard({
        id: "replacement-partner",
        name: "Tymna the Weaver",
        keywords: ["Partner"],
      })
    );

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner).toEqual(previousPartner);
    expect(deck.pairingType).toBe("partner");
    expect(toastAdd).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("partner")
    );
  });

  it("restores the previous partner when clearing it fails", async () => {
    const previousPartner = makeDeckCard({
      id: "previous-partner",
      name: "Tana, the Bloodsower",
      category: "commander",
    });
    seedDeck(
      makeActiveDeck({
        partner: previousPartner,
        pairingType: "partner",
      })
    );
    vi.mocked(deckApi.changeCommandZone).mockRejectedValueOnce(
      new Error("Save failed")
    );
    toastAdd.mockClear();

    await useDeckStore.getState().setPartner(null);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner).toEqual(previousPartner);
    expect(deck.pairingType).toBe("partner");
    expect(toastAdd).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("partner")
    );
  });

  it("restores the previous partner when the one request that saves the replacement fails", async () => {
    const previousPartner = makeDeckCard({
      id: "previous-partner",
      name: "Tana, the Bloodsower",
      category: "commander",
    });
    seedDeck(
      makeActiveDeck({
        partner: previousPartner,
        pairingType: "partner",
      })
    );
    vi.mocked(deckApi.changeCommandZone).mockRejectedValueOnce(
      new Error("Save failed")
    );
    toastAdd.mockClear();

    await useDeckStore.getState().setPartner(
      makeScryfallCard({
        id: "replacement-partner",
        name: "Tymna the Weaver",
        keywords: ["Partner"],
      })
    );

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner).toEqual(previousPartner);
    expect(deck.pairingType).toBe("partner");
    expect(toastAdd).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("partner")
    );
  });

  it("does not roll back a newer partner when an older save fails", async () => {
    const previousPartner = makeDeckCard({
      id: "previous-partner",
      name: "Tana, the Bloodsower",
      category: "commander",
    });
    seedDeck(
      makeActiveDeck({
        partner: previousPartner,
        pairingType: "partner",
      })
    );
    const failedUpdate =
      Promise.withResolvers<
        Awaited<ReturnType<typeof deckApi.changeCommandZone>>
      >();
    vi.mocked(deckApi.changeCommandZone).mockReturnValueOnce(
      failedUpdate.promise
    );
    toastAdd.mockClear();

    const failedSave = useDeckStore.getState().setPartner(
      makeScryfallCard({
        id: "replacement-partner",
        name: "Tymna the Weaver",
        keywords: ["Partner"],
      })
    );
    const newerSave = useDeckStore.getState().setPartner(
      makeScryfallCard({
        id: "newer-partner",
        name: "Thrasios, Triton Hero",
        keywords: ["Partner"],
      })
    );
    failedUpdate.reject(new Error("Save failed"));
    await Promise.all([failedSave, newerSave]);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner?.scryfallId).toBe("newer-partner");
    expect(deck.partner?.name).toBe("Thrasios, Triton Hero");
    expect(toastAdd).not.toHaveBeenCalledWith(
      "error",
      expect.stringContaining("partner")
    );
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.changeCommandZone).mockClear();
    await useDeckStore.getState().setPartner(makeScryfallCard());
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
  });

  it("supports Choose a Background commander + Background partner without replacing commander", async () => {
    const jaheira = makeScryfallCard({
      id: "jaheira-id",
      name: "Jaheira, Friend of the Forest",
      type_line: "Legendary Creature — Elf Druid",
      oracle_text: "Choose a Background",
      keywords: [],
    });
    const clanCrafter = makeScryfallCard({
      id: "clan-crafter-id",
      name: "Clan Crafter",
      type_line: "Legendary Enchantment — Background",
      oracle_text: "Commander creatures you own have ...",
      keywords: [],
    });

    await useDeckStore.getState().setCommander(jaheira);
    await useDeckStore.getState().setPartner(clanCrafter);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.name).toBe("Jaheira, Friend of the Forest");
    expect(deck.partner?.name).toBe("Clan Crafter");
    expect(deck.pairingType).toBe("background");
  });
});

describe("useDeckStore — setCompanion", () => {
  beforeEach(() =>
    seedDeck(
      makeActiveDeck({
        commander: makeDeckCard({
          id: "cmd-1",
          name: "Kenrith, the Returned King",
          category: "commander",
          colorIdentity: ["W", "U", "B", "R", "G"],
          cmc: 5,
        }),
      })
    )
  );

  it("sets companion on the active deck", async () => {
    const card = makeScryfallCard({
      id: "lurrus-sf",
      name: "Lurrus of the Dream-Den",
      keywords: ["Companion"],
      type_line: "Legendary Creature — Cat Nightmare",
      color_identity: ["W", "B"],
      cmc: 3,
    });
    await useDeckStore.getState().setCompanion(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.companion?.name).toBe("Lurrus of the Dream-Den");
    expect(deck.companion?.id).toBe("saved-db-id");
  });

  it("clears companion when null is passed", async () => {
    vi.mocked(deckApi.changeCommandZone).mockClear();
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          companion: makeDeckCard({
            id: "companion-db-id",
            name: "Lurrus",
            category: "companion",
          }),
        },
      },
    }));
    await useDeckStore.getState().setCompanion(null);
    expect(useDeckStore.getState().decks["deck-1"].companion).toBeNull();
    expect(deckApi.changeCommandZone).toHaveBeenCalledWith("deck-1", {
      removeCardIds: [],
      clearCommandSlots: ["companion"],
      addCards: [],
      commandZone: { companionId: null },
    });
  });

  it("sends the companion's printing id in the one command-zone request", async () => {
    const card = makeScryfallCard({
      id: "lurrus-id",
      name: "Lurrus of the Dream-Den",
      keywords: ["Companion"],
      type_line: "Legendary Creature — Cat Nightmare",
      color_identity: ["W", "B"],
      cmc: 3,
    });
    vi.mocked(deckApi.changeCommandZone).mockClear();
    await useDeckStore.getState().setCompanion(card);
    expect(deckApi.changeCommandZone).toHaveBeenCalledWith(
      "deck-1",
      expect.objectContaining({
        clearCommandSlots: ["companion"],
        commandZone: { companionId: "lurrus-id" },
      })
    );
  });

  it("does not set companion without a commander", async () => {
    seedDeck(makeActiveDeck({ commander: null }));
    const card = makeScryfallCard({
      name: "Lurrus of the Dream-Den",
      keywords: ["Companion"],
    });
    await useDeckStore.getState().setCompanion(card);
    expect(useDeckStore.getState().decks["deck-1"].companion).toBeNull();
  });
});

describe("useDeckStore failed removal recovery", () => {
  it("restores card order while preserving a later successful removal", async () => {
    const cards = ["card-1", "card-2", "card-3"].map((id) =>
      makeDeckCard({ id })
    );
    seedDeck(makeActiveDeck({ cards }));
    let finishRemoval = () => {};
    const pendingRemoval = new Promise<void>((resolve) => {
      finishRemoval = resolve;
    });
    vi.mocked(deckApi.removeCard).mockImplementationOnce(async () => {
      await pendingRemoval;
      throw new Error("offline");
    });

    const rejectedRemoval = useDeckStore.getState().removeCard("card-2");
    // One deck, one write at a time: card-1 leaves once card-2's removal settles.
    const laterRemoval = useDeckStore.getState().removeCard("card-1");
    finishRemoval();
    await Promise.all([rejectedRemoval, laterRemoval]);

    expect(
      useDeckStore.getState().decks["deck-1"].cards.map((card) => card.id)
    ).toEqual(["card-2", "card-3"]);
    expect(useDeckStore.getState().undoStack).toHaveLength(1);
    const undoAction = useDeckStore.getState().undoStack[0];
    expect(undoAction?.type).toBe("REMOVE_CARD");
    if (undoAction?.type !== "REMOVE_CARD") return;
    expect(undoAction.card.id).toBe("card-1");
  });

  it("restores a rejected removal without leaving a false undo entry", async () => {
    const card = makeDeckCard({
      id: "card-1",
      zone: "sideboard",
      isMaybeboard: false,
      quantity: 3,
    });
    seedDeck(makeActiveDeck({ cards: [card] }));
    vi.mocked(deckApi.removeCard).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().removeCard("card-1");

    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([card]);
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
  });
});

describe("useDeckStore category save recovery", () => {
  it("restores the confirmed category when two rapid saves fail", async () => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", category: "instant" })],
      })
    );
    vi.mocked(deckApi.updateCardCategory)
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"));

    const first = useDeckStore.getState().updateCardCategory("card-1", "ramp");
    const second = useDeckStore.getState().updateCardCategory("card-1", "draw");
    await Promise.all([first, second]);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].category).toBe(
      "instant"
    );
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("saves rapid category edits in order", async () => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", category: "instant" })],
      })
    );
    let finishFirst = () => {};
    const pendingFirst = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    // Only this test's calls count: the first one is sent a few ticks later
    // than it used to be, so a stale count would satisfy the wait below.
    vi.mocked(deckApi.updateCardCategory).mockClear();
    vi.mocked(deckApi.updateCardCategory).mockImplementationOnce(async () => {
      await pendingFirst;
      throw new Error("offline");
    });
    const first = useDeckStore.getState().updateCardCategory("card-1", "ramp");
    await vi.waitFor(() =>
      expect(deckApi.updateCardCategory).toHaveBeenCalled()
    );
    const callsBeforeSecond = vi.mocked(deckApi.updateCardCategory).mock.calls
      .length;
    const second = useDeckStore.getState().updateCardCategory("card-1", "draw");
    await Promise.resolve();
    const callsWithFirstPending = vi.mocked(deckApi.updateCardCategory).mock
      .calls.length;
    finishFirst();
    await Promise.all([first, second]);

    expect(callsWithFirstPending).toBe(callsBeforeSecond);
    expect(useDeckStore.getState().decks["deck-1"].cards[0].category).toBe(
      "draw"
    );
  });

  it("restores the previous category and warns when saving fails", async () => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", category: "instant" })],
      })
    );
    vi.mocked(deckApi.updateCardCategory).mockRejectedValueOnce(
      new Error("offline")
    );

    await useDeckStore.getState().updateCardCategory("card-1", "ramp");

    expect(useDeckStore.getState().decks["deck-1"].cards[0].category).toBe(
      "instant"
    );
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

describe("useDeckStore — updateCardNotes", () => {
  beforeEach(() => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", name: "Counterspell" })],
      })
    );
  });
  it("keeps saving visible while a note is pending and a zone move waits behind it", async () => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", notes: "Saved note" })],
      })
    );
    let finishNote = () => {};
    const pendingNote = new Promise<void>((resolve) => {
      finishNote = resolve;
    });
    vi.mocked(deckApi.updateCardNotes).mockImplementationOnce(async () => {
      await pendingNote;
      throw new Error("offline");
    });

    const note = useDeckStore.getState().updateCardNotes("card-1", "New note");
    const move = useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    await vi.waitFor(() => expect(deckApi.updateCardNotes).toHaveBeenCalled());
    const savingWithNotePending = useDeckStore.getState().isSyncing;
    finishNote();
    await Promise.all([note, move]);

    expect(savingWithNotePending).toBe(true);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(useDeckStore.getState().decks["deck-1"].cards[0]).toMatchObject({
      notes: "Saved note",
      zone: "sideboard",
    });
  });

  it("updates notes optimistically", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", "Draw 2");
    const card = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBe("Draw 2");
  });

  it("restores saved notes and notifies after a failed save", async () => {
    vi.mocked(deckApi.updateCardNotes).mockRejectedValueOnce(
      new Error("offline")
    );
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", notes: "Saved note" })],
      })
    );

    await useDeckStore.getState().updateCardNotes("card-1", "Unsaved note");

    expect(useDeckStore.getState().decks["deck-1"].cards[0].notes).toBe(
      "Saved note"
    );
    expect(toastAdd).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("notes")
    );
  });

  it("restores the confirmed note after two rapid edits both fail", async () => {
    vi.mocked(deckApi.updateCardNotes)
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"));
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", notes: "Saved note" })],
      })
    );

    const first = useDeckStore
      .getState()
      .updateCardNotes("card-1", "First edit");
    const second = useDeckStore
      .getState()
      .updateCardNotes("card-1", "Second edit");
    await Promise.all([first, second]);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].notes).toBe(
      "Saved note"
    );
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("clears notes when null is passed", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", null);
    const card = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBeNull();
  });

  it("calls updateCardNotes API", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", "Test note");
    expect(deckApi.updateCardNotes).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      "card-1",
      "Test note"
    );
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateCardNotes).mockClear();
    await useDeckStore.getState().updateCardNotes("card-1", "note");
    expect(deckApi.updateCardNotes).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveCardToZone", () => {
  beforeEach(() => {
    seedDeck(
      makeActiveDeck({ cards: [makeDeckCard({ id: "card-1", zone: "main" })] })
    );
  });

  it("updates card zone optimistically", async () => {
    await useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const card = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.zone).toBe("sideboard");
  });

  it("keeps the maybeboard compatibility mirror in sync", async () => {
    await useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(1);
    expect(deck.maybeboard).toHaveLength(1);
    expect(deck.maybeboard[0].id).toBe("card-1");
  });

  it("calls updateCardZone API", async () => {
    await useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    expect(deckApi.updateCardZone).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      "card-1",
      "maybeboard"
    );
  });

  it("persists a card added directly to a secondary zone", async () => {
    await useDeckStore.getState().addCard(makeScryfallCard(), { quantity: 1, zone: "sideboard" });
    const deck = useDeckStore.getState().decks["deck-1"];
    expect(
      deck.cards.find((card) => card.name === "Lightning Bolt")?.zone
    ).toBe("sideboard");
    expect(deckApi.addCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({ zone: "sideboard" })
    );
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateCardZone).mockClear();
    await useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    expect(deckApi.updateCardZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — addToMaybeboard", () => {
  beforeEach(() => seedDeck());

  it("adds card to maybeboard", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    await useDeckStore.getState().addToMaybeboard(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard).toHaveLength(1);
    expect(deck.maybeboard[0].name).toBe("Brainstorm");
  });

  it("marks card as isMaybeboard=true", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    await useDeckStore.getState().addToMaybeboard(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard[0].isMaybeboard).toBe(true);
  });

  it("does not add duplicate card by name", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          maybeboard: [makeDeckCard({ name: "Brainstorm" })],
        },
      },
    }));
    await useDeckStore.getState().addToMaybeboard(card);

    expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(1);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.addCard).mockClear();
    await useDeckStore.getState().addToMaybeboard(makeScryfallCard());
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — removeFromMaybeboard", () => {
  beforeEach(() => {
    seedDeck(
      makeActiveDeck({
        maybeboard: [makeDeckCard({ id: "card-1", name: "Brainstorm" })],
      })
    );
  });

  it("removes card from maybeboard", async () => {
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(0);
  });

  it("calls removeCard API", async () => {
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(deckApi.removeCard).toHaveBeenCalledWith({ deckId: "deck-1" }, "card-1");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.removeCard).mockClear();
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(deckApi.removeCard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveToMaybeboard", () => {
  beforeEach(() => {
    seedDeck(
      makeActiveDeck({
        cards: [makeDeckCard({ id: "card-1", name: "Counterspell" })],
      })
    );
  });

  it("moves card from deck to maybeboard", async () => {
    await useDeckStore.getState().moveToMaybeboard("card-1");

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].zone).toBe("maybeboard");
    expect(deck.maybeboard).toHaveLength(1);
    expect(deck.maybeboard[0].name).toBe("Counterspell");
  });

  it("persists the maybeboard zone", async () => {
    await useDeckStore.getState().moveToMaybeboard("card-1");
    expect(deckApi.updateCardZone).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      "card-1",
      "maybeboard"
    );
  });

  it("does nothing when card not found", async () => {
    vi.mocked(deckApi.updateCardZone).mockClear();
    await useDeckStore.getState().moveToMaybeboard("nonexistent");
    expect(deckApi.updateCardZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveToDeck", () => {
  beforeEach(() => {
    seedDeck(
      makeActiveDeck({
        maybeboard: [
          makeDeckCard({
            id: "card-1",
            name: "Counterspell",
            isMaybeboard: true,
          }),
        ],
      })
    );
  });

  it("moves card from maybeboard to deck", async () => {
    await useDeckStore.getState().moveToDeck("card-1");

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard).toHaveLength(0);
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].isMaybeboard).toBe(false);
    expect(deck.cards[0].zone).toBe("main");
  });

  it("persists the main zone", async () => {
    await useDeckStore.getState().moveToDeck("card-1");
    expect(deckApi.updateCardZone).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      "card-1",
      "main"
    );
  });

  it("does not move if card already in deck (same name)", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          cards: [makeDeckCard({ id: "card-2", name: "Counterspell" })],
        },
      },
    }));
    vi.mocked(deckApi.updateCardZone).mockClear();
    await useDeckStore.getState().moveToDeck("card-1");
    expect(deckApi.updateCardZone).not.toHaveBeenCalled();
  });

  it("does nothing when card not found in maybeboard", async () => {
    vi.mocked(deckApi.updateCardZone).mockClear();
    await useDeckStore.getState().moveToDeck("nonexistent");
    expect(deckApi.updateCardZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — updateDeckDescription", () => {
  beforeEach(() => seedDeck());

  it("updates description optimistically", async () => {
    await useDeckStore
      .getState()
      .updateDeckDescription("deck-1", "A great deck");
    expect(useDeckStore.getState().decks["deck-1"].description).toBe(
      "A great deck"
    );
  });

  it("calls updateDeck API with description", async () => {
    await useDeckStore
      .getState()
      .updateDeckDescription("deck-1", "A great deck");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", {
      description: "A great deck",
    });
  });
});

describe("useDeckStore — addTag / removeTag", () => {
  beforeEach(() => seedDeck(makeActiveDeck({ tags: [] })));

  it("addTag adds tag to deck", async () => {
    await useDeckStore.getState().addTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("aggro");
  });

  it("addTag trims whitespace", async () => {
    await useDeckStore.getState().addTag("deck-1", "  control  ");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("control");
  });

  it("addTag does not add duplicate tag", async () => {
    await useDeckStore.getState().addTag("deck-1", "aggro");
    await useDeckStore.getState().addTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toHaveLength(1);
  });

  it("addTag does not add empty tag", async () => {
    await useDeckStore.getState().addTag("deck-1", "   ");
    expect(useDeckStore.getState().decks["deck-1"].tags).toHaveLength(0);
  });

  it("removeTag removes tag from deck", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": { ...s.decks["deck-1"], tags: ["aggro", "combo"] },
      },
    }));
    await useDeckStore.getState().removeTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).not.toContain("aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("combo");
  });

  it("addTag calls updateDeck API", async () => {
    await useDeckStore.getState().addTag("deck-1", "stax");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", {
      tags: ["stax"],
    });
  });
});

describe("useDeckStore — setDeckGridCols", () => {
  it("updates deckGridCols", () => {
    useDeckStore.getState().setDeckGridCols(4);
    expect(useDeckStore.getState().deckGridCols).toBe(4);
  });

  it("accepts all valid column values", () => {
    for (const cols of [2, 3, 4, 6, 8] as const) {
      useDeckStore.getState().setDeckGridCols(cols);
      expect(useDeckStore.getState().deckGridCols).toBe(cols);
    }
  });
});

describe("useDeckStore — duplicateDeck", () => {
  beforeEach(() => {
    seedDeck();
    vi.mocked(deckApi.fetchDecks).mockResolvedValue({
      decks: [],
      total: 0,
      page: 0,
      limit: 20,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "deck-2", name: "Test Deck (copy)" }),
    }) as unknown as typeof fetch;
  });

  it("sets activeDeckId to the new deck id", async () => {
    await useDeckStore.getState().duplicateDeck("deck-1");
    expect(useDeckStore.getState().activeDeckId).toBe("deck-2");
  });

  it("calls /api/decks/:id/duplicate with POST", async () => {
    await useDeckStore.getState().duplicateDeck("deck-1");
    expect(global.fetch).toHaveBeenCalledWith("/api/decks/deck-1/duplicate", {
      method: "POST",
    });
  });
});

describe("useDeckStore — updateCardQuantity", () => {
  beforeEach(() => {
    toastAdd.mockClear();
    // Use a basic land — maxQuantity returns 99 for basic lands, allowing increments
    seedDeck(
      makeActiveDeck({
        cards: [
          makeDeckCard({
            id: "card-1",
            name: "Island",
            typeLine: "Basic Land — Island",
            quantity: 1,
          }),
        ],
      })
    );
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it("increments quantity by delta", async () => {
    await useDeckStore.getState().updateCardQuantity("card-1", 1);
    const card = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.quantity).toBe(2);
  });

  it("lets a Snow-Covered basic go past one copy", async () => {
    seedDeck(
      makeActiveDeck({
        cards: [
          makeDeckCard({
            id: "snow-1",
            name: "Snow-Covered Forest",
            typeLine: "Basic Snow Land — Forest",
            quantity: 1,
          }),
        ],
      })
    );

    await useDeckStore.getState().updateCardQuantity("snow-1", 1);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(2);
  });

  it.each(["note", "zone"])(
    "keeps saving visible while a quantity is pending and a %s waits behind it",
    async (action) => {
      let finishQuantity = () => {};
      const pendingQuantity = new Promise<void>((resolve) => {
        finishQuantity = resolve;
      });
      vi.mocked(global.fetch).mockImplementationOnce(async () => {
        await pendingQuantity;
        return new Response(null, { status: 200 });
      });

      const quantity = useDeckStore.getState().updateCardQuantity("card-1", 1);
      await vi.waitFor(() =>
        expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(
          2
        )
      );
      const later =
        action === "note"
          ? useDeckStore.getState().updateCardNotes("card-1", "Saved note")
          : useDeckStore.getState().moveCardToZone("card-1", "sideboard");
      const savingWithQuantityPending = useDeckStore.getState().isSyncing;
      finishQuantity();
      await Promise.all([quantity, later]);

      expect(savingWithQuantityPending).toBe(true);
      expect(useDeckStore.getState().isSyncing).toBe(false);
      expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(2);
    }
  );

  it("keeps saving visible while a note is pending and a quantity waits behind it", async () => {
    let finishNote = () => {};
    const pendingNote = new Promise<void>((resolve) => {
      finishNote = resolve;
    });
    vi.mocked(deckApi.updateCardNotes).mockImplementationOnce(async () => {
      await pendingNote;
      throw new Error("offline");
    });

    const note = useDeckStore.getState().updateCardNotes("card-1", "New note");
    const quantity = useDeckStore.getState().updateCardQuantity("card-1", 1);
    await vi.waitFor(() => expect(deckApi.updateCardNotes).toHaveBeenCalled());
    const savingWithNotePending = useDeckStore.getState().isSyncing;
    finishNote();
    await Promise.all([note, quantity]);

    expect(savingWithNotePending).toBe(true);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(2);
  });

  it("restores the saved quantity and warns when the server rejects the update", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    await useDeckStore.getState().updateCardQuantity("card-1", 1);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(1);
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("restores the saved quantity after a network failure", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().updateCardQuantity("card-1", 1);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(1);
    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
  });

  it("restores the last confirmed quantity after two rapid updates", async () => {
    let finishFirst: ((response: Response) => void) | undefined;
    vi.mocked(global.fetch)
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishFirst = resolve;
          })
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    const first = useDeckStore.getState().updateCardQuantity("card-1", 1);
    await vi.waitFor(() =>
      expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(2)
    );
    const second = useDeckStore.getState().updateCardQuantity("card-1", 1);
    await vi.waitFor(() =>
      expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(3)
    );
    finishFirst?.(new Response(null, { status: 200 }));
    await Promise.all([first, second]);

    expect(useDeckStore.getState().decks["deck-1"].cards[0].quantity).toBe(2);
    expect(vi.mocked(global.fetch).mock.calls[1][1]).toMatchObject({
      body: JSON.stringify({ quantity: 3 }),
    });
  });

  it("decrements quantity by delta, minimum 1", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          cards: [
            makeDeckCard({
              id: "card-1",
              name: "Island",
              typeLine: "Basic Land — Island",
              quantity: 3,
            }),
          ],
        },
      },
    }));
    await useDeckStore.getState().updateCardQuantity("card-1", -1);
    const card = useDeckStore
      .getState()
      .decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.quantity).toBe(2);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().updateCardQuantity("card-1", 1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when card not found", async () => {
    await useDeckStore.getState().updateCardQuantity("nonexistent", 1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

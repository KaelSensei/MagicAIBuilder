/**
 * Tests for store actions not yet covered:
 * forceSave, promoteToCommander, swapCardPrinting,
 * and error paths in moveToMaybeboard / moveToDeck.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/deck-api", () => ({
  fetchDecks: vi.fn(async () => []),
  createDeck: vi.fn(async () => ({
    id: "deck-1",
    name: "Test",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [],
  })),
  updateDeck: vi.fn(async () => ({})),
  deleteDeck: vi.fn(async () => undefined),
  addCard: vi.fn(async (_deckId: string, payload: Record<string, unknown>) => ({
    ...payload,
    id: "saved-db-id",
    deckId: "deck-1",
    scryfallId: payload.scryfallId,
    isCommander: false,
    isPartner: false,
    isMaybeboard: payload.isMaybeboard ?? false,
  })),
  removeCard: vi.fn(async () => undefined),
  updateCardCategory: vi.fn(async () => ({})),
  updateCardMaybeboard: vi.fn(async (_deckId: string, cardId: string, isMaybeboard: boolean) => ({
    id: cardId,
    isMaybeboard,
  })),
  removeAllCards: vi.fn(async () => undefined),
}));

vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: vi.fn() }) },
}));

vi.mock("@/lib/scryfall/images", () => ({
  getCardImageUri: vi.fn((_card: unknown, size: string) =>
    size === "art_crop" ? "https://example.com/art.jpg" : "https://example.com/normal.jpg"
  ),
}));

import { useDeckStore } from "@/lib/deck/store";
import * as deckApi from "@/lib/db/deck-api";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeDeckCard(id: string, name: string, extra: Partial<DeckCard> = {}): DeckCard {
  return {
    id,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "https://example.com/normal.jpg",
    artCropUri: "https://example.com/art.jpg",
    category: "creature",
    quantity: 1,
    zone: "main" as const,
    ...extra,
  };
}

function seedDeck(extra: Partial<Deck> = {}): Deck {
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
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useDeckStore.setState({
    decks: { "deck-1": seedDeck() },
    activeDeckId: "deck-1",
    isSyncing: false,
    gameChangerNames: new Set(),
    bannedNames: new Set(),
  });
});

// ── forceSave ─────────────────────────────────────────────────────────────────

describe("useDeckStore — forceSave", () => {
  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().forceSave();
    expect(deckApi.fetchDecks).not.toHaveBeenCalled();
  });

  it("calls loadDecks and resets isSyncing on success", async () => {
    vi.mocked(deckApi.fetchDecks).mockResolvedValueOnce([]);
    await useDeckStore.getState().forceSave();
    expect(deckApi.fetchDecks).toHaveBeenCalled();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("resets isSyncing even when loadDecks throws", async () => {
    vi.mocked(deckApi.fetchDecks).mockRejectedValueOnce(new Error("network error"));
    await useDeckStore.getState().forceSave();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

// ── promoteToCommander ────────────────────────────────────────────────────────

describe("useDeckStore — promoteToCommander", () => {
  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().promoteToCommander("card-1");
    expect(deckApi.removeCard).not.toHaveBeenCalled();
  });

  it("does nothing when card not found", async () => {
    await useDeckStore.getState().promoteToCommander("nonexistent");
    expect(deckApi.removeCard).not.toHaveBeenCalled();
  });

  it("removes card from deck and sets it as commander", async () => {
    const card = makeDeckCard("card-1", "Atraxa, Praetors' Voice", {
      scryfallId: "scryfall-atraxa",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      colorIdentity: ["W", "U", "B", "G"],
    });
    useDeckStore.setState({
      decks: { "deck-1": seedDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
    });

    await useDeckStore.getState().promoteToCommander("card-1");

    const state = useDeckStore.getState();
    // Card removed from main deck
    expect(state.decks["deck-1"].cards).toHaveLength(0);
    // Set as commander
    expect(state.decks["deck-1"].commander?.name).toBe("Atraxa, Praetors' Voice");
  });
});

// ── swapCardPrinting ──────────────────────────────────────────────────────────

describe("useDeckStore — swapCardPrinting", () => {
  const mockPrinting = {
    id: "new-printing-id",
    name: "Lightning Bolt",
    mana_cost: "{R}",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Deal 3 damage.",
    color_identity: ["R"],
    colors: ["R"],
    set: "m11",
    set_name: "Magic 2011",
    rarity: "common" as const,
    prices: { usd: "2.00", usd_foil: null },
    image_uris: {
      small: "https://example.com/small.jpg",
      normal: "https://example.com/normal.jpg",
      large: "https://example.com/large.jpg",
      art_crop: "https://example.com/art.jpg",
      border_crop: "",
      png: "",
    },
    card_faces: undefined,
    keywords: [],
    legalities: { commander: "legal" as const },
  };

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    globalThis.fetch = vi.fn();
    await useDeckStore.getState().swapCardPrinting("card-1", mockPrinting);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("updates card imageUri and scryfallId optimistically", async () => {
    const card = makeDeckCard("card-1", "Lightning Bolt");
    useDeckStore.setState({
      decks: { "deck-1": seedDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
    });

    globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    await useDeckStore.getState().swapCardPrinting("card-1", mockPrinting);

    const updated = useDeckStore.getState().decks["deck-1"].cards[0];
    expect(updated.scryfallId).toBe("new-printing-id");
    expect(updated.imageUri).toBe("https://example.com/normal.jpg");
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("resets isSyncing even when fetch throws", async () => {
    const card = makeDeckCard("card-1", "Lightning Bolt");
    useDeckStore.setState({
      decks: { "deck-1": seedDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
    });

    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("network error"));

    await useDeckStore.getState().swapCardPrinting("card-1", mockPrinting);

    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

// ── moveToMaybeboard error path ───────────────────────────────────────────────

describe("useDeckStore — moveToMaybeboard error path", () => {
  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().moveToMaybeboard("card-1");
    expect(deckApi.updateCardMaybeboard).not.toHaveBeenCalled();
  });

  it("keeps optimistic state when API throws", async () => {
    vi.mocked(deckApi.updateCardMaybeboard).mockRejectedValueOnce(new Error("api error"));

    const card = makeDeckCard("card-1", "Counterspell");
    useDeckStore.setState({
      decks: { "deck-1": seedDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
    });

    await useDeckStore.getState().moveToMaybeboard("card-1");

    const state = useDeckStore.getState().decks["deck-1"];
    // Optimistic update kept despite API error
    expect(state.cards).toHaveLength(0);
    expect(state.maybeboard).toHaveLength(1);
  });
});

// ── moveToDeck error path ─────────────────────────────────────────────────────

describe("useDeckStore — moveToDeck error path", () => {
  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().moveToDeck("card-1");
    expect(deckApi.updateCardMaybeboard).not.toHaveBeenCalled();
  });

  it("keeps optimistic state when API throws", async () => {
    vi.mocked(deckApi.updateCardMaybeboard).mockRejectedValueOnce(new Error("api error"));

    const card = makeDeckCard("maybe-1", "Swords to Plowshares");
    useDeckStore.setState({
      decks: { "deck-1": seedDeck({ maybeboard: [card] }) },
      activeDeckId: "deck-1",
    });

    await useDeckStore.getState().moveToDeck("maybe-1");

    const state = useDeckStore.getState().decks["deck-1"];
    expect(state.maybeboard).toHaveLength(0);
    expect(state.cards).toHaveLength(1);
  });
});

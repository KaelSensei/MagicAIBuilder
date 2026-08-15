import { describe, it, expect, beforeEach } from "vitest";
import { usePlaytestStore } from "./store";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name = id): DeckCard {
  return {
    id,
    scryfallId: id,
    name,
    quantity: 1,
    category: "creature",
    zone: "main",
    manaCost: "",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

function makeDeck(opts: { cardCount?: number; commander?: DeckCard | null } = {}): Deck {
  const { cardCount = 25, commander = makeCard("cmd", "Kenrith") } = opts;
  return {
    id: "deck-1",
    name: "Test",
    format: "commander",
    commander,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: Array.from({ length: cardCount }, (_, i) => makeCard(`c${i}`, `Card ${i}`)),
    maybeboard: [],
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    tags: [],
    description: "",
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("usePlaytestStore", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  });

  it("startPlaytest builds engine from commander + main deck", () => {
    const deck = makeDeck();
    usePlaytestStore.getState().startPlaytest(deck);
    const { engine, isActive } = usePlaytestStore.getState();
    expect(isActive).toBe(true);
    expect(engine).not.toBeNull();
    expect(engine?.hand.length).toBe(7);
    expect(engine?.library.length).toBe(
      deck.cards.length + 1 - 7
    );
  });

  it("startPlaytest includes partner in library pool", () => {
    const deck = makeDeck({
      commander: makeCard("c1", "Lord"),
      cardCount: 20,
    });
    const withPartner = {
      ...deck,
      partner: makeCard("p1", "Partner"),
    };
    usePlaytestStore.getState().startPlaytest(withPartner);
    const { engine } = usePlaytestStore.getState();
    // commander + partner + 20 main = 22 cards; opening hand 7 → library 15
    expect(engine?.library.length).toBe(15);
  });

  it("stopPlaytest clears state", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().stopPlaytest();
    expect(usePlaytestStore.getState().engine).toBeNull();
    expect(usePlaytestStore.getState().isActive).toBe(false);
  });

  it("drawCard is no-op when no engine", () => {
    usePlaytestStore.getState().drawCard();
    expect(usePlaytestStore.getState().engine).toBeNull();
  });

  it("drawCard draws when active", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    const before = usePlaytestStore.getState().engine?.library.length ?? 0;
    usePlaytestStore.getState().drawCard();
    const afterLib = usePlaytestStore.getState().engine?.library.length ?? 0;
    const hand = usePlaytestStore.getState().engine?.hand.length ?? 0;
    expect(hand).toBe(8);
    expect(afterLib).toBe(before - 1);
  });

  it("nextPhase, nextTurn, damage, heal, tap, untapAll, undo run when engine exists", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().nextPhase();
    expect(usePlaytestStore.getState().engine?.phase).not.toBe("Draw");
    usePlaytestStore.getState().nextTurn();
    usePlaytestStore.getState().damage(5, "test");
    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(35);
    usePlaytestStore.getState().heal(2);
    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(37);
    const firstHandId = usePlaytestStore.getState().engine?.hand[0]?.id;
    if (firstHandId) {
      usePlaytestStore.getState().moveToZone(firstHandId, "hand", "graveyard");
    }
    usePlaytestStore.getState().undo();
    usePlaytestStore.getState().tap(firstHandId ?? "missing");
    usePlaytestStore.getState().untapAll();
    usePlaytestStore.getState().addCounter("any", 1);
  });

  it("actions are no-ops when engine is null", () => {
    usePlaytestStore.getState().nextPhase();
    usePlaytestStore.getState().nextTurn();
    usePlaytestStore.getState().damage(1);
    usePlaytestStore.getState().heal(1);
    usePlaytestStore.getState().tap("x");
    usePlaytestStore.getState().untapAll();
    usePlaytestStore.getState().moveToZone("x", "hand", "library");
    usePlaytestStore.getState().addCounter("x", 1);
    usePlaytestStore.getState().undo();
    usePlaytestStore.getState().resetPlaytest();
    expect(usePlaytestStore.getState().engine).toBeNull();
  });

  it("resetPlaytest rebuilds from all zones", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck({ cardCount: 30 }));
    let eng = usePlaytestStore.getState().engine;
    expect(eng).not.toBeNull();
    const cardId = eng?.hand[0]?.id;
    if (cardId) {
      usePlaytestStore.getState().moveToZone(cardId, "hand", "battlefield");
    }
    usePlaytestStore.getState().resetPlaytest();
    eng = usePlaytestStore.getState().engine;
    expect(eng?.hand.length).toBe(7);
  });

  // Rebuilding the deck by concatenating the zones lost the commander and
  // dragged battlefield state (tapped/counters) back into the library.
  it("resetPlaytest restores the full original deck, not the current zones", () => {
    const deck = makeDeck({ cardCount: 30 });
    const total = deck.cards.length + 1; // + commander

    usePlaytestStore.getState().startPlaytest(deck);
    const cardId = usePlaytestStore.getState().engine?.hand[0]?.id;
    if (cardId) usePlaytestStore.getState().moveToZone(cardId, "hand", "exile");

    usePlaytestStore.getState().resetPlaytest();
    const eng = usePlaytestStore.getState().engine;

    expect(eng?.hand.length ?? 0).toBe(7);
    expect((eng?.hand.length ?? 0) + (eng?.library.length ?? 0)).toBe(total);
    expect(eng?.exile).toHaveLength(0);
    expect(eng?.mulliganCount).toBe(0);
  });

  it("resetPlaytest clears a mulligan taken before it", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);

    usePlaytestStore.getState().resetPlaytest();

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(7);
    expect(usePlaytestStore.getState().engine?.mulliganCount).toBe(0);
  });

  it("mulligan is a no-op when no engine exists", () => {
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine).toBeNull();
  });

  it("mulligan shrinks the opening hand when active", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);
    expect(usePlaytestStore.getState().engine?.mulliganCount).toBe(1);
  });

  it("starts Commander decks on 40 life", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(40);
  });

  it("starts non-Commander decks on the format life total", () => {
    const modernDeck = { ...makeDeck({ commander: null }), format: "modern" as const };
    usePlaytestStore.getState().startPlaytest(modernDeck);
    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(20);
  });
});

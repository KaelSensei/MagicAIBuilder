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
    usePlaytestStore.setState({ engine: null, isActive: false });
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
});

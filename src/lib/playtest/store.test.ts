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

function makeDeck(
  opts: { cardCount?: number; commander?: DeckCard | null; format?: Deck["format"] } = {}
): Deck {
  const { cardCount = 25, commander = makeCard("cmd", "Kenrith"), format = "commander" } = opts;
  return {
    id: "deck-1",
    name: "Test",
    format,
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

  it("startPlaytest deals the main deck and keeps the commander out of it", () => {
    const deck = makeDeck();
    usePlaytestStore.getState().startPlaytest(deck);
    const { engine, isActive } = usePlaytestStore.getState();
    expect(isActive).toBe(true);
    expect(engine).not.toBeNull();
    expect(engine?.hand.length).toBe(7);
    expect(engine?.library.length).toBe(deck.cards.length - 7);
  });

  it("startPlaytest starts the partner in the command zone beside the commander", () => {
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
    // 20 main-deck cards; opening hand 7 → library 13
    expect(engine?.library.length).toBe(13);
    expect(engine?.commandZone.map((card) => card.name)).toEqual(["Lord", "Partner"]);
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
    const total = deck.cards.length; // the commander is in the command zone

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

  it("resetPlaytest clears a mulligan taken before it, even mid-choice", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck({ format: "modern", commander: null }));
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine?.cardsToBottom).toBe(1);

    usePlaytestStore.getState().resetPlaytest();

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(7);
    expect(usePlaytestStore.getState().engine?.mulliganCount).toBe(0);
    expect(usePlaytestStore.getState().engine?.cardsToBottom).toBe(0);

    // The reset deals under the same format rule.
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine?.cardsToBottom).toBe(1);
  });

  it("mulligan is a no-op when no engine exists", () => {
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine).toBeNull();
  });

  it("bottomCards is a no-op when no engine exists", () => {
    usePlaytestStore.getState().bottomCards(["c0"]);
    expect(usePlaytestStore.getState().engine).toBeNull();
  });

  // This used to expect six cards: in Commander the first mulligan is free
  // (CR 103.5c), a fresh seven with nothing to bottom.
  it("gives a Commander player a free fresh seven on the first mulligan", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().mulligan();
    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(7);
    expect(usePlaytestStore.getState().engine?.mulliganCount).toBe(1);
    expect(usePlaytestStore.getState().engine?.cardsToBottom).toBe(0);
  });

  it("asks a Modern player to bottom a card after the first mulligan, then keeps six", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck({ format: "modern", commander: null }));
    usePlaytestStore.getState().mulligan();

    const pending = usePlaytestStore.getState().engine;
    expect(pending?.hand).toHaveLength(7);
    expect(pending?.cardsToBottom).toBe(1);

    usePlaytestStore.getState().bottomCards([pending?.hand[0]?.id ?? ""]);

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);
    expect(usePlaytestStore.getState().engine?.cardsToBottom).toBe(0);
  });

  it("creates an independent battlefield copy without changing the deck setup", () => {
    const deck = makeDeck();
    usePlaytestStore.getState().startPlaytest(deck);
    const cardId = usePlaytestStore.getState().engine?.hand[0]?.id;
    expect(cardId).toBeDefined();
    if (!cardId) return;

    usePlaytestStore.getState().moveToZone(cardId, "hand", "battlefield");
    usePlaytestStore.getState().createCardCopy(cardId);

    const battlefield = usePlaytestStore.getState().engine?.battlefield ?? [];
    expect(battlefield).toHaveLength(2);
    expect(battlefield[1]?.id).not.toBe(cardId);
    expect(battlefield[1]?.isSessionCopy).toBe(true);

    usePlaytestStore.getState().resetPlaytest();
    const reset = usePlaytestStore.getState().engine;
    expect((reset?.hand.length ?? 0) + (reset?.library.length ?? 0))
      .toBe(deck.cards.length);
  });

  it("adds a required token to the active session only", () => {
    const deck = makeDeck();
    usePlaytestStore.getState().startPlaytest(deck);

    usePlaytestStore.getState().createToken({
      name: "Treasure",
      power: null,
      colors: [],
      count: 1,
      kind: "token",
    });

    expect(usePlaytestStore.getState().engine?.battlefield[0]).toMatchObject({
      name: "Treasure token",
      isSessionCopy: true,
    });
    usePlaytestStore.getState().resetPlaytest();
    expect(usePlaytestStore.getState().engine?.battlefield).toHaveLength(0);
  });

  it("rolls dice only inside an active session", () => {
    usePlaytestStore.getState().rollDie(6);
    expect(usePlaytestStore.getState().engine).toBeNull();

    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().rollDie(6);
    const roll = usePlaytestStore.getState().engine?.diceRolls[0];
    expect(roll?.sides).toBe(6);
    expect(roll?.result).toBeGreaterThanOrEqual(1);
    expect(roll?.result).toBeLessThanOrEqual(6);
  });

  it("manages editable manual action log entries", () => {
    usePlaytestStore.getState().startPlaytest(makeDeck());
    usePlaytestStore.getState().addLogEntry("Made two mana");
    const entryId = usePlaytestStore.getState().engine?.actionLog.at(-1)?.id;
    expect(entryId).toBeDefined();
    if (entryId === undefined) return;

    usePlaytestStore.getState().editLogEntry(entryId, "Made three mana");
    expect(usePlaytestStore.getState().engine?.actionLog.at(-1)?.description).toBe(
      "Made three mana"
    );
    usePlaytestStore.getState().removeLogEntry(entryId);
    expect(usePlaytestStore.getState().engine?.actionLog).toEqual([]);
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

/** Names of the cards in a zone, in order. */
function namesIn(cards: readonly DeckCard[] = []): readonly string[] {
  return cards.map((card) => card.name);
}

/** A 100-card Commander deck: Kenrith, 15 Forests in one row, and 84 singletons. */
function makeForestDeck(): Deck {
  const singletons = makeDeck({ cardCount: 84 }).cards;
  return {
    ...makeDeck(),
    cards: [{ ...makeCard("forest", "Forest"), quantity: 15 }, ...singletons],
  };
}

describe("dealing a Commander deck", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  });

  it("deals every copy into the 99 and starts the commander in the command zone", () => {
    usePlaytestStore.getState().startPlaytest(makeForestDeck());
    const engine = usePlaytestStore.getState().engine;
    const dealt = [...(engine?.hand ?? []), ...(engine?.library ?? [])];

    expect({
      dealt: dealt.length,
      forests: dealt.filter((card) => card.name === "Forest").length,
      commanderDealt: dealt.some((card) => card.name === "Kenrith"),
      commandZone: namesIn(engine?.commandZone),
    }).toEqual({ dealt: 99, forests: 15, commanderDealt: false, commandZone: ["Kenrith"] });
  });

  it("deals each copy as its own card, so tapping one Forest leaves its twin alone", () => {
    const forestsOnly = { ...makeDeck(), cards: [{ ...makeCard("forest", "Forest"), quantity: 10 }] };
    usePlaytestStore.getState().startPlaytest(forestsOnly);
    const [first, second] = usePlaytestStore.getState().engine?.hand ?? [];
    if (!first || !second) throw new Error("expected two Forests in the opening hand");

    const store = usePlaytestStore.getState();
    store.moveToZone(first.id, "hand", "battlefield");
    store.moveToZone(second.id, "hand", "battlefield");
    store.tap(first.id);

    const engine = usePlaytestStore.getState().engine;
    expect(engine?.battlefield.map((card) => card.tapped)).toEqual([true, false]);
    const ids = [...(engine?.hand ?? []), ...(engine?.library ?? []), ...(engine?.battlefield ?? [])]
      .map((card) => card.id);
    expect(new Set(ids).size).toBe(10);
  });

  it("deals only the main deck, not the sideboard or the cards being considered", () => {
    const mainDeck = makeDeck({ cardCount: 20 });
    const deck: Deck = {
      ...mainDeck,
      cards: [
        ...mainDeck.cards,
        { ...makeCard("sb", "Negate"), quantity: 2, zone: "sideboard" },
        { ...makeCard("mb", "Maybe Card"), zone: "maybeboard", isMaybeboard: true },
      ],
    };
    usePlaytestStore.getState().startPlaytest(deck);
    const engine = usePlaytestStore.getState().engine;
    const dealt = namesIn([...(engine?.hand ?? []), ...(engine?.library ?? [])]);

    expect(dealt).toHaveLength(20);
    expect(dealt).not.toContain("Negate");
    expect(dealt).not.toContain("Maybe Card");
  });

  it("leaves formats without a command zone as they were", () => {
    const modernDeck: Deck = { ...makeDeck({ cardCount: 59 }), format: "modern" };
    usePlaytestStore.getState().startPlaytest(modernDeck);
    const engine = usePlaytestStore.getState().engine;
    const dealt = namesIn([...(engine?.hand ?? []), ...(engine?.library ?? [])]);

    expect(dealt).toHaveLength(60);
    expect(dealt).toContain("Kenrith");
    expect(engine?.commandZone).toEqual([]);
  });

  it("restarts with the commander back in the command zone after it was cast", () => {
    usePlaytestStore.getState().startPlaytest(makeForestDeck());
    usePlaytestStore.getState().moveToZone("cmd", "command", "battlefield");
    expect(usePlaytestStore.getState().engine?.commandZone).toEqual([]);

    usePlaytestStore.getState().resetPlaytest();
    const engine = usePlaytestStore.getState().engine;

    expect(namesIn(engine?.commandZone)).toEqual(["Kenrith"]);
    expect(engine?.battlefield).toEqual([]);
    expect((engine?.hand.length ?? 0) + (engine?.library.length ?? 0)).toBe(99);
  });

  // Brawl's commander and Oathbreaker's oathbreaker both live in the commander slot.
  it.each(["brawl", "oathbreaker"] as const)("starts the %s commander slot in the command zone", (format) => {
    usePlaytestStore.getState().startPlaytest({ ...makeDeck({ cardCount: 59 }), format });
    const engine = usePlaytestStore.getState().engine;

    expect((engine?.hand.length ?? 0) + (engine?.library.length ?? 0)).toBe(59);
    expect(namesIn(engine?.commandZone)).toEqual(["Kenrith"]);
  });
});

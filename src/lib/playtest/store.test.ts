import { describe, it, expect, beforeEach } from "vitest";
import { createPlaytestStore, usePlaytestStore } from "./store";
import type { PlaytestDeps } from "./engine";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { seededRandom } from "@/test/seeded-random";

function makeCard(id: string, name = id): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name,
    cmc: 1,
    typeLine: "Creature",
    category: "creature",
  });
}

function makeDeck(
  opts: { cardCount?: number; commander?: DeckCard | null; format?: Deck["format"] } = {}
): Deck {
  const { cardCount = 25, commander = makeCard("cmd", "Kenrith"), format = "commander" } = opts;
  return aDeck({
    name: "Test",
    format,
    commander,
    cards: Array.from({ length: cardCount }, (_, i) =>
      makeCard(`c${i}`, `Card ${i}`)
    ),
  });
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

  // CR 103.5c: only a multiplayer game (or any Brawl game) gets the free
  // mulligan, so a one-on-one Commander game bottoms a card on the first one.
  it("takes no free mulligan in a Commander game the player says is one-on-one", () => {
    usePlaytestStore
      .getState()
      .startPlaytest(makeDeck(), { multiplayer: false });
    usePlaytestStore.getState().mulligan();

    const engine = usePlaytestStore.getState().engine;
    expect(engine?.firstMulliganFree).toBe(false);
    expect(engine?.cardsToBottom).toBe(1);
  });

  it("restarts under the multiplayer choice the session started with", () => {
    usePlaytestStore
      .getState()
      .startPlaytest(makeDeck(), { multiplayer: false });

    usePlaytestStore.getState().resetPlaytest();

    expect(usePlaytestStore.getState().engine?.firstMulliganFree).toBe(false);
    expect(usePlaytestStore.getState().engine?.multiplayer).toBe(false);
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

// The deal itself (copies, zones, life, table size) is pinned in `deal.test.ts`; these cases
// go through the store's actions after the deal.
describe("dealing a Commander deck", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
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
});

describe("createPlaytestStore", () => {
  const GAME_START = Date.UTC(2026, 10, 10, 20, 0, 0);
  /** Always picks the last index, so the Fisher–Yates shuffle swaps nothing. */
  const inDeckOrder: PlaytestDeps = {
    random: { intBelow: (upperExclusive) => upperExclusive - 1 },
    clock: { now: () => GAME_START },
  };
  const seeded = (seed: number): PlaytestDeps => ({
    random: seededRandom(seed),
    clock: { now: () => GAME_START },
  });
  const handIds = (store: ReturnType<typeof createPlaytestStore>) =>
    store.getState().engine?.hand.map((card) => card.id);

  it("rolls the die its random source dictates", () => {
    const store = createPlaytestStore(inDeckOrder);
    store.getState().startPlaytest(makeDeck());

    store.getState().rollDie(20);

    expect(store.getState().engine?.diceRolls).toEqual([{ sides: 20, result: 20 }]);
  });

  it("stamps life changes with its clock", () => {
    const store = createPlaytestStore(inDeckOrder);
    store.getState().startPlaytest(makeDeck());

    store.getState().damage(3);

    expect(store.getState().engine?.lifeHistory[0]?.timestamp).toBe(GAME_START);
  });

  it("replays the same deal from the same seed, and deals on from it after a reset", () => {
    const first = createPlaytestStore(seeded(42));
    const second = createPlaytestStore(seeded(42));
    first.getState().startPlaytest(makeDeck());
    second.getState().startPlaytest(makeDeck());
    const dealt = handIds(first);

    first.getState().resetPlaytest();

    expect(handIds(second)).toEqual(dealt);
    expect(handIds(first)).not.toEqual(dealt);
  });

  it("is independent of the app's store", () => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });

    createPlaytestStore(inDeckOrder).getState().startPlaytest(makeDeck());

    expect(usePlaytestStore.getState().engine).toBeNull();
  });
});

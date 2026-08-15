import { describe, it, expect } from "vitest";
import {
  createPlaytestState,
  applyDrawCard,
  applyNextPhase,
  applyNextTurn,
  applyDamage,
  applyHeal,
  applyTap,
  applyUntapAll,
  applyMoveToZone,
  applyUndo,
  applyAddCounter,
  applyMulligan,
  PHASES,
  STARTING_LIFE,
  MAX_MULLIGANS,
} from "./engine";
import type { PlaytestEngine } from "./engine";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name = "Test Card"): DeckCard {
  return {
    id, name, manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "creature", quantity: 1, zone: "main", scryfallId: id,
  };
}

function makeState(overrides: Partial<PlaytestEngine> = {}): PlaytestEngine {
  // Create a full 100-card deck (7 drawn, 93 in library)
  const cards = Array.from({ length: 100 }, (_, i) => makeCard(`c${i}`));
  return createPlaytestState(cards, {
    ...overrides,
  });
}

// ─── Initial state ────────────────────────────────────────────────────────────
describe("createPlaytestState", () => {
  it("starts at turn 1, phase Draw", () => {
    const state = makeState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe("Draw");
  });

  it("starts with 40 life by default", () => {
    const state = makeState();
    expect(state.lifeTotal).toBe(STARTING_LIFE);
  });

  it("draws 7 cards into hand, rest in library", () => {
    const cards = Array.from({ length: 20 }, (_, i) => makeCard(`c${i}`));
    const state = createPlaytestState(cards);
    expect(state.hand).toHaveLength(7);
    expect(state.library).toHaveLength(13);
  });

  it("honours a format-specific starting life", () => {
    const cards = Array.from({ length: 60 }, (_, i) => makeCard(`c${i}`));
    const state = createPlaytestState(cards, { lifeTotal: 20 });
    expect(state.lifeTotal).toBe(20);
  });

  it("starts with no mulligans taken", () => {
    expect(makeState().mulliganCount).toBe(0);
  });

  it("starts with empty battlefield, graveyard, exile", () => {
    const state = makeState();
    expect(state.battlefield).toHaveLength(0);
    expect(state.graveyard).toHaveLength(0);
    expect(state.exile).toHaveLength(0);
  });

  it("starts with empty undo history", () => {
    const state = makeState();
    expect(state.history).toHaveLength(0);
  });
});

// ─── Draw card ────────────────────────────────────────────────────────────────
describe("applyDrawCard", () => {
  it("moves top card from library to hand", () => {
    const state = makeState();
    const before = state.library.length;
    const next = applyDrawCard(state);
    expect(next.hand).toHaveLength(state.hand.length + 1);
    expect(next.library).toHaveLength(before - 1);
  });

  it("does not change state when library is empty", () => {
    const state = { ...makeState(), library: [] };
    const next = applyDrawCard(state);
    expect(next.hand).toHaveLength(state.hand.length);
  });

  it("pushes a history entry", () => {
    const state = makeState();
    const next = applyDrawCard(state);
    expect(next.history.length).toBeGreaterThan(state.history.length);
  });
});

// ─── Phase progression ────────────────────────────────────────────────────────
describe("applyNextPhase", () => {
  it("advances to the next phase", () => {
    const state = { ...makeState(), phase: "Main1" as const };
    const next = applyNextPhase(state);
    expect(next.phase).toBe("Combat");
  });

  it("wraps from End to Untap of next turn", () => {
    const state = { ...makeState(), phase: "End" as const, turn: 1 };
    const next = applyNextPhase(state);
    expect(next.phase).toBe("Untap");
    expect(next.turn).toBe(2);
  });

  it("PHASES array starts with Untap", () => {
    expect(PHASES[0]).toBe("Untap");
  });
});

// ─── Next turn ────────────────────────────────────────────────────────────────
describe("applyNextTurn", () => {
  it("increments turn counter", () => {
    const state = makeState();
    const next = applyNextTurn(state);
    expect(next.turn).toBe(2);
  });

  it("sets phase to Draw", () => {
    const state = { ...makeState(), phase: "Main1" as const };
    const next = applyNextTurn(state);
    expect(next.phase).toBe("Draw");
  });

  it("draws a card on new turn", () => {
    const state = makeState();
    const next = applyNextTurn(state);
    expect(next.hand).toHaveLength(state.hand.length + 1);
  });

  it("untaps all battlefield permanents", () => {
    const tapped = [{ ...makeCard("p1"), tapped: true, counters: 0 }];
    const state = { ...makeState(), battlefield: tapped };
    const next = applyNextTurn(state);
    expect(next.battlefield[0].tapped).toBe(false);
  });
});

// ─── Damage / heal ────────────────────────────────────────────────────────────
describe("applyDamage / applyHeal", () => {
  it("reduces life by amount", () => {
    const state = makeState();
    const next = applyDamage(state, 5);
    expect(next.lifeTotal).toBe(STARTING_LIFE - 5);
  });

  it("adds damage to life history", () => {
    const state = makeState();
    const next = applyDamage(state, 3);
    expect(next.lifeHistory.at(-1)?.delta).toBe(-3);
  });

  it("increases life by amount", () => {
    const state = { ...makeState(), lifeTotal: 30 };
    const next = applyHeal(state, 5);
    expect(next.lifeTotal).toBe(35);
  });

  it("sets isGameOver when life ≤ 0", () => {
    const state = { ...makeState(), lifeTotal: 3 };
    const next = applyDamage(state, 5);
    expect(next.isGameOver).toBe(true);
  });
});

// ─── Tap / untap ─────────────────────────────────────────────────────────────
describe("applyTap", () => {
  it("toggles tapped state of a permanent", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
    const state = { ...makeState(), battlefield: [permanent] };
    const next = applyTap(state, "p1");
    expect(next.battlefield[0].tapped).toBe(true);
  });
});

describe("applyUntapAll", () => {
  it("untaps all permanents", () => {
    const permanents = [
      { ...makeCard("p1"), tapped: true, counters: 0 },
      { ...makeCard("p2"), tapped: true, counters: 0 },
    ];
    const state = { ...makeState(), battlefield: permanents };
    const next = applyUntapAll(state);
    expect(next.battlefield.every((p) => !p.tapped)).toBe(true);
  });
});

// ─── Move to zone ─────────────────────────────────────────────────────────────
describe("applyMoveToZone", () => {
  it("moves card from hand to battlefield", () => {
    const state = makeState();
    const cardId = state.hand[0].id;
    const next = applyMoveToZone(state, cardId, "hand", "battlefield");
    expect(next.hand.find((c) => c.id === cardId)).toBeUndefined();
    expect(next.battlefield.find((c) => c.id === cardId)).toBeDefined();
  });

  it("moves card from battlefield to graveyard", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
    const state = { ...makeState(), battlefield: [permanent] };
    const next = applyMoveToZone(state, "p1", "battlefield", "graveyard");
    expect(next.battlefield).toHaveLength(0);
    expect(next.graveyard).toHaveLength(1);
  });
});

// ─── Counters ─────────────────────────────────────────────────────────────────
describe("applyAddCounter", () => {
  it("increments counter on a permanent", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 2 };
    const state = { ...makeState(), battlefield: [permanent] };
    const next = applyAddCounter(state, "p1", 1);
    expect(next.battlefield[0].counters).toBe(3);
  });

  it("decrements counter, min 0", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 1 };
    const state = { ...makeState(), battlefield: [permanent] };
    const next = applyAddCounter(state, "p1", -5);
    expect(next.battlefield[0].counters).toBe(0);
  });
});

// ─── Undo ─────────────────────────────────────────────────────────────────────
describe("applyUndo", () => {
  it("restores previous state", () => {
    const state = makeState();
    const after = applyDrawCard(state);
    const undone = applyUndo(after);
    expect(undone.hand).toHaveLength(state.hand.length);
    expect(undone.library).toHaveLength(state.library.length);
  });

  it("does nothing when no history", () => {
    const state = makeState();
    const undone = applyUndo(state);
    expect(undone.hand).toHaveLength(state.hand.length);
  });

  it("limits history to 10 entries", () => {
    let state = makeState();
    for (let i = 0; i < 15; i++) state = applyDrawCard(state);
    expect(state.history.length).toBeLessThanOrEqual(10);
  });
});

// ─── Mulligan ─────────────────────────────────────────────────────────────────
describe("applyMulligan", () => {
  it("counts the mulligan", () => {
    expect(applyMulligan(makeState()).mulliganCount).toBe(1);
  });

  it("draws one fewer card per mulligan (London)", () => {
    let state = makeState();

    state = applyMulligan(state);
    expect(state.hand).toHaveLength(6);

    state = applyMulligan(state);
    expect(state.hand).toHaveLength(5);
  });

  it("returns every card to the deck, so the total never changes", () => {
    const state = makeState();
    const before = state.hand.length + state.library.length;

    const after = applyMulligan(state);

    expect(after.hand.length + after.library.length).toBe(before);
  });

  it("stops at MAX_MULLIGANS, leaving a one-card hand", () => {
    let state = makeState();
    for (let i = 0; i < MAX_MULLIGANS + 3; i++) state = applyMulligan(state);

    expect(state.mulliganCount).toBe(MAX_MULLIGANS);
    expect(state.hand).toHaveLength(7 - MAX_MULLIGANS);
  });

  it("leaves life, turn and phase untouched", () => {
    const state = makeState();
    const after = applyMulligan(state);

    expect(after.lifeTotal).toBe(state.lifeTotal);
    expect(after.turn).toBe(1);
    expect(after.phase).toBe("Draw");
  });

  it("is undoable like any other action", () => {
    const state = makeState();
    const after = applyMulligan(state);

    expect(applyUndo(after).mulliganCount).toBe(0);
    expect(applyUndo(after).hand).toHaveLength(7);
  });
});

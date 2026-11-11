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
  applyBottomCards,
  applyCreateCardCopy,
  applyCreateToken,
  applyRollDie,
  applyAddActionLogEntry,
  applyRecordMana,
  applyEditActionLogEntry,
  applyRemoveActionLogEntry,
  PHASES,
  maxMulligans,
} from "./engine";
import type { PlaytestEngine } from "./engine";
import { STARTING_LIFE } from "@/lib/deck/game-constants";
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

  it("records the draw in the action log", () => {
    expect(applyDrawCard(makeState()).actionLog.at(-1)?.description).toBe("Drew a card");
    expect(applyDrawCard(makeState()).actionLog.at(-1)?.kind).toBe("draw");
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
    expect(next.actionLog.at(-1)).toMatchObject({ turn: 2, phase: "Untap" });
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
    expect(next.actionLog.at(-1)).toMatchObject({ turn: 2, phase: "Draw", kind: "draw" });
  });

  it("sets phase to Draw", () => {
    const state = { ...makeState(), phase: "Main1" as const };
    const next = applyNextTurn(state);
    expect(next.phase).toBe("Draw");
  });

  // From turn 2 on, so no turn-1 draw is owed (see "first-turn draw" below).
  it("draws a card on new turn", () => {
    const state = makeState({ turn: 2 });
    const next = applyNextTurn(state);
    expect(next.hand).toHaveLength(state.hand.length + 1);
  });

  it("does not claim a draw when the library is empty", () => {
    const next = applyNextTurn({ ...makeState(), library: [] });
    expect(next.actionLog.at(-1)?.kind).toBeUndefined();
  });

  it("untaps all battlefield permanents", () => {
    const tapped = [{ ...makeCard("p1"), tapped: true, counters: 0 }];
    const state = { ...makeState(), battlefield: tapped };
    const next = applyNextTurn(state);
    expect(next.battlefield[0].tapped).toBe(false);
  });
});

// ─── First-turn draw ──────────────────────────────────────────────────────────
// CR 103.8a: in a two-player game the starting player skips the draw step of
// their first turn. CR 103.8c: in other multiplayer games no player skips it.
// The deal waits in the Draw step of turn 1 for the mulligans, so the draw is
// taken when the game leaves that step.
describe("first-turn draw", () => {
  const ids = (cards: readonly DeckCard[]) => cards.map((card) => card.id);

  it("skips the turn-1 draw in a two-player game (CR 103.8a)", () => {
    const duel = makeState({ multiplayer: false });

    const main = applyNextPhase(duel);

    expect(main.phase).toBe("Main1");
    expect(ids(main.hand)).toEqual(ids(duel.hand));
    expect(main.actionLog.map((entry) => entry.description)).toEqual([
      "Advanced to Main1",
    ]);
  });

  it("logs the multiplayer turn-1 draw as a draw of turn 1, before the step change", () => {
    const main = applyNextPhase(makeState({ multiplayer: true }));

    expect(main.actionLog).toEqual([
      {
        id: 1,
        turn: 1,
        phase: "Draw",
        description: "Drew a card for turn 1",
        kind: "draw",
      },
      { id: 2, turn: 1, phase: "Draw", description: "Advanced to Main1" },
    ]);
    expect(main.nextActionId).toBe(3);
  });

  it("draws for turn 1 and turn 2 when a multiplayer game starts turn 2 from the Draw step of turn 1", () => {
    const deal = makeState({ multiplayer: true });

    const turnTwo = applyNextTurn(deal);

    expect(ids(turnTwo.hand)).toEqual(
      ids([...deal.hand, deal.library[0], deal.library[1]])
    );
    expect(turnTwo.actionLog).toEqual([
      {
        id: 1,
        turn: 1,
        phase: "Draw",
        description: "Drew a card for turn 1",
        kind: "draw",
      },
      {
        id: 2,
        turn: 2,
        phase: "Draw",
        description: "Started turn 2 and drew a card",
        kind: "draw",
      },
    ]);
    // One move, one undo: back to the deal, with the turn-1 draw still owed.
    expect(applyUndo(turnTwo)).toBe(deal);
  });

  it("takes the turn-1 draw once: a game already past that step draws one card on its next turn", () => {
    const deal = makeState({ multiplayer: true });

    const turnTwo = applyNextTurn(applyNextPhase(deal));

    expect(turnTwo.hand).toHaveLength(9);
    expect(turnTwo.library).toHaveLength(deal.library.length - 2);
  });

  it("only advances when a multiplayer game leaves turn 1 with an empty library", () => {
    const empty = makeState({ multiplayer: true, library: [] });

    const main = applyNextPhase(empty);

    expect(ids(main.hand)).toEqual(ids(empty.hand));
    expect(main.actionLog.map((entry) => entry.description)).toEqual([
      "Advanced to Main1",
    ]);
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

// ─── Command zone ─────────────────────────────────────────────────────────────
describe("command zone", () => {
  /** A game whose commander, Kenrith, starts in the command zone. */
  function withCommander(): PlaytestEngine {
    const cards = Array.from({ length: 20 }, (_, i) => makeCard(`c${i}`));
    return createPlaytestState(cards, { commandZone: [makeCard("cmd", "Kenrith")] });
  }

  it("casts the commander from the command zone onto the battlefield", () => {
    const next = applyMoveToZone(withCommander(), "cmd", "command", "battlefield");

    expect(next.commandZone).toEqual([]);
    expect(next.battlefield.map((card) => card.name)).toEqual(["Kenrith"]);
    expect(next.actionLog.at(-1)?.description).toBe("Cast Kenrith from the command zone");
  });

  it("returns the commander from the graveyard to the command zone (CR 903.9a)", () => {
    const cast = applyMoveToZone(withCommander(), "cmd", "command", "battlefield");
    const died = applyMoveToZone(cast, "cmd", "battlefield", "graveyard");

    const next = applyMoveToZone(died, "cmd", "graveyard", "command");

    expect(next.graveyard).toEqual([]);
    expect(next.commandZone.map((card) => card.name)).toEqual(["Kenrith"]);
    expect(next.actionLog.at(-1)?.description).toBe("Returned Kenrith to the command zone");
  });

  it("puts a cast commander back in the command zone on undo", () => {
    const state = withCommander();
    const cast = applyMoveToZone(state, "cmd", "command", "battlefield");

    expect(applyUndo(cast).commandZone).toEqual(state.commandZone);
  });

  it("leaves the command zone alone when the player mulligans", () => {
    const state = withCommander();
    const next = applyMulligan(state);

    expect(next.commandZone).toEqual(state.commandZone);
    expect([...next.hand, ...next.library].map((card) => card.id)).not.toContain("cmd");
    expect(next.hand.length + next.library.length).toBe(20);
  });

  // CR 903.9b: a commander that would be put into the library may go to the command zone instead.
  it("returns a commander held in hand to the command zone when the player mulligans", () => {
    const cast = applyMoveToZone(withCommander(), "cmd", "command", "battlefield");
    const died = applyMoveToZone(cast, "cmd", "battlefield", "graveyard");
    const inHand = applyMoveToZone(died, "cmd", "graveyard", "hand");

    const next = applyMulligan(inHand);

    expect(next.commandZone.map((card) => card.name)).toEqual(["Kenrith"]);
    expect([...next.hand, ...next.library].map((card) => card.id)).not.toContain("cmd");
    expect(next.hand.length + next.library.length).toBe(20);
  });

  it("keeps every card but a commander out of the command zone", () => {
    const state = withCommander();
    const handCardId = state.hand[0]?.id ?? "";

    expect(applyMoveToZone(state, handCardId, "hand", "command")).toBe(state);
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

describe("applyCreateCardCopy", () => {
  it("creates an independent session copy of a battlefield permanent", () => {
    const permanent = { ...makeCard("p1"), tapped: true, counters: 2 };
    const state = { ...makeState(), battlefield: [permanent] };

    const next = applyCreateCardCopy(state, "p1", "copy-1");

    expect(next.battlefield).toHaveLength(2);
    expect(next.battlefield[0]).toEqual(permanent);
    expect(next.battlefield[1]).toMatchObject({
      id: "copy-1",
      name: permanent.name,
      quantity: 1,
      tapped: false,
      counters: 0,
      isSessionCopy: true,
    });
  });

  it("is undoable", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
    const state = { ...makeState(), battlefield: [permanent] };

    expect(applyUndo(applyCreateCardCopy(state, "p1", "copy-1")).battlefield)
      .toEqual(state.battlefield);
  });

  it("does nothing for a missing permanent or duplicate id", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
    const state = { ...makeState(), battlefield: [permanent] };

    expect(applyCreateCardCopy(state, "missing", "copy-1")).toBe(state);
    expect(applyCreateCardCopy(state, "p1", "p1")).toBe(state);
  });

  it("removes a session copy instead of moving it to another zone", () => {
    const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
    const copied = applyCreateCardCopy(
      { ...makeState(), battlefield: [permanent] },
      "p1",
      "copy-1"
    );

    const next = applyMoveToZone(copied, "copy-1", "battlefield", "graveyard");

    expect(next.battlefield).toHaveLength(1);
    expect(next.graveyard).toHaveLength(0);
  });
});

describe("applyCreateToken", () => {
  it("adds an independent playtest token to the battlefield", () => {
    const state = makeState();
    const next = applyCreateToken(
      state,
      { name: "Soldier", power: "1/1", colors: ["white"], kind: "token" },
      "token-1"
    );

    expect(next.battlefield).toHaveLength(1);
    expect(next.battlefield[0]).toMatchObject({
      id: "token-1",
      name: "1/1 Soldier token",
      typeLine: "Token Creature — Soldier",
      colorIdentity: ["W"],
      isSessionCopy: true,
      tapped: false,
      counters: 0,
    });
  });

  it("creates emblems without creature stats and is undoable", () => {
    const state = makeState();
    const next = applyCreateToken(
      state,
      { name: "Emblem", power: null, colors: [], kind: "emblem" },
      "emblem-1"
    );

    expect(next.battlefield[0]).toMatchObject({
      name: "Emblem",
      typeLine: "Emblem",
    });
    expect(applyUndo(next).battlefield).toHaveLength(0);
  });
});

describe("applyRollDie", () => {
  it("records a valid die result and is undoable", () => {
    const state = makeState();
    const next = applyRollDie(state, 20, 17);

    expect(next.diceRolls).toEqual([{ sides: 20, result: 17 }]);
    expect(applyUndo(next).diceRolls).toEqual([]);
  });

  it("rejects invalid sides and results", () => {
    const state = makeState();
    expect(applyRollDie(state, 1, 1)).toBe(state);
    expect(applyRollDie(state, 6, 0)).toBe(state);
    expect(applyRollDie(state, 6, 7)).toBe(state);
  });

  it("keeps only the ten most recent results", () => {
    let state = makeState();
    for (let result = 1; result <= 12; result++) {
      state = applyRollDie(state, 20, result);
    }
    expect(state.diceRolls).toHaveLength(10);
    expect(state.diceRolls.at(-1)?.result).toBe(12);
  });
});

describe("editable action log", () => {
  it("records life and counter changes as structured evidence", () => {
    const damaged = applyDamage(makeState(), 3);
    expect(damaged.actionLog.at(-1)).toMatchObject({ kind: "life", lifeDelta: -3 });

    const healed = applyHeal(damaged, 2);
    expect(healed.actionLog.at(-1)).toMatchObject({ kind: "life", lifeDelta: 2 });

    const permanent = makeCard("permanent");
    const withPermanent = makeState({
      battlefield: [{ ...permanent, tapped: false, counters: 0 }],
    });
    const withCounter = applyAddCounter(withPermanent, permanent.id, 2);
    expect(withCounter.actionLog.at(-1)).toMatchObject({ kind: "counter", counterDelta: 2 });
  });

  it("records only valid mana amounts and clears evidence after free-text editing", () => {
    const state = makeState();
    expect(applyRecordMana(state, 0)).toBe(state);
    const recorded = applyRecordMana(state, 3);
    expect(recorded.actionLog.at(-1)).toMatchObject({ kind: "mana", amount: 3 });
    const edited = applyEditActionLogEntry(recorded, recorded.actionLog[0].id, "Actually no mana");
    expect(edited.actionLog[0]?.kind).toBeUndefined();
    expect(edited.actionLog[0]?.amount).toBeUndefined();
  });
  it("adds, edits and removes a manual session entry", () => {
    const added = applyAddActionLogEntry(makeState(), "Produced three green mana");
    const entry = added.actionLog[0];
    expect(entry).toMatchObject({ turn: 1, phase: "Draw", description: "Produced three green mana" });

    const edited = applyEditActionLogEntry(added, entry.id, "Produced four green mana");
    expect(edited.actionLog[0]?.description).toBe("Produced four green mana");

    const removed = applyRemoveActionLogEntry(edited, entry.id);
    expect(removed.actionLog).toEqual([]);
  });

  it("ignores blank entries and missing ids", () => {
    const state = makeState();
    expect(applyAddActionLogEntry(state, "   ")).toBe(state);
    expect(applyEditActionLogEntry(state, 99, "Nope")).toBe(state);
    expect(applyRemoveActionLogEntry(state, 99)).toBe(state);
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
const ids = (cards: readonly DeckCard[]) => cards.map((card) => card.id);

/** A duel (Standard, Modern…): every mulligan counts. */
const duelState = () => makeState({ firstMulliganFree: false });

/** A multiplayer game (Commander, Brawl…): the first mulligan is free. */
const multiplayerState = () => makeState({ firstMulliganFree: true });

/** Settles a pending bottom choice by bottoming the first cards in hand. */
function bottomFirstCards(state: PlaytestEngine): PlaytestEngine {
  return applyBottomCards(state, ids(state.hand.slice(0, state.cardsToBottom)));
}

describe("applyMulligan", () => {
  it("counts the mulligan", () => {
    expect(applyMulligan(makeState()).mulliganCount).toBe(1);
  });

  it("returns every card to the deck, so the total never changes", () => {
    const state = makeState();
    const before = state.hand.length + state.library.length;

    const after = applyMulligan(state);

    expect(after.hand.length + after.library.length).toBe(before);
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

// ─── Mulligan rules: CR 103.5 (London) and 103.5c (free first mulligan) ───────
describe("applyMulligan in a multiplayer format", () => {
  it("deals a free fresh seven on the first mulligan, with nothing to bottom", () => {
    const after = applyMulligan(multiplayerState());

    expect(after.mulliganCount).toBe(1);
    expect(after.hand).toHaveLength(7);
    expect(after.cardsToBottom).toBe(0);
  });

  it("counts the second mulligan: a new seven, then one card on the bottom", () => {
    const after = applyMulligan(applyMulligan(multiplayerState()));

    expect(after.mulliganCount).toBe(2);
    expect(after.hand).toHaveLength(7);
    expect(after.cardsToBottom).toBe(1);
    expect(bottomFirstCards(after).hand).toHaveLength(6);
  });

  it("logs the free mulligan as a new seven, and the next one with its bottom count", () => {
    const free = applyMulligan(multiplayerState());
    const counted = applyMulligan(free);

    expect(free.actionLog.at(-1)?.description).toBe("Free mulligan: drew a new seven");
    expect(counted.actionLog.at(-1)?.description).toBe(
      "Mulligan: drew a new seven, 1 card to put on the bottom"
    );
  });
});

describe("applyMulligan in a duel format", () => {
  it("draws a new seven and asks for one card on the bottom after the first mulligan", () => {
    const after = applyMulligan(duelState());

    expect(after.hand).toHaveLength(7);
    expect(after.cardsToBottom).toBe(1);
  });

  // This used to assert a random six-card hand: London draws seven every time
  // and the player bottoms one card per mulligan (CR 103.5).
  it("keeps one card fewer per mulligan once the chosen cards are bottomed", () => {
    let state = bottomFirstCards(applyMulligan(duelState()));
    expect(state.hand).toHaveLength(6);

    state = applyMulligan(state);
    expect(state.hand).toHaveLength(7);
    expect(state.cardsToBottom).toBe(2);

    state = bottomFirstCards(state);
    expect(state.hand).toHaveLength(5);
  });
});

// The playtest keeps a hand of at least one card; the free mulligan does not
// count toward that limit either (CR 103.5c), so multiplayer goes one further.
describe("mulligan limit", () => {
  it.each([
    ["a duel", duelState, 6],
    ["a multiplayer game", multiplayerState, 7],
  ])("stops %s at a one-card hand", (_, setUp, limit) => {
    let state = setUp();
    for (let i = 0; i < limit + 3; i++) state = bottomFirstCards(applyMulligan(state));

    expect(maxMulligans(state)).toBe(limit);
    expect(state.mulliganCount).toBe(limit);
    expect(state.hand).toHaveLength(1);
  });
});

describe("applyBottomCards", () => {
  /** A duel's second mulligan: a new seven with two cards to bottom. */
  const secondDuelMulligan = () =>
    applyMulligan(bottomFirstCards(applyMulligan(duelState())));

  it("puts the chosen cards on the bottom of the library in the order chosen", () => {
    const secondMulligan = secondDuelMulligan();
    const chosen = [secondMulligan.hand[4], secondMulligan.hand[1]];

    const kept = applyBottomCards(secondMulligan, ids(chosen));

    expect(kept.cardsToBottom).toBe(0);
    expect(kept.hand).toHaveLength(5);
    expect(ids(kept.hand)).not.toContain(chosen[0].id);
    expect(ids(kept.library.slice(-2))).toEqual(ids(chosen));
    expect(kept.hand.length + kept.library.length).toBe(100);
  });

  it.each([
    ["nothing is pending", () => applyMulligan(multiplayerState()), (s: PlaytestEngine) => [s.hand[0].id]],
    ["too few cards", secondDuelMulligan, (s: PlaytestEngine) => [s.hand[0].id]],
    ["too many cards", secondDuelMulligan, (s: PlaytestEngine) => ids(s.hand.slice(0, 3))],
    ["the same card twice", secondDuelMulligan, (s: PlaytestEngine) => [s.hand[0].id, s.hand[0].id]],
    ["a card not in hand", secondDuelMulligan, (s: PlaytestEngine) => [s.hand[0].id, s.library[0].id]],
  ])("changes nothing when the choice names %s", (_, setUp, choose) => {
    const state = setUp();

    expect(applyBottomCards(state, choose(state))).toBe(state);
  });

  it("logs which cards went to the bottom", () => {
    const named = Array.from({ length: 20 }, (_, i) => makeCard(`n${i}`, `Card ${i}`));
    const pendingSeven = applyMulligan(
      createPlaytestState(named, { firstMulliganFree: false })
    );
    const chosen = pendingSeven.hand[2];

    const kept = applyBottomCards(pendingSeven, [chosen.id]);

    expect(kept.actionLog.at(-1)?.description).toBe(
      `Put ${chosen.name} on the bottom of the library`
    );
  });

  it("undoes back to the pending seven, then out of the mulligan", () => {
    const pendingSeven = applyMulligan(duelState());
    const kept = bottomFirstCards(pendingSeven);

    const choiceUndone = applyUndo(kept);
    expect(ids(choiceUndone.hand)).toEqual(ids(pendingSeven.hand));
    expect(choiceUndone.cardsToBottom).toBe(1);

    const mulliganUndone = applyUndo(choiceUndone);
    expect(mulliganUndone.mulliganCount).toBe(0);
    expect(mulliganUndone.cardsToBottom).toBe(0);
    expect(mulliganUndone.hand).toHaveLength(7);
  });
});

// Taking a mulligan is not finished until the cards are on the bottom (CR
// 103.5), so nothing else happens in the game until the choice is made. Undo
// stays available to take the mulligan back.
describe("while a bottom choice is pending", () => {
  const permanent = { ...makeCard("p1"), tapped: false, counters: 0 };
  const pending = () =>
    applyMulligan(makeState({ firstMulliganFree: false, battlefield: [permanent] }));
  const soldier = { name: "Soldier", power: "1/1", colors: ["white"], kind: "token" } as const;

  it.each([
    ["drawing a card", applyDrawCard],
    ["mulliganing again", applyMulligan],
    ["advancing the phase", applyNextPhase],
    ["starting the next turn", applyNextTurn],
    ["taking damage", (s: PlaytestEngine) => applyDamage(s, 3)],
    ["gaining life", (s: PlaytestEngine) => applyHeal(s, 3)],
    ["tapping a permanent", (s: PlaytestEngine) => applyTap(s, "p1")],
    ["untapping everything", applyUntapAll],
    ["playing a card from hand", (s: PlaytestEngine) => applyMoveToZone(s, s.hand[0].id, "hand", "battlefield")],
    ["adding a counter", (s: PlaytestEngine) => applyAddCounter(s, "p1", 1)],
    ["copying a permanent", (s: PlaytestEngine) => applyCreateCardCopy(s, "p1", "copy-1")],
    ["creating a token", (s: PlaytestEngine) => applyCreateToken(s, soldier, "token-1")],
    ["rolling a die", (s: PlaytestEngine) => applyRollDie(s, 6, 3)],
    ["recording mana", (s: PlaytestEngine) => applyRecordMana(s, 2)],
    ["adding a log note", (s: PlaytestEngine) => applyAddActionLogEntry(s, "note")],
    ["editing a log entry", (s: PlaytestEngine) => applyEditActionLogEntry(s, 1, "edited")],
    ["removing a log entry", (s: PlaytestEngine) => applyRemoveActionLogEntry(s, 1)],
  ])("ignores %s", (_, act) => {
    const state = pending();

    expect(act(state)).toBe(state);
  });
});

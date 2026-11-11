/**
 * Characterization tests for the playtest engine's edges (refactor slice P1-15).
 *
 * They pin what `engine.ts` does today, odd parts included, so the coming
 * restructuring (injected randomness, the split into `engine/`, one command
 * reducer) cannot change it unnoticed. They complement `engine.test.ts`, which
 * states the rules the engine follows on purpose.
 *
 * A test named "currently …" pins behaviour that a planned fix will change. The
 * row it cites (B2-44, B2-45, …) is that fix in the refactor programme's list;
 * the fix flips the test on purpose, in its own `fix/` pull request, with its own
 * Red test. Until then, a change here is a regression.
 */
import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { analyzeEngineDrawProgress } from "./draw-progress-evidence";
import {
  applyAddActionLogEntry,
  applyAddCounter,
  applyBottomCards,
  applyCreateCardCopy,
  applyCreateToken,
  applyDamage,
  applyDrawCard,
  applyEditActionLogEntry,
  applyHeal,
  applyMoveToZone,
  applyMulligan,
  applyNextPhase,
  applyNextTurn,
  applyRecordMana,
  applyRemoveActionLogEntry,
  applyRollDie,
  applyTap,
  applyUndo,
  applyUntapAll,
  createPlaytestState,
} from "./engine";
import type {
  BattlefieldCard,
  PlaytestActionLogEntry,
  PlaytestEngine,
} from "./engine";

function makeCard(id: string, name = `Card ${id}`): DeckCard {
  return {
    id,
    name,
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
    category: "creature",
    quantity: 1,
    zone: "main",
    scryfallId: id,
  };
}

function onBattlefield(
  card: DeckCard,
  extra: Partial<BattlefieldCard> = {}
): BattlefieldCard {
  return { ...card, tapped: false, counters: 0, ...extra };
}

const ids = (cards: readonly DeckCard[]) => cards.map((card) => card.id);

/** A shuffled game of `size` cards; Commander rules unless overridden. */
function dealt(
  overrides: Partial<PlaytestEngine> = {},
  size = 40
): PlaytestEngine {
  const cards = Array.from({ length: size }, (_, i) => makeCard(`c${i}`));
  return createPlaytestState(cards, overrides);
}

/** Every distinct state still reachable from `state` through undo snapshots. */
function reachableStates(state: PlaytestEngine): ReadonlySet<PlaytestEngine> {
  const seen = new Set<PlaytestEngine>();
  const pending = [state];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (seen.has(next)) continue;
    seen.add(next);
    for (const entry of next.history) pending.push(entry.state);
  }
  return seen;
}

describe("undo", () => {
  it("currently keeps undoing past the ten-entry stack: 15 draws then 15 undos return to the deal (pinned; see B2-44)", () => {
    const deal = dealt();
    let state = deal;
    for (let i = 0; i < 15; i++) state = applyDrawCard(state);
    expect(state.history).toHaveLength(10);

    for (let i = 0; i < 15; i++) state = applyUndo(state);

    expect(ids(state.hand)).toEqual(ids(deal.hand));
    expect(ids(state.library)).toEqual(ids(deal.library));
    expect(state.actionLog).toEqual([]);
    expect(state.history).toEqual([]);
  });

  it("currently keeps every earlier state alive through the snapshots' own stacks (pinned; see B2-44)", () => {
    let state = dealt();
    for (let i = 0; i < 15; i++) state = applyDrawCard(state);

    // The deal plus one state per draw: nothing was ever released.
    expect(reachableStates(state).size).toBe(16);
  });

  it("gives the next action the log id of the action it undid", () => {
    const twoDraws = applyDrawCard(applyDrawCard(dealt()));

    const redrawn = applyDrawCard(applyUndo(twoDraws));

    expect(redrawn.actionLog.map((entry) => entry.id)).toEqual([1, 2]);
    expect(redrawn.nextActionId).toBe(3);
  });
});

describe("losing on life", () => {
  it("currently keeps isGameOver after a heal brings life back above zero (pinned; see B2-46)", () => {
    const lost = applyDamage(dealt(), 40);
    expect(lost.isGameOver).toBe(true);

    const healed = applyHeal(lost, 5);

    expect(healed.lifeTotal).toBe(5);
    expect(healed.isGameOver).toBe(true);
  });

  it("currently clears isGameOver only when later damage leaves life above zero (pinned; see B2-46)", () => {
    const healed = applyHeal(applyDamage(dealt(), 45), 10);

    const hit = applyDamage(healed, 1);

    expect(hit.lifeTotal).toBe(4);
    expect(hit.isGameOver).toBe(false);
  });
});

describe("mulligan timing", () => {
  it("currently accepts a mulligan on turn 3 with permanents in play (pinned; see B2-47)", () => {
    const deal = dealt();
    const [permanent, discard] = deal.hand;
    const played = applyMoveToZone(deal, permanent.id, "hand", "battlefield");
    const discarded = applyMoveToZone(played, discard.id, "hand", "graveyard");
    const turnThree = applyNextTurn(applyNextTurn(discarded));
    const before = turnThree.hand.length + turnThree.library.length;

    const late = applyMulligan(turnThree);

    expect(late.mulliganCount).toBe(1);
    expect(late.hand).toHaveLength(7);
    expect(late.hand.length + late.library.length).toBe(before);
    expect(late.turn).toBe(3);
    expect(ids(late.battlefield)).toEqual([permanent.id]);
    expect(ids(late.graveyard)).toEqual([discard.id]);
    expect(late.actionLog.at(-1)).toMatchObject({
      turn: 3,
      phase: "Draw",
      description: "Free mulligan: drew a new seven",
    });
  });

  it("currently asks for the bottom choice right after each counted mulligan, so two mulligans take two choices (pinned; see B2-48)", () => {
    const first = applyMulligan(dealt({ firstMulliganFree: false }));
    expect(first.cardsToBottom).toBe(1);
    expect(applyMulligan(first)).toBe(first);

    const firstKept = applyBottomCards(first, ids(first.hand.slice(0, 1)));
    const second = applyMulligan(firstKept);
    expect(second.cardsToBottom).toBe(2);

    const secondKept = applyBottomCards(second, ids(second.hand.slice(0, 2)));

    expect(secondKept.hand).toHaveLength(5);
    expect(secondKept.actionLog.map((entry) => entry.description)).toEqual([
      "Mulligan: drew a new seven, 1 card to put on the bottom",
      `Put ${first.hand[0].name} on the bottom of the library`,
      "Mulligan: drew a new seven, 2 cards to put on the bottom",
      `Put ${second.hand[0].name}, ${second.hand[1].name} on the bottom of the library`,
    ]);
  });
});

describe("first-turn draw", () => {
  it("currently starts a multiplayer game in the Draw step of turn 1 without drawing (pinned; see B2-49)", () => {
    const multiplayer = dealt({ firstMulliganFree: true });

    const main = applyNextPhase(multiplayer);

    expect(multiplayer).toMatchObject({
      turn: 1,
      phase: "Draw",
      actionLog: [],
    });
    expect(multiplayer.hand).toHaveLength(7);
    expect(main.phase).toBe("Main1");
    expect(main.hand).toHaveLength(7);
  });

  it("currently reads a multiplayer turn-1 draw as drawing extra (pinned; see B2-49)", () => {
    const drewOnTurnOne = applyDrawCard(dealt({ firstMulliganFree: true }));

    expect(analyzeEngineDrawProgress(drewOnTurnOne)).toEqual({
      cardsSeen: 8,
      additionalCardsSeen: 1,
      status: "drawing-extra",
    });
  });
});

describe("turn and step progression", () => {
  it("enters the Draw step through next phase without drawing; only next turn draws", () => {
    const upkeep = { ...dealt(), phase: "Upkeep" as const };

    const draw = applyNextPhase(upkeep);

    expect(draw.phase).toBe("Draw");
    expect(ids(draw.hand)).toEqual(ids(upkeep.hand));
    expect(draw.actionLog.at(-1)).toEqual({
      id: 1,
      turn: 1,
      phase: "Upkeep",
      description: "Advanced to Draw",
    });
  });

  it("wraps End into the next turn's Untap step, untapping without drawing", () => {
    const end = dealt({
      phase: "End",
      battlefield: [onBattlefield(makeCard("p1"), { tapped: true })],
    });

    const untap = applyNextPhase(end);

    expect(untap).toMatchObject({ turn: 2, phase: "Untap" });
    expect(untap.battlefield[0].tapped).toBe(false);
    expect(ids(untap.hand)).toEqual(ids(end.hand));
  });

  it("starts the next turn from any step by jumping to its Draw step, untapping and drawing", () => {
    const combat = dealt({
      phase: "Combat",
      battlefield: [onBattlefield(makeCard("p1"), { tapped: true })],
    });

    const next = applyNextTurn(combat);

    expect(next).toMatchObject({ turn: 2, phase: "Draw" });
    expect(next.battlefield[0].tapped).toBe(false);
    expect(next.hand).toEqual([...combat.hand, combat.library[0]]);
  });
});

describe("createPlaytestState overrides", () => {
  it("defaults to the Commander rules: 40 life and a free first mulligan", () => {
    expect(dealt()).toMatchObject({
      lifeTotal: 40,
      firstMulliganFree: true,
      commanderIds: [],
    });
  });

  it("currently lets an override replace any dealt field, the commander ids and the hand included", () => {
    const state = dealt(
      {
        commandZone: [makeCard("cmd")],
        commanderIds: ["someone-else"],
        turn: 5,
        hand: [],
      },
      20
    );

    expect(state.commanderIds).toEqual(["someone-else"]);
    expect(state.turn).toBe(5);
    // The seven dealt cards are dropped, not returned to the library.
    expect(state.hand).toEqual([]);
    expect(state.library).toHaveLength(13);
  });
});

describe("leaving the battlefield", () => {
  const copy = onBattlefield(makeCard("copy-1", "Sol Ring"), {
    isSessionCopy: true,
  });

  it.each(["hand", "library", "graveyard", "exile"] as const)(
    "removes a session copy moved to the %s instead of moving it",
    (zone) => {
      const state = dealt({ battlefield: [copy] });

      const next = applyMoveToZone(state, "copy-1", "battlefield", zone);

      expect(next.battlefield).toEqual([]);
      expect(ids(next[zone])).not.toContain("copy-1");
      expect(next.actionLog.at(-1)?.description).toBe(
        "Removed Sol Ring from the battlefield"
      );
    }
  );

  it("refuses to put a session copy into the command zone", () => {
    const state = dealt({ battlefield: [copy] });

    expect(applyMoveToZone(state, "copy-1", "battlefield", "command")).toBe(
      state
    );
  });

  it("currently keeps the tapped flag and counters on a permanent put into the graveyard", () => {
    const worn = onBattlefield(makeCard("p1"), { tapped: true, counters: 2 });
    const state = dealt({ battlefield: [worn] });

    const died = applyMoveToZone(state, "p1", "battlefield", "graveyard");
    const back = applyMoveToZone(died, "p1", "graveyard", "battlefield");

    expect(died.graveyard[0]).toMatchObject({
      id: "p1",
      tapped: true,
      counters: 2,
    });
    expect(back.battlefield[0]).toMatchObject({
      id: "p1",
      tapped: false,
      counters: 0,
    });
  });

  it("currently logs a removed counter even when the permanent had none", () => {
    const state = dealt({ battlefield: [onBattlefield(makeCard("p1"))] });

    const next = applyAddCounter(state, "p1", -1);

    expect(next.battlefield[0].counters).toBe(0);
    expect(next.actionLog.at(-1)).toMatchObject({
      description: "Removed a counter from Card p1",
      counterDelta: -1,
    });
  });
});

// The engine writes its log lines in English; the export and the UI show them
// as they are (pinned; see B2-45, which turns them into translated events).
describe("action log lines", () => {
  const bolt = makeCard("bolt", "Lightning Bolt");
  const forest = makeCard("forest", "Forest");
  const sol = makeCard("sol", "Sol Ring");
  const kenrith = makeCard("kenrith", "Kenrith");
  const elves = onBattlefield(makeCard("elves", "Llanowar Elves"));
  const soldier = {
    name: "Soldier",
    power: "1/1",
    colors: ["white"],
    kind: "token",
  } as const;
  const emblem = {
    name: "Elspeth Emblem",
    power: null,
    colors: [],
    kind: "emblem",
  } as const;

  /** Main phase of turn 2, with a known hand, library, board and command zone. */
  const game = (): PlaytestEngine =>
    createPlaytestState([], {
      turn: 2,
      phase: "Main1",
      hand: [bolt, forest],
      library: [sol],
      battlefield: [elves],
      commandZone: [kenrith],
    });
  /** The same game with a manual note logged as entry 1. */
  const noted = () => applyAddActionLogEntry(game(), "Opponent concedes");

  type Line = Omit<PlaytestActionLogEntry, "id">;
  it.each<[string, (state: PlaytestEngine) => PlaytestEngine, Line]>([
    [
      "drawing",
      applyDrawCard,
      { turn: 2, phase: "Main1", description: "Drew a card", kind: "draw" },
    ],
    [
      "advancing a step",
      applyNextPhase,
      { turn: 2, phase: "Main1", description: "Advanced to Combat" },
    ],
    [
      "wrapping End into the next turn",
      (s) => applyNextPhase({ ...s, phase: "End" }),
      { turn: 3, phase: "Untap", description: "Started turn 3" },
    ],
    [
      "starting the next turn",
      applyNextTurn,
      {
        turn: 3,
        phase: "Draw",
        description: "Started turn 3 and drew a card",
        kind: "draw",
      },
    ],
    [
      "starting the next turn with no library",
      (s) => applyNextTurn({ ...s, library: [] }),
      { turn: 3, phase: "Draw", description: "Started turn 3" },
    ],
    [
      "taking damage",
      (s) => applyDamage(s, 3),
      {
        turn: 2,
        phase: "Main1",
        description: "Lost 3 life: damage",
        kind: "life",
        lifeDelta: -3,
      },
    ],
    [
      "taking described damage",
      (s) => applyDamage(s, 2, "combat"),
      {
        turn: 2,
        phase: "Main1",
        description: "Lost 2 life: combat",
        kind: "life",
        lifeDelta: -2,
      },
    ],
    [
      "gaining life",
      (s) => applyHeal(s, 4),
      {
        turn: 2,
        phase: "Main1",
        description: "Gained 4 life",
        kind: "life",
        lifeDelta: 4,
      },
    ],
    [
      "tapping",
      (s) => applyTap(s, "elves"),
      { turn: 2, phase: "Main1", description: "Tapped Llanowar Elves" },
    ],
    [
      "untapping",
      (s) => applyTap(applyTap(s, "elves"), "elves"),
      { turn: 2, phase: "Main1", description: "Untapped Llanowar Elves" },
    ],
    [
      "untapping everything",
      applyUntapAll,
      { turn: 2, phase: "Main1", description: "Untapped all permanents" },
    ],
    [
      "playing a card",
      (s) => applyMoveToZone(s, "forest", "hand", "battlefield"),
      {
        turn: 2,
        phase: "Main1",
        description: "Moved Forest from hand to battlefield",
      },
    ],
    [
      "taking a card from the library",
      (s) => applyMoveToZone(s, "sol", "library", "hand"),
      {
        turn: 2,
        phase: "Main1",
        description: "Moved Sol Ring from library to hand",
        kind: "cardSeen",
      },
    ],
    [
      "casting the commander",
      (s) => applyMoveToZone(s, "kenrith", "command", "battlefield"),
      {
        turn: 2,
        phase: "Main1",
        description: "Cast Kenrith from the command zone",
      },
    ],
    [
      "returning the commander",
      (s) =>
        applyMoveToZone(
          applyMoveToZone(s, "kenrith", "command", "graveyard"),
          "kenrith",
          "graveyard",
          "command"
        ),
      {
        turn: 2,
        phase: "Main1",
        description: "Returned Kenrith to the command zone",
      },
    ],
    [
      "copying a permanent",
      (s) => applyCreateCardCopy(s, "elves", "copy-1"),
      {
        turn: 2,
        phase: "Main1",
        description: "Created a copy of Llanowar Elves",
      },
    ],
    [
      "creating a token",
      (s) => applyCreateToken(s, soldier, "token-1"),
      { turn: 2, phase: "Main1", description: "Created 1/1 Soldier token" },
    ],
    [
      "creating an emblem",
      (s) => applyCreateToken(s, emblem, "emblem-1"),
      { turn: 2, phase: "Main1", description: "Created Elspeth Emblem" },
    ],
    [
      "rolling a die",
      (s) => applyRollDie(s, 20, 17),
      { turn: 2, phase: "Main1", description: "Rolled d20: 17" },
    ],
    [
      "producing mana",
      (s) => applyRecordMana(s, 3),
      {
        turn: 2,
        phase: "Main1",
        description: "Produced 3 mana",
        kind: "mana",
        amount: 3,
      },
    ],
    [
      "adding a counter",
      (s) => applyAddCounter(s, "elves", 2),
      {
        turn: 2,
        phase: "Main1",
        description: "Added a counter to Llanowar Elves",
        kind: "counter",
        counterDelta: 2,
      },
    ],
    [
      "writing a note",
      (s) => applyAddActionLogEntry(s, "  Opponent concedes  "),
      { turn: 2, phase: "Main1", description: "Opponent concedes" },
    ],
  ])("logs %s exactly", (_, act, line) => {
    const next = act(game());

    expect(next.actionLog.at(-1)).toEqual({
      ...line,
      id: next.nextActionId - 1,
    });
  });

  it("logs a mulligan's bottom choice with every card named, in the order chosen", () => {
    const seven = [
      bolt,
      forest,
      sol,
      ...Array.from({ length: 4 }, (_, i) => makeCard(`x${i}`)),
    ];
    const pending = createPlaytestState([], { hand: seven, cardsToBottom: 2 });

    const kept = applyBottomCards(pending, ["sol", "bolt"]);

    expect(kept.actionLog.at(-1)?.description).toBe(
      "Put Sol Ring, Lightning Bolt on the bottom of the library"
    );
  });

  it("edits a line in place: no new line, no new id, evidence cleared", () => {
    const mana = applyRecordMana(game(), 3);

    const edited = applyEditActionLogEntry(mana, 1, "Tapped two lands");

    expect(edited.actionLog).toEqual([
      { id: 1, turn: 2, phase: "Main1", description: "Tapped two lands" },
    ]);
    expect(edited.nextActionId).toBe(2);
    expect(applyUndo(edited)).toBe(mana);
  });

  it("removes a line without logging the removal", () => {
    const removed = applyRemoveActionLogEntry(noted(), 1);

    expect(removed.actionLog).toEqual([]);
    expect(removed.nextActionId).toBe(2);
  });
});

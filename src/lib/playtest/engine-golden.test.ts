/**
 * Golden game for the playtest engine (refactor slices P1-16 and TT-08).
 *
 * One seeded Commander game is replayed move by move: the deal, a free mulligan, a London
 * mulligan with its bottom choice, three turns of draws, plays, tapping, mana, a token, a copy,
 * counters, a die, combat damage, the commander cast and returned, a log note, an undo, and an
 * End step that wraps into the next turn. The test compares a readable transcript of that game,
 * which names every card in hand at each checkpoint, with the approved one below. A change in
 * how the engine shuffles, draws, moves cards or writes its log shows up as a readable diff.
 *
 * The game runs twice and must give the same transcript both times:
 * - on the default ports, with Web Crypto replaying a mulberry32 stream
 *   (`src/test/seeded-random.ts`) and `Date` faked at a fixed instant, which proves the
 *   production wiring draws and stamps exactly as before the ports existed;
 * - on injected ports (a seeded `RandomSource` and a fixed `Clock`), with Web Crypto and the
 *   system clock made to throw, which proves no move reaches past its ports.
 *
 * Approval rule: when the transcript changes, read the diff, check that the new game is right,
 * and say why in the pull request before updating `GOLDEN_TRANSCRIPT` (ADR 0005: actual output
 * is never copied into the expectation unchecked).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import {
  mulberry32,
  replayWebCrypto,
  seededRandom,
} from "@/test/seeded-random";
import { exportActionLogText } from "./action-log-export";
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
  applyRollDie,
  applyTap,
  applyUndo,
  createPlaytestState,
} from "./engine";
import type { PlaytestDeps, PlaytestEngine } from "./engine";

const SEED = 20261110;
const GAME_START = Date.UTC(2026, 10, 10, 20, 0, 0);
const DECK_NAME = "Kenrith goldfish";

const LIBRARY_NAMES = [
  "Sol Ring",
  "Arcane Signet",
  "Command Tower",
  "Forest",
  "Plains",
  "Island",
  "Swamp",
  "Mountain",
  "Cultivate",
  "Kodama's Reach",
  "Rampant Growth",
  "Llanowar Elves",
  "Birds of Paradise",
  "Beast Within",
  "Swords to Plowshares",
  "Counterspell",
  "Lightning Bolt",
  "Rhystic Study",
  "Eternal Witness",
  "Sakura-Tribe Elder",
  "Wood Elves",
  "Farseek",
  "Nature's Lore",
  "Three Visits",
  "Craterhoof Behemoth",
  "Avenger of Zendikar",
  "Heroic Intervention",
  "Cyclonic Rift",
  "Demonic Tutor",
  "Smothering Tithe",
];

function makeCard(id: string, name: string): DeckCard {
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

const LIBRARY = LIBRARY_NAMES.map((name, index) =>
  makeCard(`card-${index + 1}`, name)
);
const KENRITH = makeCard("kenrith", "Kenrith, the Returned King");
const SOLDIER = {
  name: "Soldier",
  power: "1/1",
  colors: ["white"],
  kind: "token",
} as const;

/** One step of the game: a label for the transcript and the move it makes. */
interface Step {
  readonly label: (state: PlaytestEngine) => string;
  /** `deps` is undefined when the game runs on the default ports. */
  readonly act: (state: PlaytestEngine, deps?: PlaytestDeps) => PlaytestEngine;
  /** Whether the transcript shows the board after this step. */
  readonly checkpoint?: boolean;
}

const names = (cards: readonly DeckCard[]) =>
  cards.map((card) => card.name).join(", ") || "—";
const first = (cards: readonly DeckCard[]): DeckCard => {
  const card = cards[0];
  if (card === undefined)
    throw new Error("the golden game expected a card here");
  return card;
};

/** The board as the transcript shows it at a checkpoint. */
function describeBoard(state: PlaytestEngine): readonly string[] {
  const battlefield = state.battlefield
    .map(
      (card) =>
        `${card.name}${card.tapped ? " (tapped)" : ""}${card.counters > 0 ? ` (+${card.counters})` : ""}`
    )
    .join(", ");
  return [
    `  turn ${state.turn}, ${state.phase} · life ${state.lifeTotal} · mulligans ${state.mulliganCount} · to bottom ${state.cardsToBottom}`,
    `  hand: ${names(state.hand)}`,
    `  library (${state.library.length}): top ${names(state.library.slice(0, 3))} · bottom ${names(state.library.slice(-2))}`,
    `  battlefield: ${battlefield || "—"}`,
    `  graveyard: ${names(state.graveyard)} · exile: ${names(state.exile)} · command: ${names(state.commandZone)}`,
  ];
}

const STEPS: readonly Step[] = [
  {
    label: () => "free mulligan",
    act: (s, deps) => applyMulligan(s, deps),
    checkpoint: true,
  },
  {
    label: () => "mulligan",
    act: (s, deps) => applyMulligan(s, deps),
    checkpoint: true,
  },
  {
    label: (s) => `bottom ${first(s.hand).name}`,
    act: (s, deps) => applyBottomCards(s, [first(s.hand).id], deps),
    checkpoint: true,
  },
  { label: () => "next phase", act: (s, deps) => applyNextPhase(s, deps) },
  {
    label: (s) => `play ${first(s.hand).name}`,
    act: (s, deps) =>
      applyMoveToZone(s, first(s.hand).id, "hand", "battlefield", deps),
  },
  {
    label: (s) => `tap ${first(s.battlefield).name}`,
    act: (s, deps) => applyTap(s, first(s.battlefield).id, deps),
  },
  {
    label: () => "record 1 mana",
    act: (s, deps) => applyRecordMana(s, 1, deps),
    checkpoint: true,
  },
  { label: () => "next turn", act: (s, deps) => applyNextTurn(s, deps) },
  {
    label: (s) => `play ${first(s.hand).name}`,
    act: (s, deps) =>
      applyMoveToZone(s, first(s.hand).id, "hand", "battlefield", deps),
  },
  {
    label: () => "create a Soldier token",
    act: (s, deps) => applyCreateToken(s, SOLDIER, "token-1", deps),
  },
  {
    label: (s) => `copy ${first(s.battlefield).name}`,
    act: (s, deps) =>
      applyCreateCardCopy(s, first(s.battlefield).id, "copy-1", deps),
  },
  {
    label: () => "two counters on the token",
    act: (s, deps) =>
      applyAddCounter(
        applyAddCounter(s, "token-1", 1, deps),
        "token-1",
        1,
        deps
      ),
  },
  {
    label: () => "roll a d20 (14)",
    act: (s, deps) => applyRollDie(s, 20, 14, deps),
  },
  {
    label: () => "take 7 combat damage",
    act: (s, deps) => applyDamage(s, 7, "combat", deps),
  },
  {
    label: () => "gain 2 life",
    act: (s, deps) => applyHeal(s, 2, deps),
    checkpoint: true,
  },
  { label: () => "next turn", act: (s, deps) => applyNextTurn(s, deps) },
  {
    label: (s) => `tutor ${first(s.library).name} to hand`,
    act: (s, deps) =>
      applyMoveToZone(s, first(s.library).id, "library", "hand", deps),
  },
  {
    label: () => "cast the commander",
    act: (s, deps) =>
      applyMoveToZone(s, KENRITH.id, "command", "battlefield", deps),
  },
  {
    label: () => "the copy dies",
    act: (s, deps) =>
      applyMoveToZone(s, "copy-1", "battlefield", "graveyard", deps),
  },
  {
    label: () => "the commander dies",
    act: (s, deps) =>
      applyMoveToZone(s, KENRITH.id, "battlefield", "graveyard", deps),
  },
  {
    label: () => "return the commander",
    act: (s, deps) =>
      applyMoveToZone(s, KENRITH.id, "graveyard", "command", deps),
  },
  {
    label: (s) => `exile ${first(s.battlefield).name}`,
    act: (s, deps) =>
      applyMoveToZone(s, first(s.battlefield).id, "battlefield", "exile", deps),
  },
  {
    label: () => "note",
    act: (s, deps) => applyAddActionLogEntry(s, "Opponent at 12", deps),
  },
  {
    label: () => "draw, then undo it",
    act: (s, deps) => applyUndo(applyDrawCard(s, deps)),
  },
  {
    label: () => "edit the note",
    act: (s, deps) =>
      applyEditActionLogEntry(s, s.nextActionId - 1, "Opponent at 11", deps),
  },
  {
    label: () => "next phase ×4",
    act: (s, deps) =>
      [1, 2, 3, 4].reduce((state) => applyNextPhase(state, deps), s),
  },
  {
    label: () => "next phase (End wraps)",
    act: (s, deps) => applyNextPhase(s, deps),
    checkpoint: true,
  },
];

/**
 * Replays the golden game and renders its transcript.
 *
 * @param deps - the ports every move receives; omit them to run on the defaults
 */
function playGoldenGame(deps?: PlaytestDeps): string {
  let state = createPlaytestState(
    LIBRARY,
    { commandZone: [KENRITH], firstMulliganFree: true, lifeTotal: 40 },
    deps
  );
  const lines = ["deal", ...describeBoard(state)];
  for (const step of STEPS) {
    lines.push(step.label(state));
    state = step.act(state, deps);
    if (step.checkpoint) lines.push(...describeBoard(state));
  }
  const life = state.lifeHistory.map(
    (entry) =>
      `  turn ${entry.turn} ${entry.phase}: ${entry.delta} (${entry.description}) at ${new Date(entry.timestamp).toISOString()}`
  );
  return [
    ...lines,
    "",
    "life history",
    ...life,
    "",
    exportActionLogText(DECK_NAME, state.actionLog),
  ].join("\n");
}

/** Approved 2026-11-10 by checking each checkpoint by hand: 30 cards conserved, seven dealt per
 * mulligan, one bottomed after the counted one, one draw per turn, the copy removed on leaving play. */
const GOLDEN_TRANSCRIPT = `deal
  turn 1, Draw · life 40 · mulligans 0 · to bottom 0
  hand: Swamp, Counterspell, Arcane Signet, Wood Elves, Avenger of Zendikar, Llanowar Elves, Birds of Paradise
  library (23): top Rhystic Study, Sakura-Tribe Elder, Cyclonic Rift · bottom Swords to Plowshares, Demonic Tutor
  battlefield: —
  graveyard: — · exile: — · command: Kenrith, the Returned King
free mulligan
  turn 1, Draw · life 40 · mulligans 1 · to bottom 0
  hand: Swords to Plowshares, Rampant Growth, Nature's Lore, Mountain, Heroic Intervention, Plains, Demonic Tutor
  library (23): top Beast Within, Wood Elves, Three Visits · bottom Llanowar Elves, Island
  battlefield: —
  graveyard: — · exile: — · command: Kenrith, the Returned King
mulligan
  turn 1, Draw · life 40 · mulligans 2 · to bottom 1
  hand: Heroic Intervention, Birds of Paradise, Island, Swords to Plowshares, Command Tower, Swamp, Cultivate
  library (23): top Smothering Tithe, Plains, Eternal Witness · bottom Wood Elves, Counterspell
  battlefield: —
  graveyard: — · exile: — · command: Kenrith, the Returned King
bottom Heroic Intervention
  turn 1, Draw · life 40 · mulligans 2 · to bottom 0
  hand: Birds of Paradise, Island, Swords to Plowshares, Command Tower, Swamp, Cultivate
  library (24): top Smothering Tithe, Plains, Eternal Witness · bottom Counterspell, Heroic Intervention
  battlefield: —
  graveyard: — · exile: — · command: Kenrith, the Returned King
next phase
play Birds of Paradise
tap Birds of Paradise
record 1 mana
  turn 1, Main1 · life 40 · mulligans 2 · to bottom 0
  hand: Island, Swords to Plowshares, Command Tower, Swamp, Cultivate
  library (24): top Smothering Tithe, Plains, Eternal Witness · bottom Counterspell, Heroic Intervention
  battlefield: Birds of Paradise (tapped)
  graveyard: — · exile: — · command: Kenrith, the Returned King
next turn
play Island
create a Soldier token
copy Birds of Paradise
two counters on the token
roll a d20 (14)
take 7 combat damage
gain 2 life
  turn 2, Draw · life 35 · mulligans 2 · to bottom 0
  hand: Swords to Plowshares, Command Tower, Swamp, Cultivate, Smothering Tithe
  library (23): top Plains, Eternal Witness, Beast Within · bottom Counterspell, Heroic Intervention
  battlefield: Birds of Paradise, Island, 1/1 Soldier token (+2), Birds of Paradise
  graveyard: — · exile: — · command: Kenrith, the Returned King
next turn
tutor Eternal Witness to hand
cast the commander
the copy dies
the commander dies
return the commander
exile Birds of Paradise
note
draw, then undo it
edit the note
next phase ×4
next phase (End wraps)
  turn 4, Untap · life 35 · mulligans 2 · to bottom 0
  hand: Swords to Plowshares, Command Tower, Swamp, Cultivate, Smothering Tithe, Plains, Eternal Witness
  library (21): top Beast Within, Farseek, Craterhoof Behemoth · bottom Counterspell, Heroic Intervention
  battlefield: Island, 1/1 Soldier token (+2)
  graveyard: — · exile: Birds of Paradise · command: Kenrith, the Returned King

life history
  turn 2 Draw: -7 (combat) at 2026-11-10T20:00:00.000Z
  turn 2 Draw: 2 (heal) at 2026-11-10T20:00:00.000Z

Kenrith goldfish — playtest log

Turn 1
Evidence: 0 draws, 1 mana, 0 additional cards seen
- Draw: Free mulligan: drew a new seven
- Draw: Mulligan: drew a new seven, 1 card to put on the bottom
- Draw: Put Heroic Intervention on the bottom of the library
- Draw: Advanced to Main1
- Main1: Moved Birds of Paradise from hand to battlefield
- Main1: Tapped Birds of Paradise
- Main1: Produced 1 mana

Turn 2
Evidence: 1 draws, 0 mana, 1 additional cards seen
- Draw: Started turn 2 and drew a card
- Draw: Moved Island from hand to battlefield
- Draw: Created 1/1 Soldier token
- Draw: Created a copy of Birds of Paradise
- Draw: Added a counter to 1/1 Soldier token
- Draw: Added a counter to 1/1 Soldier token
- Draw: Rolled d20: 14
- Draw: Lost 7 life: combat
- Draw: Gained 2 life

Turn 3
Evidence: 1 draws, 0 mana, 2 additional cards seen
- Draw: Started turn 3 and drew a card
- Draw: Moved Eternal Witness from library to hand
- Draw: Cast Kenrith, the Returned King from the command zone
- Draw: Removed Birds of Paradise from the battlefield
- Draw: Moved Kenrith, the Returned King from battlefield to graveyard
- Draw: Returned Kenrith, the Returned King to the command zone
- Draw: Moved Birds of Paradise from battlefield to exile
- Draw: Opponent at 11
- Draw: Advanced to Main1
- Main1: Advanced to Combat
- Combat: Advanced to Main2
- Main2: Advanced to End

Turn 4
- Untap: Started turn 4`;

describe("golden game", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("replays the approved transcript on the default ports, with Web Crypto replaying the seed", () => {
    replayWebCrypto(mulberry32(SEED));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(GAME_START);

    expect(playGoldenGame()).toBe(GOLDEN_TRANSCRIPT);
  });

  it("replays the same transcript on injected ports, without reading Web Crypto or the system clock", () => {
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("a move read Web Crypto instead of its RandomSource");
    });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("a move read the system clock instead of its Clock");
    });

    const transcript = playGoldenGame({
      random: seededRandom(SEED),
      clock: { now: () => GAME_START },
    });

    expect(transcript).toBe(GOLDEN_TRANSCRIPT);
  });
});

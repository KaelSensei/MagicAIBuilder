/**
 * Sociable tests of the commander-damage tally: a deck is dealt as the store deals it
 * (`buildSetup` + `dealFrom`), the player's taps go through `reducePlaytest`, and the tally is read
 * back through `commanderDamageByOpponent`, the view the playtest shows.
 *
 * Rules: CR 903.10a (21 combat damage from the same commander loses the game), CR 704.6c (the
 * state-based action), CR 903.12h (Brawl does not use it).
 */
import { describe, expect, it } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { buildSetup, dealFrom, type PlaytestOptions } from "./deal";
import {
  commanderDamageByOpponent,
  reducePlaytest,
  type PlaytestCommand,
  type PlaytestCommandDeps,
  type PlaytestEngine,
} from "./engine";

// ─── Fixtures ─────────────────────────────────────────────────────────────
const GAME_START = Date.UTC(2026, 10, 19, 20, 0, 0);

/** Deals in deck order, at a fixed time, with one known id. */
const deps: PlaytestCommandDeps = {
  random: { intBelow: (upperExclusive) => upperExclusive - 1 },
  clock: { now: () => GAME_START },
  newId: () => "fixed",
};

const makeCard = (id: string, name: string): DeckCard =>
  aDeckCard({
    id,
    name,
    scryfallId: id,
    typeLine: "Legendary Creature",
    category: "creature",
  });

const KENRITH = makeCard("kenrith", "Kenrith, the Returned King");
const TYMNA = makeCard("tymna", "Tymna the Weaver");
const THRASIOS = makeCard("thrasios", "Thrasios, Triton Hero");

const LIBRARY = Array.from({ length: 30 }, (_, index) =>
  makeCard(`c${index + 1}`, `Card ${index + 1}`)
);

/** Deals `deck` as the store does at the start of a session. */
function deal(deck: Partial<Deck>, options: PlaytestOptions = {}) {
  return dealFrom(
    buildSetup(aDeck({ cards: LIBRARY, ...deck }), options),
    deps
  );
}

/** Applies the player's moves in order. */
function play(
  state: PlaytestEngine,
  ...commands: readonly PlaytestCommand[]
): PlaytestEngine {
  return commands.reduce(
    (current, command) => reducePlaytest(current, command, deps),
    state
  );
}

/** One record of combat damage from a commander to an imagined opponent. */
const hit = (
  commanderId: string,
  opponent: number,
  amount: number
): PlaytestCommand => ({
  type: "commanderDamage",
  commanderId,
  opponent,
  amount,
});

// ─── The loss at 21 ───────────────────────────────────────────────────────
describe("the commander-damage tally", () => {
  it("21 combat damage from one commander marks that opponent as lost (CR 903.10a)", () => {
    const dealt = deal({ commander: KENRITH });

    const after = play(
      dealt,
      hit("kenrith", 1, 7),
      hit("kenrith", 1, 7),
      hit("kenrith", 1, 7)
    );

    expect(commanderDamageByOpponent(after)[0]).toEqual({
      opponent: 1,
      hasLost: true,
      fromCommanders: [
        {
          commanderId: "kenrith",
          commanderName: "Kenrith, the Returned King",
          damage: 21,
        },
      ],
    });
  });

  it("keeps partner damage apart: 11 from one and 10 from the other is not a loss (CR 903.10a)", () => {
    const dealt = deal({ commander: TYMNA, partner: THRASIOS });

    const after = play(dealt, hit("tymna", 2, 11), hit("thrasios", 2, 10));

    const second = commanderDamageByOpponent(after)[1];
    expect(second?.hasLost).toBe(false);
    expect(second?.fromCommanders.map(({ damage }) => damage)).toEqual([
      11, 10,
    ]);
  });

  it("marks the loss once one partner alone reaches 21", () => {
    const dealt = deal({ commander: TYMNA, partner: THRASIOS });

    const after = play(dealt, hit("tymna", 1, 10), hit("thrasios", 1, 21));

    expect(commanderDamageByOpponent(after)[0]?.hasLost).toBe(true);
  });

  it("undo restores the previous tally and lifts the loss mark", () => {
    const fourteen = play(
      deal({ commander: KENRITH }),
      hit("kenrith", 1, 7),
      hit("kenrith", 1, 7)
    );
    const lost = play(fourteen, hit("kenrith", 1, 7));

    const undone = play(lost, { type: "undo" });

    expect(undone).toEqual(fourteen);
    expect(commanderDamageByOpponent(undone)[0]).toMatchObject({
      hasLost: false,
      fromCommanders: [{ damage: 14 }],
    });
  });

  it("writes one action-log line per hit, naming the seat, the commander and the total", () => {
    const dealt = deal({ commander: KENRITH });

    const after = play(dealt, hit("kenrith", 3, 5), hit("kenrith", 3, 4));

    expect(after.actionLog.slice(dealt.actionLog.length)).toEqual([
      expect.objectContaining({
        message: {
          key: "commanderDamage",
          params: {
            opponent: 3,
            amount: 5,
            card: "Kenrith, the Returned King",
            total: 5,
          },
        },
      }),
      expect.objectContaining({
        message: {
          key: "commanderDamage",
          params: {
            opponent: 3,
            amount: 4,
            card: "Kenrith, the Returned King",
            total: 9,
          },
        },
      }),
    ]);
  });

  it("leaves the player's own life total and life history alone", () => {
    const dealt = deal({ commander: KENRITH });

    const after = play(dealt, hit("kenrith", 1, 7));

    expect(after.lifeTotal).toBe(dealt.lifeTotal);
    expect(after.lifeHistory).toEqual(dealt.lifeHistory);
  });

  it.each([0, -3, 2.5])(
    "refuses an amount of %s: the same state, nothing logged",
    (amount) => {
      const dealt = deal({ commander: KENRITH });

      expect(play(dealt, hit("kenrith", 1, amount))).toBe(dealt);
    }
  );

  it("refuses a card that is not one of the game's commanders", () => {
    const dealt = deal({ commander: KENRITH });

    expect(play(dealt, hit("c1", 1, 7))).toBe(dealt);
  });
});

// ─── Seats and formats ────────────────────────────────────────────────────
describe("the seats and formats the tally offers", () => {
  it("offers three imagined opponents at a multiplayer Commander table", () => {
    const dealt = deal({ commander: KENRITH }, { multiplayer: true });

    expect(
      commanderDamageByOpponent(dealt).map((seat) => seat.opponent)
    ).toEqual([1, 2, 3]);
    expect(play(dealt, hit("kenrith", 4, 7))).toBe(dealt);
  });

  it("offers one opponent in a Commander duel", () => {
    const dealt = deal({ commander: KENRITH }, { multiplayer: false });

    expect(commanderDamageByOpponent(dealt)).toHaveLength(1);
    expect(play(dealt, hit("kenrith", 2, 7))).toBe(dealt);
  });

  it("a Brawl playtest offers no tally (CR 903.12h)", () => {
    const dealt = deal({ format: "brawl", commander: KENRITH });

    expect(commanderDamageByOpponent(dealt)).toEqual([]);
    expect(play(dealt, hit("kenrith", 1, 7))).toBe(dealt);
  });

  it.each(["oathbreaker", "modern", "standard"] as const)(
    "a %s playtest offers no tally",
    (format) => {
      const dealt = deal({ format, commander: KENRITH });

      expect(commanderDamageByOpponent(dealt)).toEqual([]);
      expect(play(dealt, hit("kenrith", 1, 7))).toBe(dealt);
    }
  );

  it("a Commander deck without a commander offers no tally", () => {
    expect(commanderDamageByOpponent(deal({ commander: null }))).toEqual([]);
  });

  it("keeps the tally offered after a restart deals the same setup again", () => {
    const setup = buildSetup(aDeck({ cards: LIBRARY, commander: KENRITH }), {});

    expect(dealFrom(setup, deps).commanderDamageOpponents).toBe(3);
  });
});

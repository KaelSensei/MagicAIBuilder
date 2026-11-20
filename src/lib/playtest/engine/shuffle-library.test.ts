/**
 * The shuffle-library command through the reducer: the player shuffles their library by hand,
 * as a tutor or a fetch land tells them to (CR 701.24a), as one undo step with one log line.
 *
 * The game is dealt in deck order (a random source that never swaps) so every zone is known;
 * the shuffle itself then reads a seeded source, so the new order is fixed by the seed.
 */

import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { seededRandom } from "@/test/seeded-random";
import {
  applyMoveToZone,
  applyMulligan,
  createPlaytestState,
  reducePlaytest,
  type PlaytestCommandDeps,
  type PlaytestEngine,
  type RandomSource,
} from "@/lib/playtest/engine";

// ─── Fixtures ─────────────────────────────────────────────────────────────
const GAME_START = Date.UTC(2026, 10, 20, 20, 0, 0);

/** Always picks the last index, so the Fisher–Yates shuffle swaps nothing. */
const inDeckOrder: RandomSource = {
  intBelow: (upperExclusive) => upperExclusive - 1,
};

function depsWith(random: RandomSource): PlaytestCommandDeps {
  return {
    random,
    clock: { now: () => GAME_START },
    newId: () => "fixed",
  };
}

const DECK = Array.from({ length: 20 }, (_, index) =>
  aDeckCard({ id: `c${index + 1}`, name: `Card ${index + 1}` })
);

/** A duel dealt in deck order, with one permanent on the battlefield and one card in the yard. */
function gameUnderWay(): PlaytestEngine {
  const deps = depsWith(inDeckOrder);
  const dealt = createPlaytestState(
    DECK,
    { multiplayer: false, firstMulliganFree: false },
    deps
  );
  const withPermanent = applyMoveToZone(
    dealt,
    "c1",
    "hand",
    "battlefield",
    deps
  );
  return applyMoveToZone(withPermanent, "c2", "hand", "graveyard", deps);
}

const ids = (cards: readonly { readonly id: string }[]): string[] =>
  cards.map((card) => card.id);

// ─── Scenarios ────────────────────────────────────────────────────────────
describe("shuffling the library (CR 701.24a)", () => {
  it("keeps its cards, changes no other zone, and undo restores the order", () => {
    const before = gameUnderWay();

    const shuffled = reducePlaytest(
      before,
      { type: "shuffleLibrary" },
      depsWith(seededRandom(7))
    );

    expect(ids(shuffled.library)).not.toEqual(ids(before.library));
    expect([...ids(shuffled.library)].sort()).toEqual(
      [...ids(before.library)].sort()
    );
    expect(shuffled.hand).toEqual(before.hand);
    expect(shuffled.battlefield).toEqual(before.battlefield);
    expect(shuffled.graveyard).toEqual(before.graveyard);
    expect(shuffled.exile).toEqual(before.exile);
    expect(shuffled.commandZone).toEqual(before.commandZone);

    const undone = reducePlaytest(shuffled, { type: "undo" });
    expect(undone).toBe(before);
  });

  it("writes one line, Library shuffled, as one undo step", () => {
    const before = gameUnderWay();

    const shuffled = reducePlaytest(
      before,
      { type: "shuffleLibrary" },
      depsWith(seededRandom(7))
    );

    expect(shuffled.actionLog).toHaveLength(before.actionLog.length + 1);
    expect(shuffled.actionLog.at(-1)?.description).toBe("Library shuffled");
    expect(shuffled.history).toHaveLength(before.history.length + 1);
  });

  it("replays the same order from the same seed", () => {
    const before = gameUnderWay();
    const command = { type: "shuffleLibrary" } as const;

    const once = reducePlaytest(before, command, depsWith(seededRandom(11)));
    const again = reducePlaytest(before, command, depsWith(seededRandom(11)));

    expect(ids(again.library)).toEqual(ids(once.library));
  });

  it("waits while a mulligan waits for its bottom cards (CR 103.5)", () => {
    const choosing = applyMulligan(gameUnderWay(), depsWith(inDeckOrder));

    const result = reducePlaytest(
      choosing,
      { type: "shuffleLibrary" },
      depsWith(seededRandom(7))
    );

    expect(result).toBe(choosing);
  });
});

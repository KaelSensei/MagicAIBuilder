/**
 * Solitary tests of the battlefield helpers shared by several transitions.
 *
 * The transitions themselves (`applyTap`, `applyUntapAll`, tokens, copies, counters) are covered
 * through the barrel in `../engine.test.ts`.
 */

import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { untapAll } from "./battlefield";
import type { BattlefieldCard } from "./types";

function aPermanent(overrides: Partial<BattlefieldCard> = {}): BattlefieldCard {
  return { ...aDeckCard(), tapped: false, counters: 0, ...overrides };
}

describe("untapAll", () => {
  it("untaps every tapped permanent and keeps the rest of each card", () => {
    const battlefield = [
      aPermanent({ id: "a", tapped: true, counters: 2 }),
      aPermanent({ id: "b", tapped: false }),
      aPermanent({ id: "c", tapped: true, isSessionCopy: true }),
    ];

    const untapped = untapAll(battlefield);

    expect(untapped).toEqual([
      { ...battlefield[0], tapped: false },
      battlefield[1],
      { ...battlefield[2], tapped: false },
    ]);
  });

  it("keeps the permanents in their order and does not change the input", () => {
    const battlefield = [
      aPermanent({ id: "a", tapped: true }),
      aPermanent({ id: "b", tapped: true }),
    ];

    const untapped = untapAll(battlefield);

    expect(untapped.map((card) => card.id)).toEqual(["a", "b"]);
    expect(battlefield.map((card) => card.tapped)).toEqual([true, true]);
  });

  it("returns an empty battlefield unchanged", () => {
    expect(untapAll([])).toEqual([]);
  });
});

/**
 * Solitary tests of the life-history helper shared by `applyDamage` and `applyHeal`.
 *
 * The transitions themselves are covered through the barrel in `../engine.test.ts`.
 */

import { describe, expect, it } from "vitest";
import { lifeEntry } from "./life";

const atTurnThreeMain = { turn: 3, phase: "Main1" } as const;
const clockAt = (now: number) => ({ now: () => now });

describe("lifeEntry", () => {
  it("records a loss with the turn, the step and the time it happened", () => {
    const entry = lifeEntry(atTurnThreeMain, clockAt(1_700_000_000_000), {
      delta: -3,
      description: "combat damage",
    });

    expect(entry).toEqual({
      turn: 3,
      phase: "Main1",
      timestamp: 1_700_000_000_000,
      delta: -3,
      description: "combat damage",
    });
  });

  it("records a gain the same way", () => {
    const entry = lifeEntry(atTurnThreeMain, clockAt(42), {
      delta: 5,
      description: "heal",
    });

    expect(entry.delta).toBe(5);
    expect(entry.description).toBe("heal");
    expect(entry.timestamp).toBe(42);
  });

  it("reads the clock once, when the entry is made", () => {
    let reads = 0;
    const clock = {
      now: () => {
        reads += 1;
        return reads;
      },
    };

    const entry = lifeEntry(atTurnThreeMain, clock, {
      delta: -1,
      description: "damage",
    });

    expect(entry.timestamp).toBe(1);
    expect(reads).toBe(1);
  });
});

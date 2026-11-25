/**
 * Sociable tests of the designations and player counters the player sets: a deck is dealt as the
 * store deals it (`buildSetup` + `dealFrom`), the player's taps go through `reducePlaytest`, and
 * the result is read back from the engine state and `hasLostOnPoison`, what the playtest shows.
 *
 * Rules: CR 104.3d, 704.5c, 122.1f (ten poison counters lose the game), CR 107.14 (energy),
 * CR 701.54a (the Ring tempts you), CR 702.131c (the city's blessing), CR 725.3 and 726.3 (the
 * monarch and the initiative), CR 731.1 (day and night).
 */
import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { buildSetup, dealFrom } from "./deal";
import {
  hasLostOnPoison,
  reducePlaytest,
  type PlaytestCommand,
  type PlaytestCommandDeps,
  type PlaytestEngine,
} from "./engine";

// ─── Fixtures ─────────────────────────────────────────────────────────────
const GAME_START = Date.UTC(2026, 10, 20, 20, 0, 0);

/** Deals in deck order, at a fixed time, with one known id. */
const deps: PlaytestCommandDeps = {
  random: { intBelow: (upperExclusive) => upperExclusive - 1 },
  clock: { now: () => GAME_START },
  newId: () => "fixed",
};

const LIBRARY: readonly DeckCard[] = Array.from({ length: 30 }, (_, index) =>
  aDeckCard({
    id: `c${index + 1}`,
    name: `Card ${index + 1}`,
    scryfallId: `c${index + 1}`,
  })
);

/** Deals a 60-card Modern deck as the store does at the start of a session. */
function deal(): PlaytestEngine {
  return dealFrom(
    buildSetup(aDeck({ format: "modern", cards: [...LIBRARY] }), {}),
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

const poison = (amount: number): PlaytestCommand => ({
  type: "playerCounter",
  counter: "poison",
  amount,
});

// ─── Poison ───────────────────────────────────────────────────────────────
describe("poison counters", () => {
  it("ten poison counters mark the player as having lost (CR 104.3d)", () => {
    const after = play(deal(), poison(3), poison(7));

    expect(after.designations.poison).toBe(10);
    expect(hasLostOnPoison(after)).toBe(true);
  });

  it("nine poison counters are no loss", () => {
    const after = play(deal(), poison(9));

    expect(after.designations.poison).toBe(9);
    expect(hasLostOnPoison(after)).toBe(false);
  });
});

// ─── The city's blessing ──────────────────────────────────────────────────
describe("the city's blessing", () => {
  it("the city's blessing stays until undo (CR 702.131c)", () => {
    const dealt = deal();
    const blessed = play(dealt, { type: "gainCitysBlessing" });

    expect(blessed.designations.citysBlessing).toBe(true);
    expect(play(blessed, { type: "gainCitysBlessing" })).toBe(blessed);
    expect(play(blessed, { type: "undo" }).designations.citysBlessing).toBe(
      false
    );
  });
});

// ─── Day and night ────────────────────────────────────────────────────────
describe("day and night", () => {
  it("day and night never return to neither without undo (CR 731.1)", () => {
    const dealt = deal();
    expect(dealt.designations.dayNight).toBe("neither");

    const day = play(dealt, { type: "setDayNight", dayNight: "day" });
    const night = play(day, { type: "setDayNight", dayNight: "night" });
    const dayAgain = play(night, { type: "setDayNight", dayNight: "day" });

    expect(day.designations.dayNight).toBe("day");
    expect(night.designations.dayNight).toBe("night");
    expect(dayAgain.designations.dayNight).toBe("day");
    expect(play(dayAgain, { type: "setDayNight", dayNight: "day" })).toBe(
      dayAgain
    );
    expect(play(day, { type: "undo" }).designations.dayNight).toBe("neither");
  });

  it("logs the change as the rules word it (CR 731.1a)", () => {
    const dealt = deal();

    const after = play(
      dealt,
      { type: "setDayNight", dayNight: "night" },
      { type: "setDayNight", dayNight: "day" }
    );

    expect(
      after.actionLog.slice(dealt.actionLog.length).map((line) => line.message)
    ).toEqual([
      { key: "dayNightBegan", params: { to: "night" } },
      { key: "dayNightSwapped", params: { to: "day" } },
    ]);
  });
});

// ─── The monarch, the initiative and the Ring ─────────────────────────────
describe("the monarch, the initiative and the Ring", () => {
  it.each(["monarch", "initiative"] as const)(
    "the %s is on, then off when an imagined opponent takes it (CR 725.3, 726.3)",
    (designation) => {
      const dealt = deal();
      expect(dealt.designations[designation]).toBe(false);

      const taken = play(dealt, { type: "toggleDesignation", designation });
      const lost = play(taken, { type: "toggleDesignation", designation });

      expect(taken.designations[designation]).toBe(true);
      expect(lost.designations[designation]).toBe(false);
    }
  );

  it("counts the times the Ring has tempted the player (CR 701.54a)", () => {
    const dealt = deal();

    const after = play(dealt, { type: "ringTempts" }, { type: "ringTempts" });

    expect(after.designations.ringTemptations).toBe(2);
    expect(after.actionLog.at(-1)?.message).toEqual({
      key: "ringTempted",
      params: { total: 2 },
    });
  });
});

// ─── Energy and experience ────────────────────────────────────────────────
describe("energy and experience counters", () => {
  it.each(["energy", "experience"] as const)(
    "%s counters go up and down one at a time, never below zero",
    (counter) => {
      const dealt = deal();
      const one = play(dealt, { type: "playerCounter", counter, amount: 1 });
      const none = play(one, { type: "playerCounter", counter, amount: -1 });

      expect(one.designations[counter]).toBe(1);
      expect(none.designations[counter]).toBe(0);
      expect(play(none, { type: "playerCounter", counter, amount: -1 })).toBe(
        none
      );
    }
  );

  it.each([0, 1.5, Number.NaN])(
    "refuses a change of %s: the same state, nothing logged",
    (amount) => {
      const dealt = deal();

      expect(
        play(dealt, { type: "playerCounter", counter: "energy", amount })
      ).toBe(dealt);
    }
  );
});

// ─── Undo, the log and the life total ─────────────────────────────────────
describe("every change is one step", () => {
  it("undo restores the previous counter", () => {
    const three = play(deal(), poison(3));
    const five = play(three, poison(2));

    expect(play(five, { type: "undo" })).toEqual(three);
  });

  it("writes one action-log line per change", () => {
    const dealt = deal();

    const after = play(
      dealt,
      poison(2),
      { type: "playerCounter", counter: "energy", amount: 3 },
      { type: "playerCounter", counter: "energy", amount: -1 },
      { type: "toggleDesignation", designation: "monarch" },
      { type: "toggleDesignation", designation: "monarch" },
      { type: "toggleDesignation", designation: "initiative" },
      { type: "gainCitysBlessing" }
    );

    expect(
      after.actionLog.slice(dealt.actionLog.length).map((line) => line.message)
    ).toEqual([
      {
        key: "playerCountersGained",
        params: { counter: "poison", count: 2, total: 2 },
      },
      {
        key: "playerCountersGained",
        params: { counter: "energy", count: 3, total: 3 },
      },
      {
        key: "playerCountersLost",
        params: { counter: "energy", count: 1, total: 2 },
      },
      { key: "becameMonarch" },
      { key: "opponentBecameMonarch" },
      { key: "tookInitiative" },
      { key: "gotCitysBlessing" },
    ]);
  });

  it("a change leaves the life total and its history unchanged", () => {
    const dealt = play(deal(), { type: "damage", amount: 3 });

    const after = play(
      dealt,
      poison(10),
      { type: "toggleDesignation", designation: "monarch" },
      { type: "ringTempts" },
      { type: "setDayNight", dayNight: "day" },
      { type: "gainCitysBlessing" }
    );

    expect(after.lifeTotal).toBe(dealt.lifeTotal);
    expect(after.lifeHistory).toEqual(dealt.lifeHistory);
    expect(after.commanderDamage).toEqual(dealt.commanderDamage);
  });

  it("waits while a mulligan waits for its bottom cards (CR 103.5)", () => {
    const choosing = play(deal(), { type: "mulligan" });

    expect(play(choosing, poison(1), { type: "ringTempts" })).toBe(choosing);
  });
});

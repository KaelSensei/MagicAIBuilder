import { describe, it, expect } from "vitest";

import { parseSessionInput, summarizeSessions } from "./session-input";
import type { PlaytestSession } from "./analytics";

function session(overrides: Partial<PlaytestSession> = {}): PlaytestSession {
  return {
    id: "s1",
    deckId: "d1",
    userId: "u1",
    result: "win",
    turns: 8,
    mulliganCount: 0,
    createdAt: new Date("2026-08-16T10:00:00Z"),
    ...overrides,
  };
}

describe("parseSessionInput", () => {
  it("accepts a minimal valid session", () => {
    const parsed = parseSessionInput({ result: "win", turns: 8 });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.result).toBe("win");
      expect(parsed.value.turns).toBe(8);
      expect(parsed.value.mulliganCount).toBe(0);
    }
  });

  it("accepts every result the schema stores", () => {
    for (const result of ["win", "loss", "draw"]) {
      expect(parseSessionInput({ result, turns: 1 }).ok).toBe(true);
    }
  });

  it("rejects a result outside the three the schema stores", () => {
    // The column is a plain string, so the route is the only thing standing
    // between a typo and a row that breaks every aggregate downstream.
    const parsed = parseSessionInput({ result: "victory", turns: 8 });
    expect(parsed.ok).toBe(false);
  });

  it("rejects a turn count below one — a game always has a first turn", () => {
    expect(parseSessionInput({ result: "win", turns: 0 }).ok).toBe(false);
    expect(parseSessionInput({ result: "win", turns: -3 }).ok).toBe(false);
  });

  it("rejects a non-integer turn count", () => {
    expect(parseSessionInput({ result: "win", turns: 4.5 }).ok).toBe(false);
  });

  it("rejects a negative mulligan count", () => {
    expect(parseSessionInput({ result: "win", turns: 8, mulliganCount: -1 }).ok).toBe(false);
  });

  it("rejects more mulligans than a hand has cards", () => {
    // Londo mulligan bottoms one card per mulligan; past seven there is no hand.
    expect(parseSessionInput({ result: "win", turns: 8, mulliganCount: 8 }).ok).toBe(false);
  });

  it("accepts a difficulty from the known set and rejects anything else", () => {
    expect(parseSessionInput({ result: "win", turns: 8, difficulty: "cedh" }).ok).toBe(true);
    expect(parseSessionInput({ result: "win", turns: 8, difficulty: "hard" }).ok).toBe(false);
  });

  it("treats an absent difficulty as unspecified rather than invalid", () => {
    const parsed = parseSessionInput({ result: "win", turns: 8 });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.difficulty).toBeUndefined();
  });

  it("trims notes and drops them when they are only whitespace", () => {
    const withNotes = parseSessionInput({ result: "win", turns: 8, notes: "  kept it  " });
    if (withNotes.ok) expect(withNotes.value.notes).toBe("kept it");

    const blank = parseSessionInput({ result: "win", turns: 8, notes: "   " });
    if (blank.ok) expect(blank.value.notes).toBeUndefined();
  });

  it("rejects a payload that is not an object at all", () => {
    expect(parseSessionInput(null).ok).toBe(false);
    expect(parseSessionInput("win").ok).toBe(false);
  });

  it("names the offending field so the route can say why it refused", () => {
    const parsed = parseSessionInput({ result: "victory", turns: 8 });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/result/i);
  });
});

describe("summarizeSessions", () => {
  it("reports zeroes for a deck that has never been played", () => {
    const summary = summarizeSessions([]);
    expect(summary.total).toBe(0);
    expect(summary.winRate).toBe(0);
    expect(summary.averageWinTurns).toBe(0);
  });

  it("counts every recorded run", () => {
    const summary = summarizeSessions([session(), session({ id: "s2", result: "loss" })]);
    expect(summary.total).toBe(2);
    expect(summary.winRate).toBe(50);
  });

  it("carries the mulligan distribution through", () => {
    const summary = summarizeSessions([
      session({ mulliganCount: 0 }),
      session({ id: "s2", mulliganCount: 1, result: "loss" }),
    ]);
    expect(summary.mulligans[0]?.count).toBe(1);
    expect(summary.mulligans[1]?.winRate).toBe(0);
  });

  it("averages turns over wins only, not over every run", () => {
    // A 20-turn loss must not drag down "how fast does this deck win".
    const summary = summarizeSessions([
      session({ turns: 6 }),
      session({ id: "s2", turns: 20, result: "loss" }),
    ]);
    expect(summary.averageWinTurns).toBe(6);
  });
});

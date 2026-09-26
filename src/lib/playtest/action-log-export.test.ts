import { describe, expect, it } from "vitest";
import { exportActionLogJson, exportActionLogText, summarizeActionLog } from "./action-log-export";

const entries = [
  { id: 1, turn: 1, phase: "Main1" as const, description: "Played Forest" },
  { id: 2, turn: 1, phase: "Main1" as const, description: "Produced one green mana" },
  { id: 3, turn: 2, phase: "Draw" as const, description: "Drew a card" },
];

describe("action log exports", () => {
  it("summarizes entries chronologically by turn", () => {
    expect(summarizeActionLog(entries)).toEqual([
      { turn: 1, entries: entries.slice(0, 2), draws: 0, manaProduced: 0, cardsSeen: 0 },
      { turn: 2, entries: entries.slice(2), draws: 0, manaProduced: 0, cardsSeen: 0 },
    ]);
  });

  it("counts only structured draw, mana and library events", () => {
    expect(summarizeActionLog([
      { id: 1, turn: 2, phase: "Draw", description: "Drew a card", kind: "draw" },
      { id: 2, turn: 2, phase: "Main1", description: "Produced two blue mana", kind: "mana", amount: 2 },
      { id: 3, turn: 2, phase: "Main1", description: "Revealed a card", kind: "cardSeen" },
      { id: 4, turn: 2, phase: "Main1", description: "Drew a card manually" },
    ])).toEqual([{
      turn: 2, entries: expect.any(Array), draws: 1, manaProduced: 2, cardsSeen: 2,
    }]);
  });

  it("exports a readable turn-by-turn log", () => {
    expect(exportActionLogText("Forest Test", entries)).toBe(
      "Forest Test — playtest log\n\nTurn 1\n- Main1: Played Forest\n- Main1: Produced one green mana\n\nTurn 2\n- Draw: Drew a card"
    );
  });

  it("exports a versioned structured payload", () => {
    expect(JSON.parse(exportActionLogJson("Forest Test", entries))).toEqual({
      version: 2,
      deckName: "Forest Test",
      turns: summarizeActionLog(entries),
    });
  });
});

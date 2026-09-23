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
      { turn: 1, entries: entries.slice(0, 2) },
      { turn: 2, entries: entries.slice(2) },
    ]);
  });

  it("exports a readable turn-by-turn log", () => {
    expect(exportActionLogText("Forest Test", entries)).toBe(
      "Forest Test — playtest log\n\nTurn 1\n- Main1: Played Forest\n- Main1: Produced one green mana\n\nTurn 2\n- Draw: Drew a card"
    );
  });

  it("exports a versioned structured payload", () => {
    expect(JSON.parse(exportActionLogJson("Forest Test", entries))).toEqual({
      version: 1,
      deckName: "Forest Test",
      turns: summarizeActionLog(entries),
    });
  });
});

import { describe, expect, it } from "vitest";
import { logLineIn, plainEnglishLogFormat } from "@/test/playtest-log-text";
import { exportActionLogJson, exportActionLogText, summarizeActionLog } from "./action-log-export";
import { noteMessage, type PlaytestActionLogEntry } from "./engine";

const entries: readonly PlaytestActionLogEntry[] = [
  { id: 1, turn: 1, phase: "Main1", message: noteMessage("Played Forest") },
  { id: 2, turn: 1, phase: "Main1", message: noteMessage("Produced one green mana") },
  { id: 3, turn: 2, phase: "Draw", message: noteMessage("Drew a card") },
];

/** A line the engine recorded, as data, next to a note the player wrote. */
const recorded: readonly PlaytestActionLogEntry[] = [
  { id: 1, turn: 2, phase: "Draw", message: { key: "drewCard" }, kind: "draw" },
  { id: 2, turn: 2, phase: "Main1", message: noteMessage("Opponent at 12") },
];

describe("action log exports", () => {
  it("summarizes entries chronologically by turn", () => {
    expect(summarizeActionLog(entries)).toEqual([
      { turn: 1, entries: entries.slice(0, 2), draws: 0, manaProduced: 0, cardsSeen: 0, lifeDelta: 0, countersChanged: 0 },
      { turn: 2, entries: entries.slice(2), draws: 0, manaProduced: 0, cardsSeen: 0, lifeDelta: 0, countersChanged: 0 },
    ]);
  });

  it("counts structured turn evidence without inferring it from free text", () => {
    expect(summarizeActionLog([
      { id: 1, turn: 2, phase: "Draw", message: noteMessage("Drew a card"), kind: "draw" },
      { id: 2, turn: 2, phase: "Main1", message: noteMessage("Produced two blue mana"), kind: "mana", amount: 2 },
      { id: 3, turn: 2, phase: "Main1", message: noteMessage("Revealed a card"), kind: "cardSeen" },
      { id: 4, turn: 2, phase: "Combat", message: noteMessage("Lost three life"), kind: "life", lifeDelta: -3 },
      { id: 5, turn: 2, phase: "Main2", message: noteMessage("Added two counters"), kind: "counter", counterDelta: 2 },
      { id: 6, turn: 2, phase: "Main1", message: noteMessage("Drew a card manually") },
    ])).toEqual([{
      turn: 2,
      entries: expect.any(Array),
      draws: 1,
      manaProduced: 2,
      cardsSeen: 2,
      lifeDelta: -3,
      countersChanged: 2,
    }]);
  });

  it("exports a readable turn-by-turn log", () => {
    expect(exportActionLogText("Forest Test", entries, plainEnglishLogFormat())).toBe(
      "Forest Test — playtest log\n\nTurn 1\n- Main1: Played Forest\n- Main1: Produced one green mana\n\nTurn 2\n- Draw: Drew a card"
    );
  });

  it("exports a versioned structured payload", () => {
    expect(JSON.parse(exportActionLogJson("Forest Test", entries, logLineIn("en")))).toEqual({
      version: 3,
      deckName: "Forest Test",
      turns: [
        {
          turn: 1,
          entries: [
            { id: 1, turn: 1, phase: "Main1", description: "Played Forest" },
            { id: 2, turn: 1, phase: "Main1", description: "Produced one green mana" },
          ],
          draws: 0,
          manaProduced: 0,
          cardsSeen: 0,
          lifeDelta: 0,
          countersChanged: 0,
        },
        {
          turn: 2,
          entries: [{ id: 3, turn: 2, phase: "Draw", description: "Drew a card" }],
          draws: 0,
          manaProduced: 0,
          cardsSeen: 0,
          lifeDelta: 0,
          countersChanged: 0,
        },
      ],
    });
  });

  // #1853: the engine records data; both exports write the line the player reads.
  it("writes an engine line in the export's language and a note as typed", () => {
    const french = { ...plainEnglishLogFormat(), line: logLineIn("fr") };

    expect(exportActionLogText("Forest Test", recorded, french)).toBe(
      "Forest Test — playtest log\n\nTurn 2\nEvidence: 1 draws, 0 mana, 1 additional cards seen\n- Draw: Vous avez pioché une carte\n- Main1: Opponent at 12"
    );
  });

  it("keeps the version-3 shape, a description per line, in the player's language", () => {
    expect(JSON.parse(exportActionLogJson("Forest Test", recorded, logLineIn("fr")))).toEqual({
      version: 3,
      deckName: "Forest Test",
      turns: [
        {
          turn: 2,
          entries: [
            { id: 1, turn: 2, phase: "Draw", description: "Vous avez pioché une carte", kind: "draw" },
            { id: 2, turn: 2, phase: "Main1", description: "Opponent at 12" },
          ],
          draws: 1,
          manaProduced: 0,
          cardsSeen: 1,
          lifeDelta: 0,
          countersChanged: 0,
        },
      ],
    });
  });
});

import { describe, expect, it } from "vitest";

import { cardsDrawnBy, usualTable } from "./cards-drawn";

describe("cardsDrawnBy", () => {
  it("draws the seven cards of the opening hand at any table (CR 103.5)", () => {
    expect(cardsDrawnBy({ kind: "opening-hand" }, "multiplayer")).toBe(7);
    expect(cardsDrawnBy({ kind: "opening-hand" }, "two-player")).toBe(7);
  });

  it("adds one draw per turn, turn 1 included, at a multiplayer table (CR 103.8c)", () => {
    expect(cardsDrawnBy({ kind: "turn", turn: 1 }, "multiplayer")).toBe(8);
    expect(cardsDrawnBy({ kind: "turn", turn: 3 }, "multiplayer")).toBe(10);
  });

  it("skips the turn-1 draw of the starting player at a two-player table (CR 103.8a)", () => {
    expect(cardsDrawnBy({ kind: "turn", turn: 1 }, "two-player")).toBe(7);
    expect(cardsDrawnBy({ kind: "turn", turn: 3 }, "two-player")).toBe(9);
  });
});

describe("usualTable", () => {
  it("takes the Commander formats as multiplayer and the constructed formats as two-player", () => {
    expect(usualTable("commander")).toBe("multiplayer");
    expect(usualTable("oathbreaker")).toBe("multiplayer");
    expect(usualTable("modern")).toBe("two-player");
    expect(usualTable("standard")).toBe("two-player");
  });
});

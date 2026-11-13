/**
 * Solitary tests of the draw helper shared by the turn transitions.
 *
 * The transitions themselves (`applyDrawCard`, `applyNextPhase`, `applyNextTurn`) are covered
 * through the barrel in `../engine.test.ts` and replayed in `../engine-golden.test.ts`.
 */

import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { drawTop } from "./turn";

describe("drawTop", () => {
  it("moves the top card of the library to the end of the hand", () => {
    const [held, top, second] = [
      aDeckCard({ id: "held" }),
      aDeckCard({ id: "top" }),
      aDeckCard({ id: "second" }),
    ];

    const drawn = drawTop({ hand: [held], library: [top, second] });

    expect(drawn).toEqual({ hand: [held, top], library: [second] });
  });

  it("does not change the zones it was given", () => {
    const zones = { hand: [], library: [aDeckCard({ id: "top" })] };

    drawTop(zones);

    expect(zones.hand).toEqual([]);
    expect(zones.library.map((card) => card.id)).toEqual(["top"]);
  });

  it("returns the zones as they are when the library is empty", () => {
    const zones = { hand: [aDeckCard({ id: "held" })], library: [] };

    expect(drawTop(zones)).toBe(zones);
  });
});

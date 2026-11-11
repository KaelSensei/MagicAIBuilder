import { describe, expect, it } from "vitest";
import { COLOR_SYMBOLS, FIVE_COLORS } from "./colors";

describe("colour symbols", () => {
  it("lists the five colours in WUBRG order (CR 105.1)", () => {
    expect(FIVE_COLORS).toEqual(["W", "U", "B", "R", "G"]);
  });

  it("adds C, the colourless symbol, after the five colours (CR 107.4c)", () => {
    expect(COLOR_SYMBOLS).toEqual(["W", "U", "B", "R", "G", "C"]);
  });
});

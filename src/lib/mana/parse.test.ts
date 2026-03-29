import { describe, it, expect } from "vitest";
import { parseManaCost, extractColorPips, parseSingleSymbol } from "./parse";

// ─── parseSingleSymbol ────────────────────────────────────────────────────────
describe("parseSingleSymbol", () => {
  it("parses a simple color pip", () => {
    expect(parseSingleSymbol("W")).toEqual({ kind: "color", color: "W" });
  });

  it("parses generic numeric", () => {
    expect(parseSingleSymbol("2")).toEqual({ kind: "generic", value: "2" });
  });

  it("parses X variable", () => {
    expect(parseSingleSymbol("X")).toEqual({ kind: "generic", value: "X" });
  });

  it("parses bicolor hybrid {W/U}", () => {
    expect(parseSingleSymbol("W/U")).toEqual({ kind: "hybrid", left: "W", right: "U" });
  });

  it("parses generic/color hybrid {2/W}", () => {
    expect(parseSingleSymbol("2/W")).toEqual({ kind: "hybrid", left: "2", right: "W" });
  });

  it("parses phyrexian {W/P}", () => {
    expect(parseSingleSymbol("W/P")).toEqual({ kind: "hybrid", left: "W", right: "P" });
  });
});

// ─── parseManaCost ────────────────────────────────────────────────────────────
describe("parseManaCost", () => {
  it("returns empty array for empty string", () => {
    expect(parseManaCost("")).toEqual([]);
  });

  it("parses {2}{W}", () => {
    const result = parseManaCost("{2}{W}");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ kind: "generic", value: "2" });
    expect(result[1]).toEqual({ kind: "color", color: "W" });
  });

  it("parses {W/U}{W/U} (Dimir Infiltrator)", () => {
    const result = parseManaCost("{U/B}{U/B}");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ kind: "hybrid", left: "U", right: "B" });
    expect(result[1]).toEqual({ kind: "hybrid", left: "U", right: "B" });
  });

  it("parses Reaper King {W/U}{U/B}{B/R}{R/G}{G/W}", () => {
    const result = parseManaCost("{W/U}{U/B}{B/R}{R/G}{G/W}");
    expect(result).toHaveLength(5);
    result.forEach((t) => expect(t.kind).toBe("hybrid"));
  });

  it("parses Kitchen Finks {2/G}{2/G}", () => {
    const result = parseManaCost("{2/G}{2/G}");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ kind: "hybrid", left: "2", right: "G" });
  });

  it("ignores unclosed brace tail (same as previous regex behaviour)", () => {
    expect(parseManaCost("{2}{W")).toEqual([
      { kind: "generic", value: "2" },
    ]);
  });
});

// ─── extractColorPips ─────────────────────────────────────────────────────────
describe("extractColorPips", () => {
  it("returns empty for no mana cost", () => {
    expect(extractColorPips("")).toEqual({});
  });

  it("counts simple pips", () => {
    expect(extractColorPips("{W}{W}{B}")).toEqual({ W: 2, B: 1 });
  });

  it("counts generic + color pips", () => {
    expect(extractColorPips("{2}{U}")).toEqual({ U: 1 });
  });

  it("splits bicolor hybrid 50/50", () => {
    const pips = extractColorPips("{W/U}");
    expect(pips.W).toBeCloseTo(0.5);
    expect(pips.U).toBeCloseTo(0.5);
  });

  it("counts generic/color hybrid as 1 pip for color side", () => {
    expect(extractColorPips("{2/W}")).toEqual({ W: 1 });
  });

  it("counts {2/G}{2/G} as 2G", () => {
    expect(extractColorPips("{2/G}{2/G}")).toEqual({ G: 2 });
  });

  it("counts {W/B}{W/B}{W/B} (Unmake) as 1.5W + 1.5B", () => {
    const pips = extractColorPips("{W/B}{W/B}{W/B}");
    expect(pips.W).toBeCloseTo(1.5);
    expect(pips.B).toBeCloseTo(1.5);
  });

  it("counts Reaper King as 0.5 each of WUBRG", () => {
    const pips = extractColorPips("{W/U}{U/B}{B/R}{R/G}{G/W}");
    // W appears in {W/U} and {G/W} → 1.0
    expect(pips.W).toBeCloseTo(1.0);
    expect(pips.U).toBeCloseTo(1.0);
    expect(pips.B).toBeCloseTo(1.0);
    expect(pips.R).toBeCloseTo(1.0);
    expect(pips.G).toBeCloseTo(1.0);
  });

  it("counts Dimir Infiltrator {U/B}{U/B} as 1U + 1B", () => {
    const pips = extractColorPips("{U/B}{U/B}");
    expect(pips.U).toBeCloseTo(1.0);
    expect(pips.B).toBeCloseTo(1.0);
  });

  it("ignores colorless {C}", () => {
    expect(extractColorPips("{C}{C}")).toEqual({});
  });

  it("counts phyrexian {W/P} as 1W", () => {
    expect(extractColorPips("{W/P}")).toEqual({ W: 1 });
  });
});

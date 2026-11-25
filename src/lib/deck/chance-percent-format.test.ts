/**
 * Solitary tests of the shared chance percent format: one decimal, rounded,
 * with its trailing zero kept, in the reader's locale.
 */
import { describe, expect, it } from "vitest";
import {
  CHANCE_PERCENT_FORMAT,
  WHOLE_PERCENT_FORMAT,
} from "./chance-percent-format";

function inEnglish(chance: number): string {
  return new Intl.NumberFormat("en", CHANCE_PERCENT_FORMAT).format(chance);
}

describe("CHANCE_PERCENT_FORMAT", () => {
  it("writes a chance as a percentage rounded to one decimal", () => {
    expect(inEnglish(0.4567)).toBe("45.7%");
    expect(inEnglish(0.29744)).toBe("29.7%");
  });

  it("keeps the trailing zero, so a round chance still shows one decimal", () => {
    expect(inEnglish(0.78)).toBe("78.0%");
    expect(inEnglish(1)).toBe("100.0%");
    expect(inEnglish(0)).toBe("0.0%");
  });

  it("rounds a chance below one in two thousand down to 0.0%", () => {
    expect(inEnglish(0.0004)).toBe("0.0%");
  });

  it("follows the reader's locale, with a French decimal comma and spaced percent sign", () => {
    const french = new Intl.NumberFormat("fr", CHANCE_PERCENT_FORMAT);

    // Intl writes the French percent sign after a narrow no-break space.
    expect(french.format(0.4567)).toMatch(/^45,7\s%$/u);
  });
});

describe("WHOLE_PERCENT_FORMAT", () => {
  it("writes a share as a whole percentage, rounded", () => {
    const english = new Intl.NumberFormat("en", WHOLE_PERCENT_FORMAT);

    expect(english.format(0.4)).toBe("40%");
    expect(english.format(7 / 36)).toBe("19%");
    expect(english.format(0.625)).toBe("63%");
  });

  it("follows the reader's locale, with a spaced French percent sign", () => {
    const french = new Intl.NumberFormat("fr", WHOLE_PERCENT_FORMAT);

    // Intl writes the French percent sign after a narrow no-break space.
    expect(french.format(0.45)).toMatch(/^45\s%$/u);
  });
});

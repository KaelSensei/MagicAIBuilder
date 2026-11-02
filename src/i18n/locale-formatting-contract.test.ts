import { describe, expect, it } from "vitest";
import {
  formatCardCount,
  formatLocalizedDate,
  formatLocalizedNumber,
  formatManaSymbols,
} from "./number-format";
import enBuilder from "@/messages/en/builder.json";
import frBuilder from "@/messages/fr/builder.json";

describe("locale formatting contract", () => {
  it("formats a calendar date in English", () => {
    expect(formatLocalizedDate("en", new Date("2026-10-31T00:00:00Z"))).toBe(
      "Oct 31, 2026"
    );
  });

  it("formats the same calendar date in French without a VPS timezone dependency", () => {
    expect(formatLocalizedDate("fr", new Date("2026-10-31T00:00:00Z"))).toBe(
      "31 oct. 2026"
    );
  });

  it.each([
    ["en", "1,234.5"],
    ["fr", "1\u202f234,5"],
  ] as const)("formats decimal numbers in %s", (locale, expected) => {
    expect(formatLocalizedNumber(locale, 1234.5)).toBe(expected);
  });

  it.each([
    ["en", 1, "1 card"],
    ["en", 2, "2 cards"],
    ["fr", 1, "1 carte"],
    ["fr", 2, "2 cartes"],
  ] as const)("uses the right card plural in %s", (locale, count, expected) => {
    expect(formatCardCount(locale, count)).toBe(expected);
  });

  it("keeps official mana notation identical in English and French", () => {
    const manaCost = "{W}{U}{B}{R}{G}";

    expect(formatManaSymbols(manaCost)).toBe(manaCost);
  });

  it("keeps mana symbols accessible with a localized label in English and French", () => {
    expect(
      enBuilder.manaSymbolAlt.replace("{color}", enBuilder.manaColors.G)
    ).toBe("Green mana symbol");
    expect(
      frBuilder.manaSymbolAlt.replace("{color}", frBuilder.manaColors.G)
    ).toBe("Symbole de mana Vert");
  });

  it("rejects malformed mana notation instead of displaying a misleading symbol", () => {
    expect(formatManaSymbols("{W}U")).toBe("");
  });
});

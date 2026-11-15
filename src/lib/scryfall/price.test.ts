import { describe, expect, it } from "vitest";
import { priceUsdOf, toUsdPrice } from "./price";
import { aScryfallCard } from "@/test/builders/scryfall";

describe("toUsdPrice", () => {
  it.each([
    ["0.25", 0.25],
    ["12.00", 12],
    ["0", 0],
    ["7", 7],
    ["123456789012.34", 123456789012.34],
  ])("reads Scryfall's decimal string %j as the number %d", (raw, expected) => {
    expect(toUsdPrice(raw)).toBe(expected);
  });

  it("reads a valid price exactly as Number.parseFloat did, so no stored price moves", () => {
    for (const raw of ["0.25", "12.00", "0", "0.01", "1999.99"]) {
      expect(toUsdPrice(raw)).toBe(Number.parseFloat(raw));
    }
  });

  it.each([
    ["null, Scryfall's 'no price'", null],
    ["an absent field", undefined],
    ["an empty string", ""],
    ["a placeholder word", "N/A"],
    ["letters", "abc"],
    ["a negative amount", "-1.00"],
    ["a comma decimal separator", "1,25"],
    ["an exponent", "1e3"],
    ["surrounding whitespace", " 0.25 "],
  ])("has no price, never NaN, for %s", (_label, raw) => {
    expect(toUsdPrice(raw)).toBeNull();
  });
});

describe("priceUsdOf", () => {
  it("reads the non-foil USD price of a card", () => {
    expect(priceUsdOf(aScryfallCard({ prices: { usd: "1.25" } }))).toBe(1.25);
  });

  it("has no price for a card Scryfall sent without prices", () => {
    expect(priceUsdOf(aScryfallCard())).toBeNull();
    expect(priceUsdOf(aScryfallCard({ prices: { usd: null } }))).toBeNull();
  });

  it("does not fall back to the foil price when the non-foil one is missing", () => {
    const foilOnly = aScryfallCard({ prices: { usd: null, usd_foil: "3.00" } });

    expect(priceUsdOf(foilOnly)).toBeNull();
  });

  it("has no price when Scryfall's price string is not a number", () => {
    expect(priceUsdOf(aScryfallCard({ prices: { usd: "N/A" } }))).toBeNull();
  });
});

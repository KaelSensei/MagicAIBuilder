import { describe, expect, it } from "vitest";
import { PRICE_BOOK, pricesInForce, type CostPrice } from "./price-book";

const speedInsightsOn = (book: readonly CostPrice[], day: string) =>
  pricesInForce(book, day).find((p) => p.resource === "speed-insights-events")
    ?.includedQuantity;

describe("pricesInForce", () => {
  it("prices a month with the entry read last before it, so an older month keeps its old price", () => {
    const raised: readonly CostPrice[] = PRICE_BOOK.filter(
      (p) => p.resource === "speed-insights-events"
    ).map((p) => ({ ...p, includedQuantity: 20_000, readOn: "2027-03-01" }));
    const book = [...PRICE_BOOK, ...raised];

    expect([
      speedInsightsOn(book, "2026-11-30"),
      speedInsightsOn(book, "2027-03-31"),
    ]).toEqual([10_000, 20_000]);
  });

  it("keeps one entry per provider, plan, resource and region", () => {
    expect(pricesInForce(PRICE_BOOK, "2026-11-30")).toHaveLength(
      PRICE_BOOK.length
    );
  });

  it("has no price for a day before anything was read", () => {
    expect(pricesInForce(PRICE_BOOK, "2026-11-09")).toEqual([]);
  });
});

describe("PRICE_BOOK", () => {
  it("cites a provider page and a read date for every entry (I-66 2.1)", () => {
    expect(
      PRICE_BOOK.filter(
        (p) =>
          !p.sourceUrl.startsWith("https://") ||
          !/^\d{4}-\d{2}-\d{2}$/.test(p.readOn)
      )
    ).toEqual([]);
  });
});

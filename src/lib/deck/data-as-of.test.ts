/**
 * I-86: the data-as-of line says what the rules date and the prices were
 * true for, and it does not invent a date the product did not store.
 */
import { describe, expect, it } from "vitest";
import { describeDataAsOf } from "@/lib/deck/data-as-of";

describe("describeDataAsOf", () => {
  it("names the rules date, keeps prices with the card, and says card data is not from the daily file", () => {
    expect(
      describeDataAsOf({
        rulesEffectiveOn: "2026-08-07",
        priceStoredOn: null,
        cardDataLoadedOn: null,
      })
    ).toEqual({
      rules: { kind: "dated", isoDate: "2026-08-07" },
      prices: { kind: "stored-with-card" },
      cardData: { kind: "not-from-daily-file" },
    });
  });
});

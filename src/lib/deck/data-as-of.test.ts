/**
 * I-86: the data-as-of line says what the rules date and the prices were
 * true for, and it does not invent a date the product did not store.
 */
import { describe, expect, it } from "vitest";
import { currentDataAsOfFacts, describeDataAsOf } from "@/lib/deck/data-as-of";
import { BUNDLED_RULES_EFFECTIVE_ON } from "@/modules/rules-reference";

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

  it("omits a missing or impossible rules date instead of guessing one", () => {
    expect(
      describeDataAsOf({ rulesEffectiveOn: null, priceStoredOn: null, cardDataLoadedOn: null }).rules
    ).toEqual({ kind: "absent" });
    expect(
      describeDataAsOf({ rulesEffectiveOn: "2026-02-31", priceStoredOn: null, cardDataLoadedOn: null }).rules
    ).toEqual({ kind: "absent" });
  });

  it("reads a stored price date and a card-data load date when they exist", () => {
    expect(
      describeDataAsOf({
        rulesEffectiveOn: "2026-08-07",
        priceStoredOn: "2026-11-01",
        cardDataLoadedOn: "2026-11-02",
      })
    ).toEqual({
      rules: { kind: "dated", isoDate: "2026-08-07" },
      prices: { kind: "dated", isoDate: "2026-11-01" },
      cardData: { kind: "loaded", isoDate: "2026-11-02" },
    });
  });

  it("uses the bundled rules edition and no stored price or load date today", () => {
    expect(currentDataAsOfFacts()).toEqual({
      rulesEffectiveOn: BUNDLED_RULES_EFFECTIVE_ON,
      priceStoredOn: null,
      cardDataLoadedOn: null,
    });
  });
});

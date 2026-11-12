import { describe, expect, it } from "vitest";
import { PRICE_TABLE_VERSION, highestRates, priceModelUsage } from "./prices";

const NO_TOKENS = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

describe("priceModelUsage", () => {
  // Haiku 4.5: $1 / MTok in, $5 / MTok out, so one token in costs one
  // micro-dollar and one token out five.
  it("prices Haiku 4.5 input and output tokens from the dated table", () => {
    expect(
      priceModelUsage("claude-haiku-4-5", {
        ...NO_TOKENS,
        inputTokens: 1_200,
        outputTokens: 1_500,
      })
    ).toEqual({ costMicroUsd: 8_700, priceTableVersion: PRICE_TABLE_VERSION });
  });

  // Haiku 4.5: $1.25 / MTok for a 5-minute cache write, $0.10 for a hit.
  it("prices cache writes and cache hits at their own rates", () => {
    expect(
      priceModelUsage("claude-haiku-4-5", {
        ...NO_TOKENS,
        cacheWriteTokens: 1_000,
        cacheReadTokens: 1_000,
      }).costMicroUsd
    ).toBe(1_350);
  });

  it("rounds a fraction of a micro-dollar up, so the ledger never under-counts", () => {
    expect(
      priceModelUsage("claude-haiku-5-5", { ...NO_TOKENS, inputTokens: 3 })
        .costMicroUsd
    ).toBe(1);
  });

  // Haiku 5.5 is priced by prompt length: $0.10 / $0.50 up to 100,000 prompt
  // tokens, $0.50 / $2.50 above, cache tokens included in the length.
  it("switches Haiku 5.5 to its long-prompt rates above 100,000 prompt tokens", () => {
    const short = priceModelUsage("claude-haiku-5-5", {
      ...NO_TOKENS,
      inputTokens: 100_000,
      outputTokens: 1_000,
    });
    const long = priceModelUsage("claude-haiku-5-5", {
      ...NO_TOKENS,
      inputTokens: 90_000,
      cacheReadTokens: 10_001,
      outputTokens: 1_000,
    });

    expect(short.costMicroUsd).toBe(10_500);
    expect(long.costMicroUsd).toBe(45_000 + 501 + 2_500);
  });

  it("charges a model missing from the table at the table's highest rates and says so", () => {
    expect(
      priceModelUsage("gpt-4o-mini", {
        ...NO_TOKENS,
        inputTokens: 1_000,
        outputTokens: 1_000,
      })
    ).toEqual({
      costMicroUsd: 24_000,
      priceTableVersion: `${PRICE_TABLE_VERSION}:unpriced`,
    });
  });

  it("costs nothing when no token was billed", () => {
    expect(priceModelUsage("claude-haiku-4-5", NO_TOKENS).costMicroUsd).toBe(0);
  });
});

describe("highestRates", () => {
  it("takes the highest rate of each kind of token, whichever set it comes from", () => {
    expect(
      highestRates([
        { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
        { input: 4, cacheWrite: 5, cacheRead: 0.05, output: 2.5 },
      ])
    ).toEqual({ input: 4, cacheWrite: 5, cacheRead: 0.1, output: 5 });
  });

  it("answers zero rates for no rate set at all instead of throwing", () => {
    expect(highestRates([])).toEqual({
      input: 0,
      cacheWrite: 0,
      cacheRead: 0,
      output: 0,
    });
  });
});

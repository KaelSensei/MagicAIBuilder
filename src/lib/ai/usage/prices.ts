/**
 * The dated model price table: the one place AI cost is computed from.
 *
 * Prices are copied from Anthropic's pricing page
 * (https://platform.claude.com/docs/en/about-claude/pricing), read on
 * 2026-11-09, the page I-30 and I-02 cite. They are USD per million tokens,
 * which is also micro-dollars per token. A change of price is a new table
 * version, so a ledger row always says which prices produced its cost.
 */

/** Version written on every ledger row priced from this table. */
export const PRICE_TABLE_VERSION = "2026-11-09";

/** Tokens one call billed, as the provider's `usage` reported them. */
export interface TokenUsage {
  /** Input tokens read at the base rate (cache reads and writes excluded). */
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
}

/** The cost of one call and the table version that priced it. */
export interface PricedUsage {
  readonly costMicroUsd: number;
  readonly priceTableVersion: string;
}

/** USD per million tokens for each kind of token. */
export interface TokenRates {
  readonly input: number;
  /** A write to the 5-minute prompt cache, the API's default lifetime. */
  readonly cacheWrite: number;
  /** A cache hit or refresh. */
  readonly cacheRead: number;
  readonly output: number;
}

/** A model's rates, with a dearer tier for long prompts where one exists. */
interface ModelPrice {
  readonly rates: TokenRates;
  readonly longPrompt?: {
    /** Prompts above this many tokens, cache tokens included, pay `rates`. */
    readonly aboveTokens: number;
    readonly rates: TokenRates;
  };
}

const MODEL_PRICES: ReadonlyMap<string, ModelPrice> = new Map([
  [
    "claude-haiku-4-5",
    { rates: { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 } },
  ],
  [
    "claude-haiku-5-5",
    {
      rates: { input: 0.1, cacheWrite: 0.125, cacheRead: 0.01, output: 0.5 },
      longPrompt: {
        aboveTokens: 100_000,
        rates: { input: 0.5, cacheWrite: 0.625, cacheRead: 0.05, output: 2.5 },
      },
    },
  ],
  [
    "claude-sonnet-5-5",
    { rates: { input: 2, cacheWrite: 2.5, cacheRead: 0.1, output: 10 } },
  ],
  [
    "claude-opus-5-5",
    { rates: { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 } },
  ],
]);

/**
 * The highest rate of each kind of token across several rate sets.
 *
 * @param rateSets - the rate sets to compare
 * @returns for each kind of token, the highest rate any set charges
 */
export function highestRates(rateSets: readonly TokenRates[]): TokenRates {
  return rateSets.reduce((highest, rates) => ({
    input: Math.max(highest.input, rates.input),
    cacheWrite: Math.max(highest.cacheWrite, rates.cacheWrite),
    cacheRead: Math.max(highest.cacheRead, rates.cacheRead),
    output: Math.max(highest.output, rates.output),
  }));
}

/**
 * The highest rate of each kind in the table.
 *
 * A model the table does not list (today the OpenAI fallback) is charged at
 * these rates, so the spend ceiling over-counts rather than under-counts until
 * its price is added.
 */
const UNPRICED_RATES: TokenRates = highestRates(
  [...MODEL_PRICES.values()].flatMap((price) =>
    price.longPrompt ? [price.rates, price.longPrompt.rates] : [price.rates]
  )
);

/**
 * Picks the rates that apply to one call of a listed model.
 *
 * @param price - the model's table entry
 * @param usage - the call's tokens
 * @returns the long-prompt rates when the prompt is over the threshold
 */
function ratesFor(price: ModelPrice, usage: TokenUsage): TokenRates {
  const promptTokens =
    usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
  return price.longPrompt && promptTokens > price.longPrompt.aboveTokens
    ? price.longPrompt.rates
    : price.rates;
}

/**
 * Converts a USD-per-million rate to an integer number of thousandths of a
 * micro-dollar per token, so the sum below is exact integer arithmetic.
 *
 * @param usdPerMillion - a rate with at most three decimals
 * @returns the rate in nano-dollars per token
 */
function nanoUsdPerToken(usdPerMillion: number): number {
  return Math.round(usdPerMillion * 1_000);
}

/**
 * Prices one model call from the tokens its provider reported.
 *
 * @param model - the model id sent to the provider
 * @param usage - the call's billed tokens
 * @returns the cost in whole micro-dollars, rounded up, and the table version
 *   (suffixed `:unpriced` when the model is not in the table)
 */
export function priceModelUsage(model: string, usage: TokenUsage): PricedUsage {
  const price = MODEL_PRICES.get(model);
  const rates = price ? ratesFor(price, usage) : UNPRICED_RATES;
  const costNanoUsd =
    usage.inputTokens * nanoUsdPerToken(rates.input) +
    usage.cacheWriteTokens * nanoUsdPerToken(rates.cacheWrite) +
    usage.cacheReadTokens * nanoUsdPerToken(rates.cacheRead) +
    usage.outputTokens * nanoUsdPerToken(rates.output);
  return {
    costMicroUsd: Math.ceil(costNanoUsd / 1_000),
    priceTableVersion: price
      ? PRICE_TABLE_VERSION
      : `${PRICE_TABLE_VERSION}:unpriced`,
  };
}

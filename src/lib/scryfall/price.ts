/**
 * Reading a Scryfall price as a number: the one place that turns the decimal
 * string Scryfall sends into a `number | null`.
 *
 * Card catalog, anti-corruption side. Scryfall sends every price as a decimal
 * string such as "0.25", or `null` when it has none
 * (https://scryfall.com/docs/api/cards, "prices", read 2026-11-13). Every
 * consumer that stores, sums or shows a price reads it through here, so a
 * string that is not a price ("", "N/A") becomes "no price" and never reaches
 * a deck card or a total as `NaN`.
 * Not responsible for: display formatting (`i18n/number-format.ts`,
 * next-intl's `format.number`).
 *
 * @module scryfall/price
 */

/**
 * The only shape Scryfall uses for a price: digits, with an optional decimal
 * part after a dot. No sign, no exponent, no thousands separator, no
 * whitespace. Anything else is not a price Scryfall sent, so it is refused
 * rather than guessed at (`Number.parseFloat("1,25")` would read 1).
 */
const SCRYFALL_PRICE = /^\d+(?:\.\d+)?$/;

/**
 * The card fields `priceUsdOf` and `priceEurOf` read. Structural on purpose:
 * both the wire type (`ScryfallCard`) and the Zod-parsed card
 * (`ParsedScryfallCard`) fit.
 */
export interface PricedCard {
  readonly prices?: {
    readonly usd?: string | null;
    readonly eur?: string | null;
  } | null;
}

/**
 * The price a Scryfall price string denotes, as a finite, non-negative number
 * of US dollars.
 *
 * For a string Scryfall actually sends ("0.25", "12.00", "0") the result is
 * the same number `Number.parseFloat` gave. `null`, `undefined`, the empty
 * string, a word ("N/A"), a negative amount, a comma decimal or an exponent
 * all give `null`: "no price" is the one honest answer when the input is not
 * a price, and the stores and totals downstream already handle `null`.
 *
 * @param raw - the `prices.usd` field as Scryfall sent it
 */
export function toUsdPrice(raw: string | null | undefined): number | null {
  return toScryfallAmount(raw);
}

/**
 * The amount a Scryfall price string denotes, in whatever currency the field
 * it came from is in. The parsing rule `toUsdPrice` documents, shared by every
 * currency because Scryfall writes them all the same way.
 */
function toScryfallAmount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || !SCRYFALL_PRICE.test(raw)) {
    return null;
  }
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * The non-foil USD price of a card, through `toUsdPrice`.
 *
 * Reads `prices.usd` only. No caller falls back to `usd_foil` or `eur`
 * (inventoried 2026-11-13, CC-03), so a card with only a foil price has no
 * price here, as it has everywhere in the app.
 *
 * @param card - a card as Scryfall sent it, parsed or not
 */
export function priceUsdOf(card: PricedCard): number | null {
  return toUsdPrice(card.prices?.usd);
}

/**
 * The non-foil euro amount Scryfall sent for a card, as a number of euros.
 *
 * I-96: the euro amount is Scryfall's own `prices.eur` figure, shown beside
 * the dollar one. It is never derived from `prices.usd`, and the
 * dollar amount is never derived from it: a card Scryfall sent without a
 * euro amount has none here. The string is read by the same rule as
 * `toUsdPrice`, since Scryfall writes both currencies the same way.
 *
 * @param card - a card as Scryfall sent it, parsed or not
 */
export function priceEurOf(card: PricedCard): number | null {
  return toScryfallAmount(card.prices?.eur);
}

/**
 * Chance percent format: how the deck analysis writes a chance as a
 * percentage, shared so that every panel rounds the same probability to the
 * same digits.
 *
 * Deck analysis, I-97. The Draw odds panel and its opening-hand lands section
 * both show exact chances; with one set of options, the same hand count can
 * never read "29.7%" in one place and "30%" in the other.
 * Not responsible for: the chances themselves (`draw-odds.ts`,
 * `opening-hand-lands.ts`), the reader's locale (the caller's formatter), or
 * whole-number shares such as the deck stats' threat density.
 *
 * @module deck/chance-percent-format
 */

/**
 * Number format options for a chance from 0 to 1, as a percentage rounded to
 * exactly one decimal, in the caller's locale: 0.4567 reads "45.7%" in English
 * and "45,7 %" in French. The minimum of one decimal keeps the trailing zero
 * ("78.0%", "100.0%"), so the digits keep their width from one open to the
 * next. Pass it to `Intl.NumberFormat` or next-intl's `format.number`; the
 * literal type, rather than `Intl.NumberFormatOptions`, is what lets it fit
 * both, since next-intl types `useGrouping` more widely than the standard lib.
 */
export const CHANCE_PERCENT_FORMAT = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} as const satisfies Intl.NumberFormatOptions;

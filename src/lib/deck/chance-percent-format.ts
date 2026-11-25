/**
 * Chance percent format: how the deck analysis writes a chance or a share as
 * a percentage, shared so that every panel rounds the same figure to the same
 * digits and writes it the reader's way.
 *
 * Deck analysis, I-97. The Draw odds panel and its opening-hand lands section
 * both show exact chances; with one set of options, the same hand count can
 * never read "29.7%" in one place and "30%" in the other. The Stats panel's
 * whole-number shares use the second set, so they follow the reader's locale
 * too instead of a hand-written "%".
 * Not responsible for: the chances themselves (`draw-odds.ts`,
 * `opening-hand-lands.ts`), the shares themselves (`format-stats.ts`,
 * `mana-alignment.ts`, `turn-one.ts`), or the reader's locale (the caller's
 * formatter).
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

/**
 * Number format options for a share or chance from 0 to 1, as a whole
 * percentage in the caller's locale: 0.4 reads "40%" in English and "40 %" in
 * French. The Stats panel's threat density, interaction ratio, pip share and
 * turn-one odds use it; they are coarse readings, so no decimal. Pass it to
 * `Intl.NumberFormat` or next-intl's `format.number`, as for
 * `CHANCE_PERCENT_FORMAT`.
 */
export const WHOLE_PERCENT_FORMAT = {
  style: "percent",
  maximumFractionDigits: 0,
} as const satisfies Intl.NumberFormatOptions;

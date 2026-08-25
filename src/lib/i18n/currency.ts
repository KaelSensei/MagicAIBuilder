const USD_FORMAT_OPTIONS = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

/**
 * Format a Scryfall USD price using the active application locale.
 *
 * @param locale - BCP 47 locale such as `en` or `fr`
 * @param value - Price in US dollars
 * @returns A locale-aware USD currency string
 */
export function formatUsd(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, USD_FORMAT_OPTIONS).format(value);
}

const localizedNumberFormatters = {
  en: new Intl.NumberFormat("en"),
  fr: new Intl.NumberFormat("fr"),
} satisfies Record<"en" | "fr", Intl.NumberFormat>;

const usdPriceFormatters = {
  en: new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
  }),
  fr: new Intl.NumberFormat("fr", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
  }),
} satisfies Record<"en" | "fr", Intl.NumberFormat>;

const localizedDateFormatters = {
  en: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }),
  fr: new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeZone: "UTC" }),
} satisfies Record<"en" | "fr", Intl.DateTimeFormat>;

type SupportedLocale = "en" | "fr";

function servedLocale(locale: string): SupportedLocale {
  return locale === "fr" ? "fr" : "en";
}

/**
 * Formats a numeric value using one of the locales served by the application.
 *
 * @param locale Requested application locale.
 * @param value Numeric value to format.
 * @returns A locale-aware number.
 */
export function formatLocalizedNumber(locale: string, value: number): string {
  return localizedNumberFormatters[servedLocale(locale)].format(value);
}

/**
 * Formats a calendar date consistently across server and browser runtimes.
 *
 * @param locale Requested application locale.
 * @param value Date to format.
 * @returns A localized calendar date in UTC.
 */
export function formatLocalizedDate(locale: string, value: Date): string {
  return localizedDateFormatters[servedLocale(locale)].format(value);
}

/**
 * Formats a card quantity with the locale's singular or plural noun.
 *
 * @param locale Requested application locale.
 * @param count Number of cards.
 * @returns A localized card quantity label.
 */
export function formatCardCount(locale: string, count: number): string {
  const formattedCount = formatLocalizedNumber(locale, count);

  if (servedLocale(locale) === "fr") {
    return `${formattedCount} ${count === 1 ? "carte" : "cartes"}`;
  }

  return `${formattedCount} ${count === 1 ? "card" : "cards"}`;
}

/**
 * Preserves a complete official mana-cost notation for presentation.
 *
 * @param value Mana cost written as consecutive braced symbols.
 * @returns The original notation, or an empty string when it is malformed.
 */
export function formatManaSymbols(value: string): string {
  if (!value) return "";

  let position = 0;
  while (position < value.length) {
    if (value[position] !== "{") return "";

    const closingBrace = value.indexOf("}", position + 1);
    if (closingBrace === -1 || closingBrace === position + 1) return "";

    position = closingBrace + 1;
  }

  return value;
}

/**
 * Formats a Scryfall USD amount without converting its underlying value.
 *
 * @param locale Requested application locale.
 * @param value USD value to format.
 * @returns A localized USD amount.
 */
export function formatUsdPrice(locale: string, value: number): string {
  return usdPriceFormatters[servedLocale(locale)].format(value);
}

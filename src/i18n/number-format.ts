const localizedNumberFormatters = {
  en: new Intl.NumberFormat("en"),
  fr: new Intl.NumberFormat("fr"),
} satisfies Record<"en" | "fr", Intl.NumberFormat>;

const usdPriceFormatters = {
  en: new Intl.NumberFormat("en", { style: "currency", currency: "USD" }),
  fr: new Intl.NumberFormat("fr", { style: "currency", currency: "USD" }),
} satisfies Record<"en" | "fr", Intl.NumberFormat>;

function servedLocale(locale: string): "en" | "fr" {
  return locale === "fr" ? "fr" : "en";
}

/** Formats a numeric value using one of the locales served by the application. */
export function formatLocalizedNumber(locale: string, value: number): string {
  return localizedNumberFormatters[servedLocale(locale)].format(value);
}

/** Formats a Scryfall USD amount without converting its underlying value. */
export function formatUsdPrice(locale: string, value: number): string {
  return usdPriceFormatters[servedLocale(locale)].format(value);
}

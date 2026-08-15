import { defineRouting } from "next-intl/routing";

export const SUPPORTED_LOCALES = [
  "en",
  "fr",
  "de",
  "it",
  "es",
  "ja",
  "zh",
  "ko",
  "ru",
  "pt",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const routing = defineRouting({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: "en",
  // English is served at the root (/decks); the other nine locales carry a
  // prefix (/fr/decks). "always" contradicted both the documented design and
  // app/sitemap.ts, which emits unprefixed URLs — so every indexed URL was a
  // redirect to its /en equivalent.
  localePrefix: "as-needed",
});

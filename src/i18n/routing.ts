import { defineRouting } from "next-intl/routing";

/**
 * Locales actually served to users.
 *
 * Reduced from ten to two on purpose. The other eight were machine-seeded
 * English copies, and translating the interface around card names and oracle
 * text that are themselves still English (Scryfall's `lang` parameter is not
 * wired) would ship a half-translated product in eight languages rather than a
 * coherent one in two.
 */
export const SUPPORTED_LOCALES = ["en", "fr"] as const;

/**
 * Catalogs kept in the repo and held at key parity with `en`, but not routed.
 *
 * Re-activating one is a single-line change: move it into SUPPORTED_LOCALES
 * once its catalog has been translated by someone who speaks the language.
 */
export const DORMANT_LOCALES = [
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

/** Every locale with a catalog on disk, routed or not. */
export type CatalogLocale = SupportedLocale | (typeof DORMANT_LOCALES)[number];

export const routing = defineRouting({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: "en",
  // English is served at the root (/decks); French carries a prefix
  // (/fr/decks). "always" contradicted both the documented design and
  // app/sitemap.ts, which emits unprefixed URLs — so every indexed URL was a
  // redirect to its /en equivalent.
  localePrefix: "as-needed",
});

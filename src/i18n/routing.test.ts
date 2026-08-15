import { describe, it, expect } from "vitest";
import { SUPPORTED_LOCALES, DORMANT_LOCALES, routing } from "./routing";
import type { SupportedLocale } from "./routing";

describe("i18n routing config", () => {
  // Two languages served coherently beats eight served half-translated: the
  // other catalogs were machine-seeded English, and card data is not localised.
  it("serves exactly the two translated locales", () => {
    expect([...SUPPORTED_LOCALES]).toEqual(["en", "fr"]);
  });

  it("keeps the untranslated catalogs dormant rather than routed", () => {
    expect([...DORMANT_LOCALES]).toEqual([
      "de",
      "it",
      "es",
      "ja",
      "zh",
      "ko",
      "ru",
      "pt",
    ]);

    for (const dormant of DORMANT_LOCALES) {
      expect(SUPPORTED_LOCALES).not.toContain(dormant as SupportedLocale);
    }
  });

  it("uses English as default locale", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  // English is served unprefixed (/decks), every other locale is prefixed
  // (/fr/decks). app/sitemap.ts already emits unprefixed URLs, so "always"
  // made every sitemap entry a redirect.
  it("serves the default locale without a prefix", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("routing.locales matches SUPPORTED_LOCALES", () => {
    expect([...routing.locales]).toEqual([...SUPPORTED_LOCALES]);
  });

  it("SupportedLocale values are part of the supported locales list", () => {
    const en: SupportedLocale = "en";
    const fr: SupportedLocale = "fr";
    expect(SUPPORTED_LOCALES).toContain(en);
    expect(SUPPORTED_LOCALES).toContain(fr);
  });
});

import { describe, it, expect } from "vitest";
import { SUPPORTED_LOCALES, routing } from "./routing";
import type { SupportedLocale } from "./routing";

describe("i18n routing config", () => {
  it("supports exactly 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
  });

  it("includes all required locales", () => {
    const expected: readonly SupportedLocale[] = [
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
    ];
    for (const locale of expected) {
      expect(SUPPORTED_LOCALES).toContain(locale);
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
    const ja: SupportedLocale = "ja";
    expect(SUPPORTED_LOCALES).toContain(en);
    expect(SUPPORTED_LOCALES).toContain(fr);
    expect(SUPPORTED_LOCALES).toContain(ja);
  });
});

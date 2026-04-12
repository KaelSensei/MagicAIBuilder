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

  it("uses as-needed locale prefix", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("routing.locales matches SUPPORTED_LOCALES", () => {
    expect([...routing.locales]).toEqual([...SUPPORTED_LOCALES]);
  });

  it("SupportedLocale type is assignable from valid locales", () => {
    const en: SupportedLocale = "en";
    const fr: SupportedLocale = "fr";
    const ja: SupportedLocale = "ja";
    expect(en).toBe("en");
    expect(fr).toBe("fr");
    expect(ja).toBe("ja");
  });
});

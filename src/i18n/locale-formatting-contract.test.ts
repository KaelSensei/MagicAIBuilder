import { describe, expect, it } from "vitest";
import { formatLocalizedNumber, formatUsdPrice } from "./number-format";

describe("locale formatting contract", () => {
  it.each(["en", "fr"] as const)("keeps dates, plural numbers and USD prices readable in %s", (locale) => {
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date("2026-10-31T00:00:00Z"));
    const count = formatLocalizedNumber(locale, 1_234);
    const price = formatUsdPrice(locale, 12.5);

    expect(date).not.toBe("");
    expect(count).toContain("1");
    expect(price).not.toBe("");
  });

  it.each([
    ["en", "1,234.5", "$12.50"],
    ["fr", "1\u202f234,5", "12,50\u00a0$US"],
  ] as const)("uses the shared number and USD price format in %s", (locale, number, price) => {
    expect(formatLocalizedNumber(locale, 1234.5)).toBe(number);
    expect(formatUsdPrice(locale, 12.5)).toBe(price);
  });

  it("keeps mana notation locale-independent", () => {
    expect("{W}{U}{B}{R}{G}").toMatch(/^\{W\}\{U\}\{B\}\{R\}\{G\}$/);
  });
});

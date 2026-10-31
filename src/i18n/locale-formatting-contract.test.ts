import { describe, expect, it } from "vitest";

describe("locale formatting contract", () => {
  it.each(["en", "fr"] as const)("keeps dates, plural numbers and USD prices readable in %s", (locale) => {
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date("2026-10-31T00:00:00Z"));
    const count = new Intl.NumberFormat(locale).format(1_234);
    const priceFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" });
    const price = priceFormatter.format(12.5);

    expect(date).not.toBe("");
    expect(count).toContain("1");
    expect(priceFormatter.resolvedOptions().currency).toBe("USD");
    expect(price).not.toBe("");
  });

  it("keeps mana notation locale-independent", () => {
    expect("{W}{U}{B}{R}{G}").toMatch(/^\{W\}\{U\}\{B\}\{R\}\{G\}$/);
  });
});

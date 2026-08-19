import { test, expect } from "@playwright/test";

type ImportCard = {
  readonly name: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: "main" | "sideboard" | "maybeboard";
};

/**
 * Tagged @external because it calls the live Archidekt API. The target deck
 * (25314868, "Cat") is our own, so it will not vanish the way a third party's
 * might — but its contents may drift as it is edited, so the assertions are
 * structural (one commander, plausible size, valid zones) rather than a card
 * list. The parser itself is covered hermetically in
 * src/lib/import/url-import.test.ts, including zone routing from
 * includedInDeck metadata and partner detection.
 *
 * The gate excludes @external by default; run deliberately with
 * PLAYWRIGHT_GREP_INVERT="".
 */
test.describe("Archidekt import", () => {
  test("@external imports the Cat deck through the live API", async ({ request }) => {
    test.setTimeout(60_000);

    const url = "https://archidekt.com/decks/25314868/cat";

    // Retry a couple of times in case Archidekt transiently rate-limits.
    let lastText = "";
    let res: Awaited<ReturnType<typeof request.post>> | null = null;
    for (const waitMs of [0, 1500, 4000, 8000]) {
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      res = await request.post("/api/import/url", { data: { url } });
      lastText = await res.text();
      if (res.ok()) break;
    }

    expect(res?.ok(), `import failed: ${lastText}`).toBe(true);

    const json = JSON.parse(lastText) as {
      name?: string;
      source?: string;
      formatWarning?: string;
      cards?: ImportCard[];
    };

    expect(json.source).toBe("archidekt");
    expect(typeof json.name).toBe("string");
    // deckFormat 3 (Commander) must not trip the format warning.
    expect(json.formatWarning).toBeUndefined();

    const cards = json.cards ?? [];
    // A Commander deck: a real list, not a truncated or empty response.
    expect(cards.length).toBeGreaterThanOrEqual(60);

    const commanders = cards.filter((c) => c.isCommander);
    const partners = cards.filter((c) => c.isPartner);
    expect(commanders).toHaveLength(1);
    // The parser must never emit a partner without a commander before it.
    expect(partners.length).toBeLessThanOrEqual(1);

    // Every zone is one the app knows; a category the parser mishandles
    // would surface here as undefined.
    for (const card of cards) {
      expect(["main", "sideboard", "maybeboard"]).toContain(card.zone);
      expect(card.quantity).toBeGreaterThanOrEqual(1);
    }

    // The commander itself always belongs to the main zone.
    expect(commanders[0]?.zone).toBe("main");
  });
});

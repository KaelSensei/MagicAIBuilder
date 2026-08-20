import { test, expect } from "@playwright/test";

type TournamentDeck = {
  readonly name: string;
  readonly player?: string;
  readonly event?: string;
  readonly date?: string;
  readonly placement?: string;
  readonly format?: string;
  readonly url: string;
  readonly source: string;
};

/**
 * Tagged @external because it scrapes the live MTGTop8 search. Before
 * 2026-08-20 the tournament source matched nothing on the real page and the
 * panel silently showed "no tournament decks" — this contract test exists so
 * a markup change on their side fails loudly instead. Assertions are
 * structural: the parser is covered hermetically in
 * src/lib/meta/mtgtop8.test.ts.
 *
 * The gate excludes @external by default; run deliberately with
 * PLAYWRIGHT_GREP_INVERT="".
 */
test.describe("MTGTop8 tournament meta", () => {
  test("@external returns decks with event context for a popular commander", async ({ request }) => {
    test.setTimeout(60_000);

    const res = await request.get("/api/meta/atraxa-praetors-voice?source=tournament&refresh=true");
    const text = await res.text();
    expect(res.ok(), `meta route failed: ${text}`).toBe(true);

    const body = JSON.parse(text) as { decks: TournamentDeck[] };
    expect(body.decks.length).toBeGreaterThan(0);
    expect(body.decks.length).toBeLessThanOrEqual(5);

    for (const deck of body.decks) {
      expect(deck.source).toBe("mtgtop8");
      expect(deck.url).toMatch(/^https:\/\/www\.mtgtop8\.com\/event\?e=\d+&d=\d+&f=EDH$/);
      expect(deck.name.length).toBeGreaterThan(0);
      expect(deck.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(deck.placement).toMatch(/^\d+(-\d+)?$/);
      expect(deck.event?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

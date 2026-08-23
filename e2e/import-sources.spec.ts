import { test, expect } from "@playwright/test";

type ImportCard = {
  readonly name: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: "main" | "sideboard" | "maybeboard";
};

/**
 * Live contract tests for the three URL import sources that had none.
 *
 * Moxfield, Archidekt and MTGTop8 already have one each. The rule they were
 * written for — "an external source with no live contract test is a source that
 * can fail without telling anyone" — came out of #487, where the MTGTop8 parser
 * had matched nothing since #205 and the panel rendered its empty state for
 * every commander in the meantime. TappedOut, MTGDecks and EDHRec were left
 * uncovered by that same batch.
 *
 * All @external: the gate excludes them by default, because a third party
 * having a bad day is not a reason to block a push. Run them deliberately with
 * PLAYWRIGHT_GREP_INVERT="".
 */
test.describe("URL import sources", () => {
  /**
   * TappedOut is behind a Cloudflare managed challenge and **cannot be
   * imported** — a public deck's `?fmt=txt` returns "Just a moment…" with a 403
   * to the app's User-Agent, every time, exactly like MTGGoldfish (which the
   * roadmap already records as blocked for this reason).
   *
   * This asserts the accurate message rather than a successful import, because
   * the accurate message is the shipped behaviour. If TappedOut ever drops the
   * challenge this test fails — which is the signal wanted: the source becomes
   * available again and nothing else would say so.
   */
  test("@external TappedOut reports the bot challenge rather than a private deck", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const res = await request.post("/api/import/url", {
      data: { url: "https://tappedout.net/mtg-decks/25-10-17-atraxa-11/" },
    });
    const body = (await res.json()) as { error?: string };

    expect(res.status()).toBe(422);
    expect(body.error).toContain("blocks automated access");
  });

  /**
   * MTGDecks serves a plain-text list at `<deck-url>/txt`. The URL must be a
   * deck, not an archetype page: `/Commander/<commander-slug>` exists and
   * returns an HTML page for `/txt` too, which parses to zero cards and reports
   * "No cards found in this deck." That is the shape worth remembering — the
   * endpoint answers 200 either way.
   */
  test("@external MTGDecks imports a real deck through its txt export", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const url =
      "https://mtgdecks.net/Commander/alela-artful-provocateur-decklist-by-numano-hiroyuki-2926115";
    const res = await request.post("/api/import/url", { data: { url } });
    const text = await res.text();

    expect(res.ok(), `import failed: ${text}`).toBe(true);
    const json = JSON.parse(text) as { source?: string; cards?: ImportCard[] };

    expect(json.source).toBe("mtgdecks");
    const cards = json.cards ?? [];
    // A Commander list, not a truncated or empty response.
    expect(cards.length).toBeGreaterThanOrEqual(60);
    for (const card of cards) {
      expect(card.quantity).toBeGreaterThanOrEqual(1);
      expect(["main", "sideboard", "maybeboard"]).toContain(card.zone);
    }
  });

  /**
   * EDHRec's import is the average deck for a commander, read from
   * json.edhrec.com. Structural assertions only: the average list changes as
   * decks are submitted, so naming cards would fail on a data refresh rather
   * than on a broken parser.
   */
  test("@external EDHRec imports the average deck for a commander", async ({
    request,
  }) => {
    test.setTimeout(60_000);

    const url = "https://edhrec.com/commanders/atraxa-praetors-voice";
    const res = await request.post("/api/import/url", { data: { url } });
    const text = await res.text();

    expect(res.ok(), `import failed: ${text}`).toBe(true);
    const json = JSON.parse(text) as {
      name?: string;
      source?: string;
      cards?: ImportCard[];
    };

    expect(json.source).toBe("edhrec");
    const cards = json.cards ?? [];

    const commanders = cards.filter((c) => c.isCommander);
    expect(commanders).toHaveLength(1);
    expect(commanders[0]?.name).toContain("Atraxa");

    // The importer caps the non-commander cards at 99 to build a full deck.
    const rest = cards.filter((c) => !c.isCommander);
    expect(rest.length).toBeGreaterThanOrEqual(60);
    expect(rest.length).toBeLessThanOrEqual(99);
  });
});

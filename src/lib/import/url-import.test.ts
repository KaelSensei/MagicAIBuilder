import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as http from "@/lib/http";
import { detectSource, importFromUrl } from "./url-import";

describe("detectSource", () => {
  // ─── Moxfield ───────────────────────────────────────────────────────────────
  it("detects moxfield deck URL", () => {
    expect(detectSource("https://www.moxfield.com/decks/AbCdEfGhIj"))
      .toEqual({ source: "moxfield", id: "AbCdEfGhIj" });
  });

  it("detects moxfield without www", () => {
    expect(detectSource("https://moxfield.com/decks/xyz-123"))
      .toEqual({ source: "moxfield", id: "xyz-123" });
  });

  // ─── Archidekt ──────────────────────────────────────────────────────────────
  it("detects archidekt /decks/ URL", () => {
    expect(detectSource("https://archidekt.com/decks/12345678"))
      .toEqual({ source: "archidekt", id: "12345678" });
  });

  it("detects archidekt /deck/ singular", () => {
    expect(detectSource("https://www.archidekt.com/deck/42"))
      .toEqual({ source: "archidekt", id: "42" });
  });

  // ─── TappedOut ──────────────────────────────────────────────────────────────
  it("detects tappedout URL", () => {
    expect(detectSource("https://tappedout.net/mtg-decks/my-cool-deck/"))
      .toEqual({ source: "tappedout", id: "my-cool-deck" });
  });

  it("detects tappedout without trailing slash", () => {
    expect(detectSource("https://www.tappedout.net/mtg-decks/atraxa-stax"))
      .toEqual({ source: "tappedout", id: "atraxa-stax" });
  });

  // ─── MTGTop8 ────────────────────────────────────────────────────────────────
  it("detects mtgtop8 deck URL with d param", () => {
    const result = detectSource("https://www.mtgtop8.com/event?e=1234&d=5678");
    expect(result).toEqual({ source: "mtgtop8", id: "5678" });
  });

  it("detects mtgtop8 with d param first", () => {
    const result = detectSource("https://www.mtgtop8.com/event?d=9999&e=1111");
    expect(result).toEqual({ source: "mtgtop8", id: "9999" });
  });

  // ─── MTGDecks ────────────────────────────────────────────────────────────────
  it("detects mtgdecks URL", () => {
    expect(detectSource("https://mtgdecks.net/Commander/atraxa-superfriends"))
      .toEqual({ source: "mtgdecks", id: "atraxa-superfriends" });
  });

  // ─── EDHRec ──────────────────────────────────────────────────────────────────
  it("detects edhrec commander URL", () => {
    expect(detectSource("https://edhrec.com/commanders/atraxa-praetors-voice"))
      .toEqual({ source: "edhrec", id: "atraxa-praetors-voice" });
  });

  it("detects edhrec without www", () => {
    expect(detectSource("https://edhrec.com/commanders/edgar-markov"))
      .toEqual({ source: "edhrec", id: "edgar-markov" });
  });

  // ─── Invalid URLs ────────────────────────────────────────────────────────────
  it("returns null for unknown domain", () => {
    expect(detectSource("https://deckstats.net/decks/123")).toBeNull();
  });

  it("returns null for moxfield without deck id", () => {
    expect(detectSource("https://www.moxfield.com/")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectSource("")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(detectSource("not a url")).toBeNull();
  });

  it("returns null for archidekt profile URL", () => {
    expect(detectSource("https://archidekt.com/u/someuser")).toBeNull();
  });

  it("returns null for edhrec non-commander URL", () => {
    expect(detectSource("https://edhrec.com/cards/sol-ring")).toBeNull();
  });
});

// ─── importFromUrl ──────────────────────────────────────────────────────────
describe("importFromUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when URL is not recognised", async () => {
    await expect(importFromUrl("https://example.com/deck/1")).rejects.toThrow(
      "URL not recognised"
    );
  });

  it("imports Moxfield deck JSON", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Mox Test",
          format: "commander",
          commanders: {
            k: { quantity: 1, card: { name: "Kenrith" } },
          },
          mainboard: {
            s: { quantity: 1, card: { name: "Sol Ring" } },
          },
        }),
        { status: 200 }
      )
    );

    const result = await importFromUrl("https://moxfield.com/decks/abc123");
    expect(result.source).toBe("moxfield");
    expect(result.name).toBe("Mox Test");
    expect(result.cards.some((c) => c.isCommander && c.name === "Kenrith")).toBe(true);
    expect(result.formatWarning).toBeUndefined();
  });

  it("sets formatWarning for non-commander Moxfield format", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Standard pile",
          format: "Standard",
          commanders: {},
          mainboard: { a: { quantity: 1, card: { name: "Plains" } } },
        }),
        { status: 200 }
      )
    );

    const result = await importFromUrl("https://www.moxfield.com/decks/z99");
    expect(result.formatWarning).toContain("Standard");
  });

  it("imports Archidekt deck", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Arch Test",
          deckFormat: 3,
          cards: [
            {
              quantity: 1,
              categories: ["Commander"],
              card: { oracleCard: { name: "Niv-Mizzet" } },
            },
            {
              quantity: 1,
              categories: ["Maybeboard"],
              card: { oracleCard: { name: "Mountain" } },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await importFromUrl("https://archidekt.com/decks/555");
    expect(result.source).toBe("archidekt");
    expect(result.cards.find((c) => c.name === "Niv-Mizzet")?.isCommander).toBe(true);
  });

  it("Archidekt: formatWarning when deck is not Commander format", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Casual 60",
          deckFormat: 1,
          cards: [
            {
              quantity: 4,
              categories: [],
              card: { oracleCard: { name: "Forest" } },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await importFromUrl("https://archidekt.com/decks/777");
    expect(result.formatWarning).toContain("Commander");
  });

  it("TappedOut: throws when export is empty", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response("  \n\t  ", { status: 200 })
    );

    await expect(
      importFromUrl("https://tappedout.net/mtg-decks/empty-deck")
    ).rejects.toThrow("empty");
  });

  it("TappedOut: throws when no card lines", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response("# Only comments\n// no cards\n", { status: 200 })
    );

    await expect(
      importFromUrl("https://www.tappedout.net/mtg-decks/nocards")
    ).rejects.toThrow("No cards found");
  });

  it("TappedOut: parses deck name and card lines", async () => {
    const txt = [
      "# My Cool List",
      "# Commander",
      "1 Kenrith, the Returned King",
      "// Mainboard",
      "10 Island  (TMP) 1",
      "1 Discovery // Dispersal | note",
      "2x Sol Ring",
    ].join("\n");

    vi.spyOn(http, "httpGet").mockResolvedValueOnce(new Response(txt, { status: 200 }));

    const result = await importFromUrl("https://tappedout.net/mtg-decks/cool-list");
    expect(result.source).toBe("tappedout");
    expect(result.name).toBe("My Cool List");
    const commander = result.cards.find((c) => c.name.includes("Kenrith"));
    expect(commander?.isCommander).toBe(true);
    expect(result.cards.some((c) => c.name === "Island")).toBe(true);
    expect(result.cards.some((c) => c.name === "Discovery")).toBe(true);
    expect(result.cards.some((c) => c.name === "Sol Ring")).toBe(true);
  });

  it("MTGTop8: uses plain-text export when present", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response("15 Island\n1 Sol Ring\n", { status: 200 })
    );

    const result = await importFromUrl("https://www.mtgtop8.com/event?e=9&d=4242");
    expect(result.source).toBe("mtgtop8");
    expect(result.cards.length).toBeGreaterThanOrEqual(2);
  });

  it("MTGTop8: falls back to HTML card extraction when export empty", async () => {
    const spy = vi.spyOn(http, "httpGet");
    spy.mockResolvedValueOnce(new Response("", { status: 200 }));
    const html =
      '<div class="deck">2 Lightning Bolt  &nbsp;1 Forest  </div>';
    spy.mockResolvedValueOnce(new Response(html, { status: 200 }));

    const result = await importFromUrl("https://mtgtop8.com/event?d=8001&e=1");
    expect(result.source).toBe("mtgtop8");
    expect(result.cards.some((c) => c.name === "Lightning Bolt")).toBe(true);
  });

  it("MTGTop8: throws when export and HTML yield no cards", async () => {
    const spy = vi.spyOn(http, "httpGet");
    spy.mockResolvedValueOnce(new Response("\n", { status: 200 }));
    spy.mockResolvedValueOnce(new Response("<html></html>", { status: 200 }));

    await expect(
      importFromUrl("https://www.mtgtop8.com/event?e=2&d=8002")
    ).rejects.toThrow("Could not parse deck from MTGTop8");
  });

  it("MTGDecks: imports txt list", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response("1 Forest\n40 Island\n", { status: 200 })
    );

    const result = await importFromUrl("https://mtgdecks.net/Commander/sea-monster");
    expect(result.source).toBe("mtgdecks");
    expect(result.name).toContain("sea-monster");
    expect(result.cards.length).toBeGreaterThanOrEqual(2);
  });

  it("MTGDecks: throws when txt has no cards", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response("# header only\n", { status: 200 })
    );

    await expect(
      importFromUrl("https://www.mtgdecks.net/Commander/bare")
    ).rejects.toThrow("No cards found");
  });

  it("EDHRec: builds deck from json", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          container: {
            json_dict: {
              card: { name: "Wilhelt, the Rotcleaver" },
              cardlists: [
                {
                  tag: "cards",
                  cardviews: [{ name: "Zombie Token" }, { name: "Undead Augur" }],
                },
              ],
            },
          },
        }),
        { status: 200 }
      )
    );

    const result = await importFromUrl("https://edhrec.com/commanders/wilhelt-the-rotcleaver");
    expect(result.source).toBe("edhrec");
    expect(result.formatWarning).toContain("average deck");
    expect(result.cards[0].isCommander).toBe(true);
    expect(result.cards.some((c) => c.name === "Undead Augur")).toBe(true);
  });

  it("EDHRec: throws when json_dict missing", async () => {
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(JSON.stringify({ container: {} }), { status: 200 })
    );

    await expect(
      importFromUrl("https://edhrec.com/commanders/broken")
    ).rejects.toThrow("unexpected");
  });
});

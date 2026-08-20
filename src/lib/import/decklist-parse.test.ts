import { describe, it, expect } from "vitest";
import { extractCardsFromHtml, parsePlainTextDecklist } from "./decklist-parse";

/**
 * This parser eats whatever a third-party site returns, so the interesting
 * cases are the hostile and the malformed, not the tidy decklist.
 */

describe("parsePlainTextDecklist", () => {
  it("parses quantity and name, with or without the x", () => {
    const cards = parsePlainTextDecklist("1 Sol Ring\n4x Lightning Bolt");
    expect(cards).toEqual([
      { name: "Sol Ring", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
      { name: "Lightning Bolt", quantity: 4, isCommander: false, isPartner: false, zone: "main" },
    ]);
  });

  it("skips lines that are not quantity-prefixed rather than importing them as cards", () => {
    expect(parsePlainTextDecklist("Sol Ring\n\nrandom text")).toEqual([]);
  });

  it("marks only the first card after a Commander header as the commander", () => {
    const cards = parsePlainTextDecklist(
      "// Commander\n1 Atraxa, Praetors' Voice\n1 Sol Ring"
    );
    expect(cards[0]).toMatchObject({ name: "Atraxa, Praetors' Voice", isCommander: true });
    expect(cards[1]).toMatchObject({ name: "Sol Ring", isCommander: false });
  });

  it("leaves the commander section when a Deck or Sideboard header follows", () => {
    const cards = parsePlainTextDecklist("# Commander\n# Deck\n1 Sol Ring");
    expect(cards[0].isCommander).toBe(false);
  });

  it("strips a trailing set code and a // or | comment from the name", () => {
    const cards = parsePlainTextDecklist("1 Sol Ring (C21) 263\n1 Counterspell // draw engine");
    expect(cards.map((c) => c.name)).toEqual(["Sol Ring", "Counterspell"]);
  });

  it("clamps an absurd quantity instead of trusting it", () => {
    const cards = parsePlainTextDecklist("999 Sol Ring\n0 Counterspell");
    expect(cards[0].quantity).toBe(99);
    expect(cards[1].quantity).toBe(1);
  });

  it("stops after 500 lines, so a huge paste cannot pin the parser", () => {
    const huge = Array.from({ length: 900 }, (_, i) => `1 Card ${i}`).join("\n");
    expect(parsePlainTextDecklist(huge)).toHaveLength(500);
  });

  it("drops a line whose name is only a comment suffix", () => {
    expect(parsePlainTextDecklist("1 // just a note")).toEqual([]);
  });

  it("returns nothing for empty input", () => {
    expect(parsePlainTextDecklist("")).toEqual([]);
  });

  it("tolerates CRLF line endings, which is what most downloads use", () => {
    expect(parsePlainTextDecklist("1 Sol Ring\r\n2 Island")).toHaveLength(2);
  });
});

describe("extractCardsFromHtml", () => {
  it("pulls quantity/name pairs out of markup", () => {
    const html = "<div>1 Sol Ring</div><div>2 Lightning Bolt</div>";
    expect(extractCardsFromHtml(html).map((c) => c.name)).toEqual([
      "Sol Ring",
      "Lightning Bolt",
    ]);
  });

  it("deduplicates by name — the same card appears in several page sections", () => {
    const html = "<div>1 Sol Ring</div><span>1 Sol Ring</span>";
    expect(extractCardsFromHtml(html)).toHaveLength(1);
  });

  it("rejects a quantity outside a plausible decklist range", () => {
    const html = "<div>0 Sol Ring</div><div>99 Lightning Bolt</div>";
    expect(extractCardsFromHtml(html)).toEqual([]);
  });

  it("rejects names too short to be a card", () => {
    expect(extractCardsFromHtml("<div>1 Ab</div>")).toEqual([]);
  });

  it("returns nothing for markup with no decklist in it", () => {
    expect(extractCardsFromHtml("<html><body><p>Just a moment…</p></body></html>")).toEqual([]);
  });

  it("never reports a card as a commander — HTML carries no section structure", () => {
    const cards = extractCardsFromHtml("<div>1 Atraxa, Praetors' Voice</div>");
    expect(cards.every((c) => !c.isCommander)).toBe(true);
  });
});

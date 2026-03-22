import { describe, it, expect } from "vitest";
import { parseTextDecklist, exportToText } from "@/lib/deck/import";
import type { DeckCard } from "@/lib/deck/types";

// ── parseTextDecklist ──────────────────────────────────────────────────────────

describe("parseTextDecklist", () => {
  it("parses basic card list without sections", () => {
    const result = parseTextDecklist("1 Sol Ring\n1 Command Tower");
    expect(result.commander).toBeNull();
    expect(result.partner).toBeNull();
    expect(result.errors).toHaveLength(0);
    expect(result.cards).toEqual([
      { name: "Sol Ring", quantity: 1 },
      { name: "Command Tower", quantity: 1 },
    ]);
  });

  it("parses Commander section and Deck section", () => {
    const text = "Commander\n1 Atraxa, Praetor's Voice\nDeck\n1 Sol Ring";
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Atraxa, Praetor's Voice");
    expect(result.partner).toBeNull();
    expect(result.cards).toEqual([{ name: "Sol Ring", quantity: 1 }]);
  });

  it("treats second card in Commander section as partner", () => {
    const text = "Commander\n1 Sidar Kondo of Jamuraa\n1 Vial Smasher the Fierce\nDeck\n1 Sol Ring";
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Sidar Kondo of Jamuraa");
    expect(result.partner).toBe("Vial Smasher the Fierce");
    expect(result.cards).toHaveLength(1);
  });

  it("strips set code and collector number from card name", () => {
    const result = parseTextDecklist("1 Sol Ring (CMD) 123");
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("strips HTML tags from card name", () => {
    const result = parseTextDecklist("1 <b>Sol</b> Ring");
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("clamps quantity above 99 to 99", () => {
    const result = parseTextDecklist("200 Sol Ring");
    expect(result.cards[0].quantity).toBe(99);
  });

  it("returns empty result for empty string", () => {
    const result = parseTextDecklist("");
    expect(result.commander).toBeNull();
    expect(result.partner).toBeNull();
    expect(result.cards).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns error for null input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = parseTextDecklist(null as any);
    expect(result.errors).toContain("Invalid input");
    expect(result.commander).toBeNull();
    expect(result.cards).toHaveLength(0);
  });

  it("ignores lines starting with //", () => {
    const result = parseTextDecklist("// This is a comment\n1 Sol Ring");
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("ignores lines starting with #", () => {
    const result = parseTextDecklist("# Comment\n1 Sol Ring");
    expect(result.cards).toHaveLength(1);
  });

  it("parses quantity with x suffix (1x Sol Ring)", () => {
    const result = parseTextDecklist("4x Relentless Rats");
    expect(result.cards[0].quantity).toBe(4);
    expect(result.cards[0].name).toBe("Relentless Rats");
  });

  it("handles multiple cards in deck section", () => {
    const text = "Deck\n1 Island\n2 Mountain\n3 Forest";
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(3);
    expect(result.cards[1]).toEqual({ name: "Mountain", quantity: 2 });
  });
});

// ── exportToText ───────────────────────────────────────────────────────────────

describe("exportToText", () => {
  function makeCard(name: string, qty = 1): DeckCard {
    return {
      id: "id-" + name,
      name,
      manaCost: "{1}",
      cmc: 1,
      typeLine: "Creature",
      oracleText: "",
      colorIdentity: [],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "creature",
      quantity: qty,
    };
  }

  it("exports deck with commander", () => {
    const commander = makeCard("Atraxa, Praetor's Voice");
    const cards = [makeCard("Sol Ring"), makeCard("Command Tower")];
    const text = exportToText(commander, null, cards);
    expect(text).toContain("Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
    expect(text).toContain("1 Command Tower");
  });

  it("exports deck without commander", () => {
    const cards = [makeCard("Sol Ring")];
    const text = exportToText(null, null, cards);
    expect(text).not.toContain("Commander");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("includes partner section when partner is provided", () => {
    const commander = makeCard("Sidar Kondo of Jamuraa");
    const partner = makeCard("Vial Smasher the Fierce");
    const text = exportToText(commander, partner, []);
    expect(text).toContain("Partner");
    expect(text).toContain("1 Vial Smasher the Fierce");
  });

  it("respects card quantity", () => {
    const cards = [makeCard("Forest", 5)];
    const text = exportToText(null, null, cards);
    expect(text).toContain("5 Forest");
  });
});

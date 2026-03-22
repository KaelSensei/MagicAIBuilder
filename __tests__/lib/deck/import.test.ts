import { describe, it, expect } from "vitest";
import { parseTextDecklist, exportToText } from "@/lib/deck/import";
import type { DeckCard } from "@/lib/deck/types";

// ---------------------------------------------------------------------------
// parseTextDecklist
// ---------------------------------------------------------------------------
describe("parseTextDecklist", () => {
  it("parses a simple card list without sections", () => {
    const text = `1 Sol Ring\n1 Cultivate\n1 Command Tower`;
    const result = parseTextDecklist(text);
    expect(result.commander).toBeNull();
    expect(result.cards).toHaveLength(3);
    expect(result.cards[0].name).toBe("Sol Ring");
    expect(result.cards[0].quantity).toBe(1);
  });

  it("parses Commander section", () => {
    const text = `Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring`;
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Atraxa, Praetors' Voice");
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("parses Commander + partner section", () => {
    const text = `Commander\n1 Thrasios, Triton Hero\n1 Tymna the Weaver\n\nDeck\n1 Sol Ring`;
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Thrasios, Triton Hero");
    expect(result.partner).toBe("Tymna the Weaver");
    expect(result.cards).toHaveLength(1);
  });

  it("parses quantity with 'x' format (1x Card Name)", () => {
    const text = `4x Forest\n2x Sol Ring`;
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Forest");
    expect(result.cards[0].quantity).toBe(4);
    expect(result.cards[1].quantity).toBe(2);
  });

  it("strips set code from card names", () => {
    const text = `1 Sol Ring (CMR) 263\n1 Lightning Bolt (M10) 149`;
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Sol Ring");
    expect(result.cards[1].name).toBe("Lightning Bolt");
  });

  it("skips comment lines starting with //", () => {
    const text = `// This is a comment\n1 Sol Ring\n// Another comment`;
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("skips comment lines starting with #", () => {
    const text = `# This is a comment\n1 Sol Ring`;
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(1);
  });

  it("skips empty lines", () => {
    const text = `\n\n1 Sol Ring\n\n1 Forest\n\n`;
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(2);
  });

  it("handles cards without quantity prefix (defaults to 1)", () => {
    const text = `Sol Ring\nCultivate`;
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].quantity).toBe(1);
    expect(result.cards[1].quantity).toBe(1);
  });

  it("clamps quantity above 99 to 99", () => {
    const text = `200 Forest`;
    const result = parseTextDecklist(text);
    expect(result.cards[0].quantity).toBe(99);
  });

  it("clamps quantity below 1 to 1 for explicit 0 edge case", () => {
    // The function uses parseInt — "0" parses to 0, clampQuantity returns 1
    const text = `0 Forest`;
    const result = parseTextDecklist(text);
    // "0 Forest" — match: qty=0 → clamp to 1
    expect(result.cards[0].quantity).toBe(1);
  });

  it("strips HTML tags from card names (XSS prevention)", () => {
    const text = `1 <b>Sol Ring</b>`;
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Sol Ring");
    expect(result.cards[0].name).not.toContain("<");
  });

  it("truncates names longer than 200 chars", () => {
    const longName = "A".repeat(250);
    const text = `1 ${longName}`;
    const result = parseTextDecklist(text);
    expect(result.cards[0].name.length).toBeLessThanOrEqual(200);
  });

  it("handles invalid input type gracefully", () => {
    // @ts-expect-error testing runtime guard
    const result = parseTextDecklist(null);
    expect(result.errors).toContain("Invalid input");
    expect(result.cards).toHaveLength(0);
  });

  it("limits input to MAX_LINES (500) lines", () => {
    const lines = Array.from({ length: 600 }, (_, i) => `1 Card ${i}`).join("\n");
    const result = parseTextDecklist(lines);
    expect(result.cards.length).toBeLessThanOrEqual(500);
  });

  it("handles deck section switch — stops adding to commander section", () => {
    const text = `Commander\n1 Kenrith, the Returned King\n\nDeck\n1 Sol Ring\n1 Cultivate`;
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Kenrith, the Returned King");
    expect(result.cards).toHaveLength(2);
    // Cards in deck section, not commander
    expect(result.cards.map((c) => c.name)).not.toContain("Kenrith, the Returned King");
  });

  it("handles mainboard section keyword", () => {
    const text = `Commander\n1 Atraxa, Praetors' Voice\n\nMainboard\n1 Sol Ring`;
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("returns errors array for skipped lines with empty names", () => {
    // A line that matches quantity format but produces empty name after sanitization
    const text = `1 <br>`;
    const result = parseTextDecklist(text);
    // The name after stripping HTML from "<br>" is empty → error pushed
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns no errors for a clean deck", () => {
    const text = `Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n36 Forest`;
    const result = parseTextDecklist(text);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// exportToText
// ---------------------------------------------------------------------------
describe("exportToText", () => {
  function makeCard(name: string, overrides: Partial<DeckCard> = {}): DeckCard {
    return {
      id: "id",
      name,
      manaCost: "",
      cmc: 0,
      typeLine: "",
      oracleText: "",
      colorIdentity: [],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "creature",
      quantity: 1,
      zone: "main",
      ...overrides,
    };
  }

  it("exports with Commander section when commander is provided", () => {
    const commander = makeCard("Atraxa, Praetors' Voice", { category: "commander" });
    const cards = [makeCard("Sol Ring", { category: "ramp" })];
    const result = exportToText(commander, null, cards);
    expect(result).toContain("Commander");
    expect(result).toContain("1 Atraxa, Praetors' Voice");
    expect(result).toContain("1 Sol Ring");
  });

  it("exports without Commander section when commander is null", () => {
    const cards = [makeCard("Sol Ring"), makeCard("Forest", { category: "land" })];
    const result = exportToText(null, null, cards);
    expect(result).not.toContain("Commander");
    expect(result).toContain("Deck");
    expect(result).toContain("1 Sol Ring");
  });

  it("exports Partner section when partner is provided", () => {
    const commander = makeCard("Thrasios, Triton Hero", { category: "commander" });
    const partner = makeCard("Tymna the Weaver", { category: "commander" });
    const cards = [makeCard("Sol Ring")];
    const result = exportToText(commander, partner, cards);
    expect(result).toContain("Partner");
    expect(result).toContain("1 Tymna the Weaver");
  });

  it("exports quantity for cards with quantity > 1", () => {
    const cards = [makeCard("Forest", { quantity: 10, category: "land" })];
    const result = exportToText(null, null, cards);
    expect(result).toContain("10 Forest");
  });

  it("exports empty deck with just Deck section", () => {
    const result = exportToText(null, null, []);
    expect(result).toContain("Deck");
  });

  it("exports card lines in correct format '1 Card Name'", () => {
    const cards = [makeCard("Sol Ring")];
    const result = exportToText(null, null, cards);
    const lines = result.split("\n").filter((l) => l.trim());
    const cardLine = lines.find((l) => l.includes("Sol Ring"));
    expect(cardLine).toBe("1 Sol Ring");
  });
});

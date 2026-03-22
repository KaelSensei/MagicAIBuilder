import { describe, it, expect } from "vitest";
import { parseTextDecklist, exportToText } from "./import";
import type { DeckCard } from "./types";

describe("parseTextDecklist", () => {
  it("returns empty result for empty string", () => {
    const result = parseTextDecklist("");
    expect(result.commander).toBeNull();
    expect(result.partner).toBeNull();
    expect(result.cards).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns error for non-string input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = parseTextDecklist(null as any);
    expect(result.errors).toContain("Invalid input");
  });

  it("parses simple card list", () => {
    const text = "4 Lightning Bolt\n2 Island";
    const result = parseTextDecklist(text);
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0]).toEqual({ name: "Lightning Bolt", quantity: 4 });
    expect(result.cards[1]).toEqual({ name: "Island", quantity: 2 });
  });

  it("parses cards with x quantity notation", () => {
    const result = parseTextDecklist("3x Sol Ring");
    expect(result.cards[0]).toEqual({ name: "Sol Ring", quantity: 3 });
  });

  it("parses commander section", () => {
    const text = "Commander\n1 Atraxa, Praetors Voice\n\nDeck\n4 Sol Ring";
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Atraxa, Praetors Voice");
    expect(result.cards[0]).toEqual({ name: "Sol Ring", quantity: 4 });
  });

  it("parses partner from commander section", () => {
    const text = "Commander\n1 Thrasios, Triton Hero\n1 Tymna the Weaver\n\nDeck\n98 Forest";
    const result = parseTextDecklist(text);
    expect(result.commander).toBe("Thrasios, Triton Hero");
    expect(result.partner).toBe("Tymna the Weaver");
  });

  it("ignores comment lines starting with //", () => {
    const result = parseTextDecklist("// this is a comment\n4 Lightning Bolt");
    expect(result.cards).toHaveLength(1);
  });

  it("ignores comment lines starting with #", () => {
    const result = parseTextDecklist("# header\n4 Counterspell");
    expect(result.cards).toHaveLength(1);
  });

  it("strips set code from card name", () => {
    const result = parseTextDecklist("1 Lightning Bolt (M11) 150");
    expect(result.cards[0].name).toBe("Lightning Bolt");
  });

  it("strips HTML tags from card name", () => {
    const result = parseTextDecklist("1 <b>Sol Ring</b>");
    expect(result.cards[0].name).toBe("Sol Ring");
  });

  it("clamps quantity above 99 to 99", () => {
    const result = parseTextDecklist("200 Forest");
    expect(result.cards[0].quantity).toBe(99);
  });

  it("clamps quantity below 1 to 1 (default)", () => {
    const result = parseTextDecklist("Forest");
    expect(result.cards[0].quantity).toBe(1);
  });

  it("ignores blank lines", () => {
    const result = parseTextDecklist("4 Lightning Bolt\n\n\n2 Island");
    expect(result.cards).toHaveLength(2);
  });

  it("resets commander section on Deck header", () => {
    const text = "Commander\n1 Atraxa\n\nDeck\n4 Forest";
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Forest");
    expect(result.commander).toBe("Atraxa");
  });

  it("resets commander section on 99 header", () => {
    const text = "Commander\n1 Atraxa\n\n99\n4 Forest";
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Forest");
  });

  it("handles mainboard header", () => {
    const text = "Commander\n1 Atraxa\n\nMainboard\n3 Counterspell";
    const result = parseTextDecklist(text);
    expect(result.cards[0].name).toBe("Counterspell");
  });

  it("limits to 500 lines", () => {
    const lines = Array.from({ length: 600 }, (_, i) => `1 Card${i}`).join("\n");
    const result = parseTextDecklist(lines);
    expect(result.cards.length).toBeLessThanOrEqual(500);
  });

  it("skips empty card names after parsing", () => {
    // A line that is just a number with empty name
    const result = parseTextDecklist("4 \n2 Island");
    expect(result.cards.some((c) => c.name === "")).toBe(false);
  });
});

describe("exportToText", () => {
  const makeCard = (name: string, quantity = 1): DeckCard =>
    ({
      id: "1",
      scryfallId: "abc",
      name,
      quantity,
      category: "other",
      zone: "main",
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
      isCommander: false,
      isPartner: false,
    } as unknown as DeckCard);

  it("exports commander section when commander provided", () => {
    const result = exportToText(makeCard("Atraxa, Praetors Voice"), null, []);
    expect(result).toContain("Commander");
    expect(result).toContain("1 Atraxa, Praetors Voice");
  });

  it("exports partner section when partner provided", () => {
    const result = exportToText(
      makeCard("Thrasios"),
      makeCard("Tymna"),
      []
    );
    expect(result).toContain("Partner");
    expect(result).toContain("1 Tymna");
  });

  it("always includes Deck section", () => {
    const result = exportToText(null, null, [makeCard("Lightning Bolt", 4)]);
    expect(result).toContain("Deck");
    expect(result).toContain("4 Lightning Bolt");
  });

  it("exports multiple cards with correct quantities", () => {
    const result = exportToText(null, null, [
      makeCard("Sol Ring", 1),
      makeCard("Forest", 30),
    ]);
    expect(result).toContain("1 Sol Ring");
    expect(result).toContain("30 Forest");
  });

  it("handles null commander and partner", () => {
    const result = exportToText(null, null, []);
    expect(result).toContain("Deck");
    expect(result).not.toContain("Commander");
    expect(result).not.toContain("Partner");
  });
});

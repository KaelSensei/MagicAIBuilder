/**
 * Tests for the updated export functions:
 *   - exportPlainText now emits card notes as "// note" comments
 */
import { describe, it, expect } from "vitest";
import { exportPlainText } from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Swords to Plowshares",
    manaCost: "{W}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Exile target creature.",
    colorIdentity: ["W"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "removal",
    quantity: 1,
    notes: null,
    zone: "main" as const,
    ...overrides,
  };
}

function makeDeck(cards: DeckCard[], overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    description: "",
    tags: [],
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards,
    maybeboard: [],
    format: "commander",
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    shareToken: null,
    shareEnabled: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("exportPlainText — card notes as comments", () => {
  it("exports a card with a note as a // comment on the next line", () => {
    const deck = makeDeck([
      makeCard({ name: "Counterspell", notes: "Counter all threats" }),
    ]);
    const output = exportPlainText(deck);
    expect(output).toContain("1 Counterspell");
    expect(output).toContain("// Counter all threats");
  });

  it("places the comment immediately after the card line", () => {
    const deck = makeDeck([
      makeCard({ name: "Sol Ring", notes: "Ramp piece" }),
    ]);
    const lines = exportPlainText(deck).split("\n");
    const cardIdx = lines.findIndex((l) => l === "1 Sol Ring");
    expect(cardIdx).toBeGreaterThan(-1);
    expect(lines[cardIdx + 1]).toBe("// Ramp piece");
  });

  it("does NOT emit a comment for cards with null notes", () => {
    const deck = makeDeck([makeCard({ name: "Plains", notes: null })]);
    const output = exportPlainText(deck);
    expect(output).not.toContain("//");
  });

  it("does NOT emit a comment for cards with empty-string notes", () => {
    const deck = makeDeck([makeCard({ name: "Island", notes: "" })]);
    const output = exportPlainText(deck);
    expect(output).not.toContain("//");
  });

  it("does NOT emit a comment for cards with whitespace-only notes", () => {
    const deck = makeDeck([makeCard({ name: "Mountain", notes: "   " })]);
    const output = exportPlainText(deck);
    expect(output).not.toContain("//");
  });

  it("trims note whitespace in the comment", () => {
    const deck = makeDeck([makeCard({ notes: "  win condition  " })]);
    const output = exportPlainText(deck);
    expect(output).toContain("// win condition");
  });

  it("handles mixed cards — some with notes, some without", () => {
    const deck = makeDeck([
      makeCard({ id: "c1", name: "Sol Ring", notes: "Always include" }),
      makeCard({ id: "c2", name: "Swamp", notes: null }),
      makeCard({ id: "c3", name: "Rhystic Study", notes: "Draw engine" }),
    ]);
    const output = exportPlainText(deck);
    expect(output).toContain("1 Sol Ring\n// Always include");
    expect(output).not.toMatch(/1 Swamp\n\/\//);
    expect(output).toContain("1 Rhystic Study\n// Draw engine");
  });

  it("includes commander section without notes support (commander has no notes field by default)", () => {
    const deck = makeDeck([], {
      commander: makeCard({ name: "Atraxa, Praetors' Voice" }),
    });
    const output = exportPlainText(deck);
    expect(output).toContain("Commander");
    expect(output).toContain("1 Atraxa, Praetors' Voice");
  });
});

describe("exportPlainText — deck description / tags not in export", () => {
  it("does not include description in export output", () => {
    const deck = makeDeck([], { description: "My secret strategy" });
    const output = exportPlainText(deck);
    expect(output).not.toContain("My secret strategy");
  });

  it("does not include tags in export output", () => {
    const deck = makeDeck([], { tags: ["cEDH", "budget"] });
    const output = exportPlainText(deck);
    expect(output).not.toContain("cEDH");
    expect(output).not.toContain("budget");
  });
});

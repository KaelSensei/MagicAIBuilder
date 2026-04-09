import { describe, it, expect } from "vitest";
import {
  generateDeckCSV,
  generateDeckCSVFull,
  buildExportMetadata,
  buildTypeBreakdown,
  type ExportOptions,
} from "./stats-export";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name: string, price: number | null = 5, typeLine = "Creature", cmc = 2): DeckCard {
  return {
    id, name, manaCost: "", cmc, typeLine,
    oracleText: "", colorIdentity: ["W"],
    isGameChanger: false, isBanned: false, price,
    imageUri: "", artCropUri: "", category: "creature",
    quantity: 1, zone: "main", scryfallId: id,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1", name: "Test Deck", description: "A test",
    commander: makeCard("cmd", "Atraxa", 30, "Legendary Creature", 4),
    partner: null, companion: null, pairingType: "none",
    cards: [
      makeCard("c1", "Sol Ring", 2, "Artifact", 1),
      makeCard("c2", "Rhystic Study", 25, "Enchantment", 2),
      makeCard("c3", "Forest", 0.10, "Basic Land", 0),
    ],
    maybeboard: [], format: "commander", cardCount: 0, targetBracket: 3, manualBracket: null,
    budget: null, tags: ["Combo"], shareToken: null, shareEnabled: false,
    isPublic: false, isAIGenerated: false,
    createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-06-01"),
    ...overrides,
  };
}

// ─── CSV generation ────────────────────────────────────────────────────────
describe("generateDeckCSV", () => {
  it("generates valid CSV with header row", () => {
    const deck = makeDeck();
    const csv = generateDeckCSV(deck.cards);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Card Name");
    expect(lines[0]).toContain("Qty");
  });

  it("includes each card in the CSV", () => {
    const deck = makeDeck();
    const csv = generateDeckCSV(deck.cards);
    expect(csv).toContain("Sol Ring");
    expect(csv).toContain("Rhystic Study");
    expect(csv).toContain("Forest");
  });

  it("handles cards with commas in name (CSV escaping)", () => {
    const cards = [makeCard("c1", "Jhoira, Weatherlight Captain", 5)];
    const csv = generateDeckCSV(cards);
    expect(csv).toContain('"Jhoira, Weatherlight Captain"');
  });

  it("includes price column", () => {
    const deck = makeDeck();
    const csv = generateDeckCSV(deck.cards);
    expect(csv.split("\n")[0]).toContain("Price");
  });
});

describe("generateDeckCSVFull", () => {
  it("includes stats header rows in full report", () => {
    const deck = makeDeck();
    const csv = generateDeckCSVFull(deck);
    expect(csv).toContain("Deck:");
    expect(csv).toContain("Format:");
  });

  it("includes card list after metadata", () => {
    const deck = makeDeck();
    const csv = generateDeckCSVFull(deck);
    expect(csv).toContain("Sol Ring");
  });

  it("includes total cost row", () => {
    const deck = makeDeck();
    const csv = generateDeckCSVFull(deck);
    expect(csv).toContain("Total Cost");
  });
});

// ─── Export metadata ───────────────────────────────────────────────────────
describe("buildExportMetadata", () => {
  it("includes deck name and format", () => {
    const deck = makeDeck();
    const meta = buildExportMetadata(deck);
    expect(meta.deckName).toBe("Test Deck");
    expect(meta.format).toBe("commander");
  });

  it("includes commander name if present", () => {
    const deck = makeDeck();
    const meta = buildExportMetadata(deck);
    expect(meta.commanderName).toBe("Atraxa");
  });

  it("includes card count", () => {
    const deck = makeDeck();
    const meta = buildExportMetadata(deck);
    expect(meta.cardCount).toBe(3);
  });

  it("includes total price", () => {
    const deck = makeDeck();
    const meta = buildExportMetadata(deck);
    // Sol Ring (2) + Rhystic Study (25) + Forest (0.10) = 27.10
    expect(meta.totalPrice).toBeCloseTo(27.1);
  });
});

// ─── Type breakdown ────────────────────────────────────────────────────────
describe("buildTypeBreakdown", () => {
  it("counts cards by type category", () => {
    const cards = [
      makeCard("c1", "A", 1, "Creature"),
      makeCard("c2", "B", 1, "Creature"),
      makeCard("c3", "C", 1, "Instant"),
      makeCard("c4", "D", 1, "Basic Land"),
    ];
    const breakdown = buildTypeBreakdown(cards);
    expect(breakdown.creatures).toBe(2);
    expect(breakdown.spells).toBe(1);
    expect(breakdown.lands).toBe(1);
  });

  it("calculates percentages", () => {
    const cards = [
      makeCard("c1", "A", 1, "Creature"),
      makeCard("c2", "B", 1, "Basic Land"),
    ];
    const breakdown = buildTypeBreakdown(cards);
    expect(breakdown.creaturesPct).toBeCloseTo(50);
    expect(breakdown.landsPct).toBeCloseTo(50);
  });

  it("handles empty card list", () => {
    const breakdown = buildTypeBreakdown([]);
    expect(breakdown.creatures).toBe(0);
    expect(breakdown.spells).toBe(0);
    expect(breakdown.lands).toBe(0);
  });
});

// ─── Export options ────────────────────────────────────────────────────────
describe("ExportOptions", () => {
  it("default options include all sections", () => {
    const opts: ExportOptions = {
      includeManaCurve: true,
      includePriceBreakdown: true,
      includeMetaAnalysis: true,
      includeSynergies: true,
      colorScheme: "dark",
    };
    expect(opts.includeManaCurve).toBe(true);
    expect(opts.colorScheme).toBe("dark");
  });
});

import { describe, it, expect } from "vitest";
import { exportPlainText, exportMoxfield, exportArena, exportMTGO, exportTappedOut, exportArchidekt } from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(name: string, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "id",
    name,
    manaCost: "",
    cmc: 2,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: ["G"],
    isGameChanger: false,
    isBanned: false,
    price: 1.0,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: makeCard("Atraxa, Praetors' Voice", { category: "commander" }),
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [
      makeCard("Sol Ring", { category: "ramp" }),
      makeCard("Forest", { category: "land", cmc: 0, quantity: 10 }),
    ],
    format: "commander",
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// exportPlainText
// ---------------------------------------------------------------------------
describe("exportPlainText", () => {
  it("includes Commander section", () => {
    const deck = makeDeck();
    const result = exportPlainText(deck);
    expect(result).toContain("Commander");
    expect(result).toContain("1 Atraxa, Praetors' Voice");
  });

  it("includes Deck section with cards", () => {
    const deck = makeDeck();
    const result = exportPlainText(deck);
    expect(result).toContain("Deck");
    expect(result).toContain("1 Sol Ring");
  });

  it("exports correct quantity for multi-copy cards", () => {
    const deck = makeDeck();
    const result = exportPlainText(deck);
    expect(result).toContain("10 Forest");
  });

  it("exports card notes as // comment lines", () => {
    const deck = makeDeck();
    deck.cards = [makeCard("Sol Ring", { notes: "great ramp" })];
    const result = exportPlainText(deck);
    expect(result).toContain("// great ramp");
  });

  it("does not include Partner section when no partner", () => {
    const deck = makeDeck();
    const result = exportPlainText(deck);
    expect(result).not.toContain("Partner");
  });

  it("includes Partner section when partner is set", () => {
    const deck = makeDeck({ partner: makeCard("Tymna the Weaver", { category: "commander" }) });
    const result = exportPlainText(deck);
    expect(result).toContain("Partner");
    expect(result).toContain("1 Tymna the Weaver");
  });

  it("handles no commander", () => {
    const deck = makeDeck({ commander: null });
    const result = exportPlainText(deck);
    expect(result).not.toContain("Commander");
    expect(result).toContain("Deck");
  });
});

// ---------------------------------------------------------------------------
// exportMoxfield
// ---------------------------------------------------------------------------
describe("exportMoxfield", () => {
  it("uses // Commander style comments", () => {
    const deck = makeDeck();
    const result = exportMoxfield(deck);
    expect(result).toContain("// Commander");
    expect(result).toContain("1 Atraxa, Praetors' Voice");
  });

  it("uses // Deck style comment", () => {
    const deck = makeDeck();
    const result = exportMoxfield(deck);
    expect(result).toContain("// Deck");
  });

  it("includes partner section", () => {
    const deck = makeDeck({ partner: makeCard("Thrasios, Triton Hero", { category: "commander" }) });
    const result = exportMoxfield(deck);
    expect(result).toContain("// Partner");
  });
});

// ---------------------------------------------------------------------------
// exportArena
// ---------------------------------------------------------------------------
describe("exportArena", () => {
  it("has Commander and Deck sections", () => {
    const deck = makeDeck();
    const result = exportArena(deck);
    expect(result).toContain("Commander");
    expect(result).toContain("Deck");
  });

  it("groups commander and partner together under Commander section", () => {
    const deck = makeDeck({ partner: makeCard("Thrasios, Triton Hero", { category: "commander" }) });
    const result = exportArena(deck);
    const lines = result.split("\n");
    const cmdIdx = lines.findIndex((l) => l === "Commander");
    const deckIdx = lines.findIndex((l) => l === "Deck");
    // Both commanders appear between Commander and Deck
    expect(cmdIdx).toBeLessThan(deckIdx);
    expect(lines.slice(cmdIdx, deckIdx).some((l) => l.includes("Atraxa"))).toBe(true);
    expect(lines.slice(cmdIdx, deckIdx).some((l) => l.includes("Thrasios"))).toBe(true);
  });

  it("no commander section when commander is null", () => {
    const deck = makeDeck({ commander: null });
    const result = exportArena(deck);
    expect(result).not.toContain("Commander");
    expect(result).toContain("Deck");
  });
});

// ---------------------------------------------------------------------------
// exportMTGO
// ---------------------------------------------------------------------------
describe("exportMTGO", () => {
  it("produces valid XML", () => {
    const deck = makeDeck();
    const result = exportMTGO(deck);
    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain("<Deck");
    expect(result).toContain("</Deck>");
  });

  it("includes all cards as <Cards> elements", () => {
    const deck = makeDeck();
    const result = exportMTGO(deck);
    expect(result).toContain('Name="Atraxa, Praetors\' Voice"');
    expect(result).toContain('Name="Sol Ring"');
  });

  it("escapes quotes in card names", () => {
    const deck = makeDeck({ cards: [makeCard('Card "With" Quotes')] });
    const result = exportMTGO(deck);
    expect(result).toContain("&quot;");
    expect(result).not.toContain('Name="Card "With"');
  });
});

// ---------------------------------------------------------------------------
// exportTappedOut
// ---------------------------------------------------------------------------
describe("exportTappedOut", () => {
  it("marks commanders with *CMDR*", () => {
    const deck = makeDeck();
    const result = exportTappedOut(deck);
    expect(result).toContain("1x Atraxa, Praetors' Voice *CMDR*");
  });

  it("uses Nx format for cards", () => {
    const deck = makeDeck();
    const result = exportTappedOut(deck);
    expect(result).toContain("1x Sol Ring");
    expect(result).toContain("10x Forest");
  });

  it("marks partner commander with *CMDR*", () => {
    const deck = makeDeck({ partner: makeCard("Tymna the Weaver", { category: "commander" }) });
    const result = exportTappedOut(deck);
    expect(result).toContain("1x Tymna the Weaver *CMDR*");
  });
});

// ---------------------------------------------------------------------------
// exportArchidekt
// ---------------------------------------------------------------------------
describe("exportArchidekt", () => {
  it("includes Commander section with count", () => {
    const deck = makeDeck();
    const result = exportArchidekt(deck);
    expect(result).toContain("Commander (1)");
    expect(result).toContain("1 Atraxa, Praetors' Voice");
  });

  it("includes Mainboard section with correct count", () => {
    const deck = makeDeck();
    const result = exportArchidekt(deck);
    // 1 Sol Ring (qty 1) + 10 Forest (qty 10) = 11
    expect(result).toContain("Mainboard (11)");
  });

  it("shows commander count as 2 with partner", () => {
    const deck = makeDeck({ partner: makeCard("Tymna the Weaver", { category: "commander" }) });
    const result = exportArchidekt(deck);
    expect(result).toContain("Commander (2)");
  });

  it("skips Commander section when no commander", () => {
    const deck = makeDeck({ commander: null });
    const result = exportArchidekt(deck);
    expect(result).not.toContain("Commander (");
    expect(result).toContain("Mainboard (");
  });
});

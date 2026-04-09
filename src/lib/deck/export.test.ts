import { describe, it, expect } from "vitest";
import {
  exportPlainText,
  exportMoxfield,
  exportArena,
  exportMTGO,
  exportTappedOut,
  exportArchidekt,
} from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(name: string, qty = 1, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "c-" + name,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other" as const,
    quantity: qty,
    zone: "main" as const,
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("exportPlainText", () => {
  it("exports a deck with commander", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring"), makeCard("Command Tower")],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
    expect(text).toContain("1 Command Tower");
  });

  it("exports a deck without commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportPlainText(deck);
    expect(text).not.toContain("Commander");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("includes partner section", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("Partner");
    expect(text).toContain("1 Vial Smasher the Fierce");
  });

  it("includes // note lines when card has notes", () => {
    const deck = makeDeck({
      cards: [makeCard("Sol Ring", 1, { notes: "Core ramp piece" })],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("// Core ramp piece");
  });

  it("respects quantity", () => {
    const deck = makeDeck({ cards: [makeCard("Forest", 10)] });
    const text = exportPlainText(deck);
    expect(text).toContain("10 Forest");
  });
});

describe("exportMoxfield", () => {
  it("exports with // Commander section header", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportMoxfield(deck);
    expect(text).toContain("// Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("// Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("exports without commander section when no commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportMoxfield(deck);
    expect(text).not.toContain("// Commander");
    expect(text).toContain("// Deck");
  });
});

describe("exportArena", () => {
  it("exports with Commander and Deck sections", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportArena(deck);
    expect(text).toContain("Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("does not emit Commander section when no commander or partner", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportArena(deck);
    expect(text).not.toMatch(/^Commander$/m);
  });
});

describe("exportMTGO", () => {
  it("exports valid XML", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const xml = exportMTGO(deck);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<Deck');
    expect(xml).toContain('Name="Atraxa, Praetor\'s Voice"');
    expect(xml).toContain('Name="Sol Ring"');
  });

  it("escapes double quotes in card names", () => {
    const deck = makeDeck({
      cards: [makeCard('Kongming, "Sleeping Dragon"')],
    });
    const xml = exportMTGO(deck);
    expect(xml).toContain("&quot;");
  });
});

describe("exportTappedOut", () => {
  it("marks commanders with *CMDR*", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportTappedOut(deck);
    expect(text).toContain("1x Atraxa, Praetor's Voice *CMDR*");
    expect(text).toContain("1x Sol Ring");
  });

  it("marks partner with *CMDR*", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportTappedOut(deck);
    expect(text).toContain("1x Vial Smasher the Fierce *CMDR*");
  });
});

describe("exportArchidekt", () => {
  it("exports with Commander section count", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring"), makeCard("Forest", 5)],
    });
    const text = exportArchidekt(deck);
    expect(text).toContain("Commander (1)");
    expect(text).toContain("Mainboard (6)"); // 1 Sol Ring + 5 Forest
  });

  it("exports with two commanders", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportArchidekt(deck);
    expect(text).toContain("Commander (2)");
  });

  it("does not include Commander section when no commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportArchidekt(deck);
    expect(text).not.toContain("Commander");
    expect(text).toContain("Mainboard (1)");
  });
});

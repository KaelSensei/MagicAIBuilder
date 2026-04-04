import { describe, it, expect } from "vitest";
import {
  LUTRI_SPELLCHASER_NAME,
  describeCompanionCondition,
  detectCompanionCondition,
  detectCompanionConditionFromDeckCard,
  getCompanionDeckWarnings,
  isBannedCompanionInCommander,
  isScryfallCompanionCard,
  validateCompanionCondition,
} from "@/lib/deck/companion";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

function scryfall(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "id-1",
    name: "Test Card",
    cmc: 1,
    type_line: "Creature",
    color_identity: ["G"],
    keywords: ["Companion"],
    oracle_text: "Companion — Test.",
    ...overrides,
  };
}

function dcard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "db-1",
    name: "Lightning Bolt",
    manaCost: "{R}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Deal 3 damage.",
    colorIdentity: ["R"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

describe("isScryfallCompanionCard", () => {
  it("returns true when keyword Companion is present", () => {
    expect(isScryfallCompanionCard(scryfall({ keywords: ["Companion"] }))).toBe(true);
  });

  it("returns true when Oracle contains Companion", () => {
    expect(
      isScryfallCompanionCard(
        scryfall({ keywords: [], oracle_text: "Companion — Your deck is cool." })
      )
    ).toBe(true);
  });

  it("returns false otherwise", () => {
    expect(isScryfallCompanionCard(scryfall({ keywords: [], oracle_text: "Flying" }))).toBe(
      false
    );
  });
});

describe("detectCompanionCondition", () => {
  it("detects Lurrus as max CMC 2", () => {
    const c = scryfall({
      name: "Lurrus of the Dream-Den",
      keywords: ["Companion"],
    });
    expect(detectCompanionCondition(c)).toEqual({ type: "max_cmc", value: 2 });
  });

  it("detects Gyruda as even CMC", () => {
    const c = scryfall({
      name: "Gyruda, Doom of Depths",
      keywords: ["Companion"],
    });
    expect(detectCompanionCondition(c)).toEqual({ type: "even_cmc" });
  });

  it("returns null when not a Companion card", () => {
    expect(detectCompanionCondition(scryfall({ keywords: [], oracle_text: "Flying" }))).toBeNull();
  });
});

describe("detectCompanionConditionFromDeckCard", () => {
  it("uses name for Lurrus without Oracle keyword", () => {
    expect(
      detectCompanionConditionFromDeckCard({
        name: "Lurrus of the Dream-Den",
        oracleText: "",
      })
    ).toEqual({ type: "max_cmc", value: 2 });
  });
});

describe("validateCompanionCondition", () => {
  it("passes Lurrus when all cards are CMC ≤ 2", () => {
    const deckCards: DeckCard[] = [
      dcard({ name: "Bolt", cmc: 1 }),
      dcard({ name: "Counterspell", cmc: 2 }),
    ];
    const result = validateCompanionCondition(
      { type: "max_cmc", value: 2 },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(true);
  });

  it("fails Lurrus when a card exceeds CMC 2", () => {
    const deckCards: DeckCard[] = [
      dcard({ name: "Bolt", cmc: 1 }),
      dcard({ name: "Wrath of God", cmc: 4 }),
    ];
    const result = validateCompanionCondition(
      { type: "max_cmc", value: 2 },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Wrath of God");
  });

  it("passes Gyruda when nonland CMCs are even", () => {
    const deckCards: DeckCard[] = [
      dcard({ name: "Island", cmc: 0, typeLine: "Basic Land — Island" }),
      dcard({ name: "Counterspell", cmc: 2 }),
      dcard({ name: "Mystic Reflection", cmc: 4 }),
    ];
    const result = validateCompanionCondition(
      { type: "even_cmc" },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(true);
  });

  it("fails Gyruda when a nonland has odd CMC", () => {
    const deckCards: DeckCard[] = [
      dcard({ name: "Counterspell", cmc: 2 }),
      dcard({ name: "Lightning Bolt", cmc: 1 }),
    ];
    const result = validateCompanionCondition(
      { type: "even_cmc" },
      deckCards,
      null,
      null
    );
    expect(result.valid).toBe(false);
  });
});

describe("describeCompanionCondition", () => {
  it("describes max CMC", () => {
    expect(describeCompanionCondition({ type: "max_cmc", value: 2 })).toContain("≤ 2");
  });

  it("describes custom", () => {
    expect(
      describeCompanionCondition({ type: "custom", description: "Custom rule" })
    ).toBe("Custom rule");
  });
});

describe("getCompanionDeckWarnings", () => {
  function baseDeck(): Deck {
    return {
      id: "d1",
      name: "D",
      commander: dcard({
        id: "cmd",
        name: "Kenrith",
        colorIdentity: ["W", "U", "B", "R", "G"],
        category: "commander",
        cmc: 5,
      }),
      partner: null,
      companion: null,
      pairingType: "none",
      cards: [],
      maybeboard: [],
      format: "commander",
      targetBracket: 3,
      manualBracket: null,
      budget: null,
      description: "",
      tags: [],
      shareToken: null,
      shareEnabled: false,
      isPublic: false,
      isAIGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it("flags Lutri", () => {
    const deck = baseDeck();
    deck.companion = dcard({
      name: LUTRI_SPELLCHASER_NAME,
      category: "companion",
      colorIdentity: ["U", "R"],
    });
    const w = getCompanionDeckWarnings(deck);
    expect(w.some((x) => x.includes("banned"))).toBe(true);
  });

  it("flags companion outside commander colors", () => {
    const deck = baseDeck();
    deck.commander = dcard({
      id: "cmd",
      name: "Isamaru",
      colorIdentity: ["W"],
      category: "commander",
      cmc: 1,
    });
    deck.companion = dcard({
      name: "Obosh, the Preypiercer",
      category: "companion",
      colorIdentity: ["R", "B"],
      oracleText: "Companion — …",
    });
    const w = getCompanionDeckWarnings(deck);
    expect(w.some((x) => x.toLowerCase().includes("identity"))).toBe(true);
  });
});

describe("isBannedCompanionInCommander", () => {
  it("is true for Lutri", () => {
    expect(isBannedCompanionInCommander({ name: LUTRI_SPELLCHASER_NAME })).toBe(true);
  });

  it("is false for Lurrus", () => {
    expect(isBannedCompanionInCommander({ name: "Lurrus of the Dream-Den" })).toBe(false);
  });
});

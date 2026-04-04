import { describe, it, expect } from "vitest";
import {
  LUTRI_SPELLCHASER_NAME,
  deckCardsForCompanionCheck,
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

describe("deckCardsForCompanionCheck", () => {
  it("drops maybeboard cards but keeps main and sideboard", () => {
    const main = dcard({ id: "m", name: "M", zone: "main" });
    const sb = dcard({ id: "s", name: "S", zone: "sideboard" });
    const mb = dcard({ id: "y", name: "Y", zone: "maybeboard" });
    const got = deckCardsForCompanionCheck([main, sb, mb]);
    expect(got.map((c) => c.id).sort()).toEqual(["m", "s"]);
  });
});

describe("isScryfallCompanionCard", () => {
  it("returns true when keyword Companion is present", () => {
    expect(isScryfallCompanionCard(scryfall({ keywords: ["Companion"] }))).toBe(true);
  });

  it("treats companion keyword case-insensitively", () => {
    expect(isScryfallCompanionCard(scryfall({ keywords: ["companion"] }))).toBe(true);
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

  it.each([
    ["Jegantha, the Wellspring", "Each mana cost must contain no more than one of each mana symbol"],
    ["Kaheera, the Orphanage", "creatures, lands, and cards with Companion"],
    ["Obosh, the Preypiercer", "odd mana values among nonland"],
    ["Umori, the Collector", "single card type"],
    ["Yorion, Sky Nomad", "at least 61 cards"],
    ["Zirda, the Dawnwaker", "Zirda"],
  ] as const)("detects %s as custom rule", (name, fragment) => {
    const c = scryfall({ name, keywords: ["Companion"] });
    const cond = detectCompanionCondition(c);
    expect(cond?.type).toBe("custom");
    if (cond?.type === "custom") {
      expect(cond.description).toContain(fragment);
    }
  });

  it("falls back to generic custom for unknown Companion card", () => {
    const c = scryfall({
      name: "Future Companion",
      keywords: ["Companion"],
      oracle_text: "Companion — Something new.",
    });
    const cond = detectCompanionCondition(c);
    expect(cond?.type).toBe("custom");
    if (cond?.type === "custom") {
      expect(cond.description).toContain("Oracle text");
    }
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

  it("returns null for unknown name and oracle without Companion", () => {
    expect(
      detectCompanionConditionFromDeckCard({
        name: "Random Bear",
        oracleText: "Trample",
      })
    ).toBeNull();
  });

  it("returns custom for unknown name when oracle has Companion", () => {
    const cond = detectCompanionConditionFromDeckCard({
      name: "Random Bear",
      oracleText: "Companion — You are cool.",
    });
    expect(cond?.type).toBe("custom");
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

  it("ignores odd CMC on type line Land (e.g. MDFC land face)", () => {
    const deckCards: DeckCard[] = [
      dcard({
        name: "Bala Ged Recovery",
        cmc: 7,
        typeLine: "Land",
      }),
    ];
    expect(validateCompanionCondition({ type: "even_cmc" }, deckCards, null, null).valid).toBe(
      true
    );
  });

  it("returns valid for none and custom", () => {
    expect(validateCompanionCondition({ type: "none" }, [], null, null).valid).toBe(true);
    expect(
      validateCompanionCondition(
        { type: "custom", description: "Check oracle" },
        [dcard({ cmc: 99 })],
        null,
        null
      ).valid
    ).toBe(true);
  });

  it("returns valid for singleton type", () => {
    expect(
      validateCompanionCondition(
        { type: "singleton", comment: "Test" },
        [dcard({ name: "A" }), dcard({ name: "B" })],
        null,
        null
      ).valid
    ).toBe(true);
  });

  it("enforces mono_color on multicolor identity", () => {
    const bad = validateCompanionCondition(
      { type: "mono_color", color: "W" },
      [dcard({ name: "Gold", colorIdentity: ["W", "U"] })],
      null,
      null
    );
    expect(bad.valid).toBe(false);
    expect(bad.reason).toContain("multicolor");

    const ok = validateCompanionCondition(
      { type: "mono_color", color: "W" },
      [dcard({ name: "Plain", colorIdentity: ["W"] })],
      null,
      null
    );
    expect(ok.valid).toBe(true);
  });

  it("enforces nonland_maximum", () => {
    const cards = [
      dcard({ id: "1", name: "A", typeLine: "Creature", cmc: 1 }),
      dcard({ id: "2", name: "B", typeLine: "Creature", cmc: 1 }),
    ];
    expect(
      validateCompanionCondition({ type: "nonland_maximum", value: 1 }, cards, null, null).valid
    ).toBe(false);
    expect(
      validateCompanionCondition({ type: "nonland_maximum", value: 2 }, cards, null, null).valid
    ).toBe(true);
  });

  it("includes commander and partner in max_cmc pool", () => {
    const cmd = dcard({ id: "c", name: "Big Cmd", cmc: 6, category: "commander" });
    const prt = dcard({ id: "p", name: "Partner", cmc: 3, category: "creature" });
    const result = validateCompanionCondition(
      { type: "max_cmc", value: 2 },
      [],
      cmd,
      prt
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Big Cmd");
  });

  it("truncates max_cmc violator list after three names", () => {
    const deckCards = [
      dcard({ id: "a", name: "V1", cmc: 5 }),
      dcard({ id: "b", name: "V2", cmc: 5 }),
      dcard({ id: "c", name: "V3", cmc: 5 }),
      dcard({ id: "d", name: "V4", cmc: 5 }),
    ];
    const result = validateCompanionCondition({ type: "max_cmc", value: 2 }, deckCards, null, null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("…");
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

  it("covers all condition kinds", () => {
    expect(describeCompanionCondition({ type: "none" })).toContain("restriction");
    expect(describeCompanionCondition({ type: "even_cmc" })).toContain("even");
    expect(describeCompanionCondition({ type: "mono_color", color: "R" })).toContain("one color");
    expect(describeCompanionCondition({ type: "nonland_maximum", value: 5 })).toContain("5");
    expect(describeCompanionCondition({ type: "singleton", comment: "Only one" })).toBe("Only one");
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

  it("returns empty warnings when there is no companion", () => {
    expect(getCompanionDeckWarnings(baseDeck())).toEqual([]);
  });

  it("adds Lurrus mechanical warning when commander exceeds CMC 2", () => {
    const deck = baseDeck();
    deck.commander = dcard({
      id: "cmd",
      name: "Kenrith",
      colorIdentity: ["W", "U", "B", "R", "G"],
      category: "commander",
      cmc: 5,
    });
    deck.companion = dcard({
      name: "Lurrus of the Dream-Den",
      category: "companion",
      colorIdentity: ["W", "B"],
      oracleText: "",
    });
    const w = getCompanionDeckWarnings(deck);
    expect(w.some((x) => x.includes("≤ 2") || x.includes("mana value"))).toBe(true);
  });

  it("does not count maybeboard cards toward Lurrus CMC check", () => {
    const deck = baseDeck();
    deck.commander = dcard({
      id: "cmd",
      name: "Isamaru",
      colorIdentity: ["W"],
      category: "commander",
      cmc: 1,
    });
    deck.companion = dcard({
      name: "Lurrus of the Dream-Den",
      category: "companion",
      colorIdentity: ["W", "B"],
      oracleText: "",
    });
    deck.cards = [
      dcard({ name: "Bolt", cmc: 1, zone: "main" }),
      dcard({ name: "Expensive Side", cmc: 10, zone: "maybeboard" }),
    ];
    const w = getCompanionDeckWarnings(deck);
    expect(w.some((x) => x.includes("mana value"))).toBe(false);
  });

  it("merges Lutri ban with color warning when both apply", () => {
    const deck = baseDeck();
    deck.commander = dcard({
      id: "cmd",
      name: "Isamaru",
      colorIdentity: ["W"],
      category: "commander",
      cmc: 1,
    });
    deck.companion = dcard({
      name: LUTRI_SPELLCHASER_NAME,
      category: "companion",
      colorIdentity: ["U", "R"],
    });
    const w = getCompanionDeckWarnings(deck);
    expect(w.length).toBeGreaterThanOrEqual(2);
    expect(w.some((x) => x.includes("banned"))).toBe(true);
    expect(w.some((x) => x.includes("identity"))).toBe(true);
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

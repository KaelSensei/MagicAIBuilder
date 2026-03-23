import { describe, it, expect } from "vitest";
import { detectThemes } from "@/lib/deck/themes";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: crypto.randomUUID(),
    name: "Test Card",
    manaCost: "{2}",
    cmc: 2,
    typeLine: "Creature — Human Wizard",
    oracleText: "",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main" as const,
    ...overrides,
  };
}

describe("detectThemes", () => {
  it("returns empty array for empty deck", () => {
    const themes = detectThemes([]);
    expect(themes).toEqual([]);
  });

  it("detects Token theme from oracle text", () => {
    const cards = [
      makeCard({ name: "Rhys the Redeemed", oracleText: "create a 1/1 token creature" }),
      makeCard({ name: "Populate Sorcery", oracleText: "populate, then create a token" }),
      makeCard({ name: "Anointed Procession", oracleText: "if you would create a token" }),
      makeCard({ name: "Raise the Alarm", oracleText: "create two 1/1 token creatures" }),
      makeCard({ name: "Secure the Wastes", oracleText: "create X 1/1 warrior token" }),
    ];
    const themes = detectThemes(cards);
    const tokenTheme = themes.find((t) => t.name === "Tokens");
    expect(tokenTheme).toBeDefined();
    expect(tokenTheme!.confidence).toBeGreaterThan(0.05);
  });

  it("detects Combo theme from oracle text", () => {
    const cards = [
      makeCard({ name: "Isochron Scepter", oracleText: "copy target instant or sorcery" }),
      makeCard({ name: "Dramatic Reversal", oracleText: "untap target nonland permanent" }),
      makeCard({ name: "Underworld Breach", oracleText: "search your library for a card" }),
      makeCard({ name: "Brain Freeze", oracleText: "storm — copy this spell" }),
      makeCard({ name: "Thassa's Oracle", oracleText: "win the game if devotion" }),
    ];
    const themes = detectThemes(cards);
    const comboTheme = themes.find((t) => t.name === "Combo");
    expect(comboTheme).toBeDefined();
    expect(comboTheme!.confidence).toBeGreaterThan(0.05);
  });

  it("detects Sacrifice theme", () => {
    const cards = Array.from({ length: 8 }, (_, i) =>
      makeCard({
        name: `Sac Card ${i}`,
        oracleText: "sacrifice a creature to draw a card",
      })
    );
    const themes = detectThemes(cards);
    const sacTheme = themes.find((t) => t.name === "Sacrifice");
    expect(sacTheme).toBeDefined();
  });

  it("detects Equipment theme from type line", () => {
    const cards = [
      makeCard({ name: "Sword of Fire and Ice", typeLine: "Artifact — Equipment", oracleText: "equip {2}" }),
      makeCard({ name: "Lightning Greaves", typeLine: "Artifact — Equipment", oracleText: "equip {0}" }),
      makeCard({ name: "Swiftfoot Boots", typeLine: "Artifact — Equipment", oracleText: "equip {1}" }),
      makeCard({ name: "Reyav Guide", oracleText: "whenever equipped creature attacks" }),
    ];
    const themes = detectThemes(cards);
    const eqTheme = themes.find((t) => t.name === "Equipment");
    expect(eqTheme).toBeDefined();
  });

  it("detects +1/+1 Counters theme", () => {
    const cards = Array.from({ length: 6 }, (_, i) =>
      makeCard({
        name: `Counter Card ${i}`,
        oracleText: "put a +1/+1 counter on target creature",
      })
    );
    const themes = detectThemes(cards);
    const counterTheme = themes.find((t) => t.name === "+1/+1 Counters");
    expect(counterTheme).toBeDefined();
  });

  it("returns themes sorted by confidence descending", () => {
    // Many token cards, few reanimator cards → tokens should rank higher
    const cards = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeCard({ name: `Token${i}`, oracleText: "create a 1/1 creature token" })
      ),
      makeCard({ name: "Reanimate", oracleText: "return target creature card from your graveyard" }),
    ];
    const themes = detectThemes(cards);
    if (themes.length >= 2) {
      expect(themes[0].confidence).toBeGreaterThanOrEqual(themes[1].confidence);
    }
  });

  it("confidence is between 0 and 1", () => {
    const cards = Array.from({ length: 20 }, (_, i) =>
      makeCard({ name: `Card${i}`, oracleText: "create a 1/1 creature token" })
    );
    const themes = detectThemes(cards);
    for (const theme of themes) {
      expect(theme.confidence).toBeGreaterThanOrEqual(0);
      expect(theme.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("detects Wheels theme", () => {
    const cards = [
      makeCard({ name: "Wheel of Fortune", oracleText: "each player discards their hand, then draws seven cards" }),
      makeCard({ name: "Windfall", oracleText: "each player discards their hand, then draws cards equal to" }),
      makeCard({ name: "Jace's Archivist", oracleText: "each player draws cards equal to" }),
    ];
    const themes = detectThemes(cards);
    const wheelsTheme = themes.find((t) => t.name === "Wheels");
    expect(wheelsTheme).toBeDefined();
  });
});

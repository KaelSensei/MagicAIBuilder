// Theme/archetype detection for EDH decks
import type { DeckCard } from "./types";

export type ThemeName =
  | "Tokens"
  | "Sacrifice"
  | "Reanimator"
  | "Voltron"
  | "Stax"
  | "Combo"
  | "Control"
  | "Aggro"
  | "Spellslinger"
  | "Landfall"
  | "Tribal"
  | "+1/+1 Counters"
  | "Blink/ETB"
  | "Wheels"
  | "Aristocrats"
  | "Equipment"
  | "Treasure";

export interface DetectedTheme {
  name: ThemeName;
  confidence: number; // 0-1
  matchedKeywords: string[];
}

type ThemeRule = {
  keywords: string[];
  typeKeywords?: string[];
  weight?: number;
};

const THEME_RULES: Record<ThemeName, ThemeRule> = {
  Tokens: {
    keywords: [
      "create",
      "token",
      "populate",
      "convoke",
      "tribute",
      "creature token",
      "put a",
      "token creature",
    ],
    typeKeywords: [],
  },
  Sacrifice: {
    keywords: [
      "sacrifice",
      "sac a",
      "whenever you sacrifice",
      "sacrifice another",
      "pay life",
      "death trigger",
    ],
    typeKeywords: [],
  },
  Reanimator: {
    keywords: [
      "return target creature card from your graveyard",
      "return from your graveyard",
      "reanimate",
      "put onto the battlefield from your graveyard",
      "mill",
      "self-mill",
      "discard a card",
    ],
    typeKeywords: [],
  },
  Voltron: {
    keywords: [
      "attach",
      "equipped creature",
      "enchanted creature",
      "aura",
      "auras",
      "commander damage",
      "double strike",
      "hexproof",
    ],
    typeKeywords: ["equipment", "aura"],
  },
  Stax: {
    keywords: [
      "opponents can't",
      "players can't",
      "each opponent",
      "tax",
      "whenever an opponent",
      "slows",
      "untap only",
      "skip your",
      "they don't untap",
    ],
    typeKeywords: [],
  },
  Combo: {
    keywords: [
      "infinite",
      "win the game",
      "search your library",
      "storm",
      "copy",
      "untap target",
      "exile from hand",
      "each time",
    ],
    typeKeywords: [],
  },
  Control: {
    keywords: [
      "counter target",
      "counterspell",
      "draw a card",
      "counter spell",
      "return target",
      "exile target",
      "negate",
      "deny",
    ],
    typeKeywords: ["instant", "sorcery"],
  },
  Aggro: {
    keywords: [
      "haste",
      "first strike",
      "double strike",
      "trample",
      "attack each combat",
      "whenever this creature attacks",
      "combat damage",
    ],
    typeKeywords: [],
  },
  Spellslinger: {
    keywords: [
      "whenever you cast an instant",
      "whenever you cast a sorcery",
      "whenever you cast a spell",
      "magecraft",
      "spell mastery",
      "copy target instant",
      "prowess",
    ],
    typeKeywords: ["instant", "sorcery"],
  },
  Landfall: {
    keywords: [
      "landfall",
      "whenever a land",
      "land enters",
      "whenever you play a land",
      "fetch",
    ],
    typeKeywords: [],
  },
  Tribal: {
    keywords: [
      "elf",
      "goblin",
      "zombie",
      "dragon",
      "merfolk",
      "soldier",
      "vampire",
      "wizard",
      "dwarf",
      "angel",
      "shapeshifter",
    ],
    typeKeywords: [
      "elf",
      "goblin",
      "zombie",
      "dragon",
      "merfolk",
      "soldier",
      "vampire",
      "wizard",
      "dwarf",
      "angel",
    ],
  },
  "+1/+1 Counters": {
    keywords: [
      "+1/+1 counter",
      "proliferate",
      "put a counter",
      "evolve",
      "bolster",
      "reinforce",
      "modular",
      "graft",
      "undying",
      "persist",
    ],
    typeKeywords: [],
  },
  "Blink/ETB": {
    keywords: [
      "enters the battlefield",
      "blink",
      "flicker",
      "exile and return",
      "return it to the battlefield",
      "when this creature enters",
      "whenever a creature enters",
    ],
    typeKeywords: [],
  },
  Wheels: {
    keywords: [
      "each player draws",
      "each player discards",
      "wheel",
      "draw seven",
      "draw cards equal to",
      "discard your hand",
    ],
    typeKeywords: [],
  },
  Aristocrats: {
    keywords: [
      "whenever a creature dies",
      "whenever a nontoken creature dies",
      "sacrifice a creature",
      "drain",
      "lose life",
      "gain life",
      "death trigger",
      "blood artist",
    ],
    typeKeywords: [],
  },
  Equipment: {
    keywords: [
      "equip",
      "equipped creature",
      "attach to target creature",
      "whenever equipped creature",
      "living weapon",
    ],
    typeKeywords: ["equipment"],
  },
  Treasure: {
    keywords: [
      "treasure token",
      "create a treasure",
      "sacrifice a treasure",
      "gold token",
      "create a gold",
    ],
    typeKeywords: [],
  },
};

/** Detect themes from a list of deck cards */
export function detectThemes(cards: DeckCard[]): DetectedTheme[] {
  const results: DetectedTheme[] = [];

  for (const [themeName, rule] of Object.entries(THEME_RULES) as [
    ThemeName,
    ThemeRule,
  ][]) {
    const matchedKeywords = new Set<string>();
    let hits = 0;

    for (const card of cards) {
      const oracleText = card.oracleText.toLowerCase();
      const typeLine = card.typeLine.toLowerCase();

      for (const kw of rule.keywords) {
        if (oracleText.includes(kw.toLowerCase())) {
          matchedKeywords.add(kw);
          hits += rule.weight ?? 1;
          break; // Count card once per theme, not per keyword
        }
      }

      for (const typeKw of rule.typeKeywords ?? []) {
        if (typeLine.includes(typeKw.toLowerCase())) {
          matchedKeywords.add(typeKw);
          hits += (rule.weight ?? 1) * 0.5;
          break;
        }
      }
    }

    // Confidence: scale hits vs deck size
    const deckSize = Math.max(cards.length, 1);
    // Normalize: themes usually need 5-20 cards to be strong
    const rawConf = hits / deckSize;
    // Scale so that ~10 matching cards in a 99-card deck ≈ 1.0
    const confidence = Math.min(1, rawConf * (deckSize / 10));

    if (confidence >= 0.05) {
      results.push({
        name: themeName,
        confidence: Math.round(confidence * 100) / 100,
        matchedKeywords: Array.from(matchedKeywords),
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

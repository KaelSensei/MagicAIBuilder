// Bracket definitions and thresholds for Commander
export type BracketLevel = 1 | 2 | 3 | 4;

export interface BracketDefinition {
  level: BracketLevel;
  name: string;
  description: string;
  color: string;
  cssVar: string;
  maxGameChangers: number;
  allowsTutors: boolean;
}

export const BRACKET_DEFINITIONS: Record<BracketLevel, BracketDefinition> = {
  1: {
    level: 1,
    name: "Casual",
    description:
      "Pre-cons and casual home brews. No game changers, basic strategies.",
    color: "#22c55e",
    cssVar: "var(--bracket-1)",
    maxGameChangers: 0,
    allowsTutors: false,
  },
  2: {
    level: 2,
    name: "Core",
    description:
      "Improved pre-cons and focused brews. Limited game changers allowed.",
    color: "#3b82f6",
    cssVar: "var(--bracket-2)",
    maxGameChangers: 2,
    allowsTutors: true,
  },
  3: {
    level: 3,
    name: "Upgraded",
    description:
      "Optimized decks with synergies and efficient game plans. Game changers present.",
    color: "#f59e0b",
    cssVar: "var(--bracket-3)",
    maxGameChangers: 4,
    allowsTutors: true,
  },
  4: {
    level: 4,
    name: "Optimized",
    description:
      "Fully optimized decks approaching cEDH. Many game changers, fast win conditions.",
    color: "#ef4444",
    cssVar: "var(--bracket-4)",
    maxGameChangers: Infinity,
    allowsTutors: true,
  },
};

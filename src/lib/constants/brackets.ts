/**
 * The official Commander Brackets (Wizards of the Coast, still in beta).
 *
 * Rules state: Wizards' bracket text of 2025-10-21 and the Commander Format
 * Panel graphic that article links. The 2026-02-09 update changed no bracket
 * rule, and no later announcement had changed them on 2026-11-09. Since
 * 2025-10-21 no bracket restricts tutors: Wizards relies on the Game Changers
 * list to catch the most efficient ones.
 *
 * Sources:
 * - https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
 * - https://bsky.app/profile/wachelreeks.com/post/3m3ptspaivs27 (the graphic, linked from the article)
 * - https://magic.wizards.com/en/formats/commander (Game Changer counts per bracket)
 * - docs/product/guides/commander-deckbuilding-by-bracket.md, "The official table"
 *
 * @module constants/brackets
 */

/** The official bracket levels, from 1 (Exhibition) to 5 (cEDH). */
export const BRACKET_LEVELS = [1, 2, 3, 4, 5] as const;

/** One official Commander bracket. */
export type BracketLevel = (typeof BRACKET_LEVELS)[number];

/** A deck-building restriction the official table sets per bracket. */
export type BracketRestriction =
  "gameChangers" | "massLandDenial" | "extraTurns" | "twoCardCombos";

/** Mass land denial: forbidden, or not restricted. */
export type MassLandDenialRule = "none" | "unrestricted";

/** Extra turns: forbidden, allowed but never chained, or not restricted. */
export type ExtraTurnRule = "none" | "noChaining" | "unrestricted";

/**
 * Two-card combos ("game-enders, lockouts or infinites"): forbidden, allowed
 * only when they cannot come up before a given turn, or not restricted.
 */
export type TwoCardComboRule =
  | { readonly kind: "none" }
  | { readonly kind: "notBeforeTurn"; readonly turn: number }
  | { readonly kind: "unrestricted" };

/** One row of the official bracket table. */
export interface BracketDefinition {
  readonly level: BracketLevel;
  /** Official English name. The UI reads the localized name from `deck.bracket.name.<level>`. */
  readonly name: string;
  /** What players expect at this bracket, in English, from the official "Players expect" text. */
  readonly intent: string;
  readonly color: string;
  readonly cssVar: string;
  /** Most Game Changers a deck may run; `Infinity` when unlimited. */
  readonly maxGameChangers: number;
  readonly massLandDenial: MassLandDenialRule;
  readonly extraTurns: ExtraTurnRule;
  readonly twoCardCombos: TwoCardComboRule;
  /** Restrictions a highly thematic card may break, by agreement at the table. */
  readonly thematicExceptions: readonly BracketRestriction[];
  /** Turns players expect to play before anyone wins or loses; `null` when a game can end on any turn. */
  readonly minTurns: number | null;
}

/** The official bracket table, keyed by level. */
export const BRACKET_DEFINITIONS: Readonly<
  Record<BracketLevel, BracketDefinition>
> = {
  1: {
    level: 1,
    name: "Exhibition",
    intent: "a goal, theme or idea over power",
    color: "#22c55e",
    cssVar: "var(--bracket-1)",
    maxGameChangers: 0,
    massLandDenial: "none",
    extraTurns: "none",
    twoCardCombos: { kind: "none" },
    thematicExceptions: ["gameChangers", "extraTurns", "twoCardCombos"],
    minTurns: 9,
  },
  2: {
    level: 2,
    name: "Core",
    intent: "unoptimized and straightforward",
    color: "#3b82f6",
    cssVar: "var(--bracket-2)",
    maxGameChangers: 0,
    massLandDenial: "none",
    extraTurns: "noChaining",
    twoCardCombos: { kind: "none" },
    thematicExceptions: [],
    minTurns: 8,
  },
  3: {
    level: 3,
    name: "Upgraded",
    intent: "strong synergy and high card quality",
    color: "#f59e0b",
    cssVar: "var(--bracket-3)",
    maxGameChangers: 3,
    massLandDenial: "none",
    extraTurns: "noChaining",
    twoCardCombos: { kind: "notBeforeTurn", turn: 6 },
    thematicExceptions: [],
    minTurns: 6,
  },
  4: {
    level: 4,
    name: "Optimized",
    intent: "lethal, consistent and fast, but not built for the cEDH metagame",
    color: "#ef4444",
    cssVar: "var(--bracket-4)",
    maxGameChangers: Infinity,
    massLandDenial: "unrestricted",
    extraTurns: "unrestricted",
    twoCardCombos: { kind: "unrestricted" },
    thematicExceptions: [],
    minTurns: 4,
  },
  5: {
    level: 5,
    name: "cEDH",
    intent:
      "built for the cEDH metagame, optimized for efficiency and consistency",
    color: "#d946ef",
    cssVar: "var(--bracket-5)",
    maxGameChangers: Infinity,
    massLandDenial: "unrestricted",
    extraTurns: "unrestricted",
    twoCardCombos: { kind: "unrestricted" },
    thematicExceptions: [],
    minTurns: null,
  },
};

/**
 * Reads a stored or requested bracket number.
 *
 * @param value - a bracket as stored in the database or sent by a client
 * @returns the official bracket, or null when the value is not one
 */
export function parseBracketLevel(
  value: number | null | undefined
): BracketLevel | null {
  return BRACKET_LEVELS.find((level) => level === value) ?? null;
}

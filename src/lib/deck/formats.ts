/**
 * Format configuration — single source of truth for all format-specific rules.
 *
 * Every layer (types, validation, search, UI) reads from this config
 * instead of hardcoding format assumptions.
 */

/** Supported MTG deck formats */
export type DeckFormat =
  | "commander"
  | "brawl"
  | "oathbreaker"
  | "standard"
  | "pioneer"
  | "modern"
  | "legacy"
  | "vintage"
  | "pauper";

/**
 * The life total each player starts the game on, by table size: a two-player game, or a
 * multiplayer game, one that begins with more than two players (CR 800.1).
 *
 * The two differ only in Brawl. CR 903.12f (also 103.4d): "In a two-player Brawl game, each
 * player's starting life total is 25. In a multiplayer Brawl game, each player's starting life
 * total is 30." Commander is 40 at any table (CR 103.4c, 903.7); the base game is 20 (CR 103.4).
 */
export interface StartingLife {
  readonly twoPlayer: number;
  readonly multiplayer: number;
}

/** Per-format configuration */
export interface FormatConfig {
  /** Display name (e.g., "Commander", "Standard") */
  readonly label: string;
  /** Scryfall legality key used in `legal:{key}` queries */
  readonly scryfallLegality: string;
  /** Required main deck size */
  readonly deckSize: number;
  /** Maximum sideboard size (0 = no sideboard) */
  readonly sideboardSize: number;
  /** Whether the format uses singleton rule */
  readonly isSingleton: boolean;
  /** Whether the deck has a commander/oathbreaker slot */
  readonly hasCommander: boolean;
  /** Whether bracket scoring (1-4) applies */
  readonly hasBracketScoring: boolean;
  /** Whether color identity restriction applies */
  readonly hasColorIdentity: boolean;
  /** Default max copies per non-basic card */
  readonly maxCopiesPerCard: number;
  /** Recommended land count for deck building hints */
  readonly recommendedLands: readonly [number, number];
  /** Life total each player starts the game on, for each table size */
  readonly startingLife: StartingLife;
  /**
   * Whether the first mulligan is free: it does not count toward the cards put
   * on the bottom (CR 103.5c). True for Brawl and for the formats played
   * multiplayer by default; false for the constructed duel formats. The
   * playtest uses it as the default of the player's per-session multiplayer
   * choice (`lib/playtest/free-mulligan.ts`).
   */
  readonly firstMulliganFree: boolean;
  /**
   * Whether format-specific deck statistics (curve, threat density,
   * interaction ratio) apply. False for Commander, which uses bracket scoring.
   */
  readonly hasFormatStats: boolean;
  /** Healthy average mana value band, excluding lands */
  readonly avgCmcTarget: readonly [number, number];
  /** Healthy share of non-land cards that pressure the opponent */
  readonly threatDensityTarget: readonly [number, number];
  /** Healthy share of non-land cards that answer the opponent */
  readonly interactionRatioTarget: readonly [number, number];
}

/** All format configs keyed by DeckFormat */
export const FORMAT_CONFIG: Readonly<Record<DeckFormat, FormatConfig>> = {
  commander: {
    label: "Commander",
    scryfallLegality: "commander",
    deckSize: 100,
    sideboardSize: 0,
    isSingleton: true,
    hasCommander: true,
    hasBracketScoring: true,
    hasColorIdentity: true,
    maxCopiesPerCard: 1,
    recommendedLands: [33, 38],
    startingLife: { twoPlayer: 40, multiplayer: 40 },
    firstMulliganFree: true,
    hasFormatStats: false,
    avgCmcTarget: [2.8, 3.6],
    threatDensityTarget: [0.25, 0.45],
    interactionRatioTarget: [0.15, 0.3],
  },
  brawl: {
    label: "Brawl",
    scryfallLegality: "brawl",
    deckSize: 60,
    sideboardSize: 0,
    isSingleton: true,
    hasCommander: true,
    hasBracketScoring: false,
    hasColorIdentity: true,
    maxCopiesPerCard: 1,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 25, multiplayer: 30 },
    firstMulliganFree: true,
    hasFormatStats: true,
    avgCmcTarget: [2.5, 3.4],
    threatDensityTarget: [0.3, 0.5],
    interactionRatioTarget: [0.15, 0.3],
  },
  oathbreaker: {
    label: "Oathbreaker",
    scryfallLegality: "oathbreaker",
    deckSize: 60,
    sideboardSize: 0,
    isSingleton: true,
    hasCommander: true,
    hasBracketScoring: false,
    hasColorIdentity: true,
    maxCopiesPerCard: 1,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: true,
    hasFormatStats: true,
    avgCmcTarget: [2.2, 3.2],
    threatDensityTarget: [0.3, 0.5],
    interactionRatioTarget: [0.15, 0.3],
  },
  standard: {
    label: "Standard",
    scryfallLegality: "standard",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [2, 3.2],
    threatDensityTarget: [0.3, 0.55],
    interactionRatioTarget: [0.15, 0.35],
  },
  pioneer: {
    label: "Pioneer",
    scryfallLegality: "pioneer",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [1.9, 3],
    threatDensityTarget: [0.3, 0.55],
    interactionRatioTarget: [0.15, 0.35],
  },
  modern: {
    label: "Modern",
    scryfallLegality: "modern",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [1.7, 2.8],
    threatDensityTarget: [0.3, 0.55],
    interactionRatioTarget: [0.15, 0.35],
  },
  legacy: {
    label: "Legacy",
    scryfallLegality: "legacy",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [1.4, 2.5],
    threatDensityTarget: [0.25, 0.5],
    interactionRatioTarget: [0.2, 0.4],
  },
  vintage: {
    label: "Vintage",
    scryfallLegality: "vintage",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [1.3, 2.4],
    threatDensityTarget: [0.25, 0.5],
    interactionRatioTarget: [0.2, 0.4],
  },
  pauper: {
    label: "Pauper",
    scryfallLegality: "pauper",
    deckSize: 60,
    sideboardSize: 15,
    isSingleton: false,
    hasCommander: false,
    hasBracketScoring: false,
    hasColorIdentity: false,
    maxCopiesPerCard: 4,
    recommendedLands: [22, 26],
    startingLife: { twoPlayer: 20, multiplayer: 20 },
    firstMulliganFree: false,
    hasFormatStats: true,
    avgCmcTarget: [1.6, 2.6],
    threatDensityTarget: [0.3, 0.55],
    interactionRatioTarget: [0.15, 0.35],
  },
};

/** All supported formats as a tuple (for Zod validation) */
export const ALL_FORMATS = [
  "commander", "brawl", "oathbreaker",
  "standard", "pioneer", "modern",
  "legacy", "vintage", "pauper",
] as const;

/**
 * Whether a stored format string names a format this build supports.
 * @param value - Format string from the database or a request
 * @returns True when `value` is one of ALL_FORMATS
 */
export function isDeckFormat(value: string): value is DeckFormat {
  return ALL_FORMATS.some((format) => format === value);
}

/** Format options for UI dropdowns */
export const FORMAT_OPTIONS: readonly { readonly value: DeckFormat; readonly label: string }[] =
  ALL_FORMATS.map((f) => ({ value: f, label: FORMAT_CONFIG[f].label }));

/**
 * Get format config with safe fallback to Commander for unknown strings.
 * @param format - Format string from DB or user input
 * @returns FormatConfig for the given format, or Commander config as fallback
 */
export function getFormatConfig(format: string): FormatConfig {
  if (format in FORMAT_CONFIG) {
    return FORMAT_CONFIG[format as DeckFormat];
  }
  return FORMAT_CONFIG.commander;
}

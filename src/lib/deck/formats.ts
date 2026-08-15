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
  /** Life total each player starts the game on */
  readonly startingLife: number;
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
    startingLife: 40,
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
    startingLife: 30,
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
    startingLife: 20,
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
    startingLife: 20,
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
    startingLife: 20,
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
    startingLife: 20,
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
    startingLife: 20,
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
    startingLife: 20,
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
    startingLife: 20,
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

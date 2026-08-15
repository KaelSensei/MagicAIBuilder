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

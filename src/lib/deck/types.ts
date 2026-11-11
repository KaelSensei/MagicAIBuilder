import type { DeckFormat } from "./formats";
import type { BracketLevel } from "@/lib/constants/brackets";
// Core deck and card types for MagicAIBuilder
export type CardCategory =
  | "commander"
  | "companion"
  | "creature"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "planeswalker"
  | "land"
  | "ramp"
  | "draw"
  | "removal"
  | "boardWipe"
  | "winCondition"
  | "protection"
  | "other";
export type DeckZone = "main" | "sideboard" | "maybeboard";
export type { BracketLevel };
export interface CardFace {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  imageUri: string;
  artCropUri: string;
}
export interface DeckCard {
  id: string;
  scryfallId?: string;
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[];
  isGameChanger: boolean;
  isBanned: boolean;
  price: number | null;
  imageUri: string;
  artCropUri: string;
  category: CardCategory;
  /** Scryfall power (creatures only). Stored for proxy text-only printing. */
  power?: string | null;
  /** Scryfall toughness (creatures only). Stored for proxy text-only printing. */
  toughness?: string | null;
  quantity: number;
  notes?: string | null;
  zone: DeckZone;
  isMaybeboard?: boolean;
  layout?: string;
  cardFaces?: [CardFace, CardFace];
  isFlexibleLand?: boolean;
}
/** How a deck's second commander is allowed, one value per partner ability (CR 702.124). */
export type CommanderPairingType =
  | "none"
  | "partner"
  | "partner_with"
  | "friends_forever"
  | "background"
  | "doctor"
  | "character_select"
  | "father_son"
  | "survivors";
export interface Deck {
  id: string;
  name: string;
  folderId?: string | null;
  commander: DeckCard | null;
  partner: DeckCard | null;
  companion: DeckCard | null;
  pairingType: CommanderPairingType;
  cards: DeckCard[];
  /** Derived mirror of cards whose persisted zone is "maybeboard". */
  maybeboard: DeckCard[];
  format: DeckFormat;
  /** Total card count (including commander/partner/companion). Set from _count on listing, derived from cards on full load. */
  cardCount: number;
  targetBracket: BracketLevel;
  manualBracket: BracketLevel | null;
  budget: number | null;
  description: string;
  tags: string[];
  shareToken: string | null;
  shareEnabled: boolean;
  isPublic: boolean;
  isAIGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  seekingFeedback?: boolean;
  feedbackQuestion?: string | null;
}
export interface DeckStats {
  totalCards: number;
  lands: number;
  creatures: number;
  ramp: number;
  draw: number;
  removal: number;
  boardWipes: number;
  avgCmc: number;
  manaCurve: Record<number, number>;
  colorDistribution: Record<string, number>;
  gameChangersCount: number;
  gameChangersList: string[];
  totalPrice: number;
  overBudgetCards: string[];
  bannedCards: string[];
  colorIdentityViolations: string[];
  /** Main-deck cards whose rules text cannot work with this commander (deterministic rules check) */
  commanderRuleIssues: readonly import("./commander-rules-check").CommanderRuleIssue[];
  themes?: import("./themes").DetectedTheme[];
  flexibleLands: number;
  /** Curve / threat / interaction measures; null for Commander (bracket scoring instead) */
  formatStats: import("./format-stats").FormatStats | null;
  /** Pips asked for vs. sources produced; null when no spell needs coloured mana */
  manaAlignment: import("./mana-alignment").ManaAlignment | null;
  /** Odds the opening hand can act on turn one; null when the deck has no one-drops */
  turnOnePlayability: import("./turn-one").TurnOnePlayability | null;
}
export interface BracketScore {
  /** Estimated bracket, 1 to 4: the cEDH metagame that sets Bracket 5 apart is not visible in a list. */
  overall: BracketLevel;
  /**
   * Power signals, each scored 1–4. Tutors are not one: Wizards removed the
   * tutor restriction on 2025-10-21 and lets the Game Changers list catch them.
   */
  dimensions: {
    ramp: number;
    draw: number;
    removal: number;
    winSpeed: number;
    avgCmc: number;
  };
  gameChangers: number;
  twoCardInfiniteCombos: number;
  warnings: string[];
}

// Playtest state lives in PlaytestEngine (src/lib/playtest/engine.ts), which
// also tracks phases, life, and the battlefield / graveyard / exile zones.

export type ViewMode = "grid" | "list";
export type ColorMode = "or" | "and" | "exact";
export type CmcMode = "range" | "exact" | "min" | "max";
export type InteractionType =
  "removal" | "counterspell" | "wipe" | "tutor" | "draw" | "ramp";

export interface SearchFilters {
  colors: string[];
  colorMode?: ColorMode;
  colorlessFilter?: boolean;
  landFilter?: boolean;
  types: string[];
  cmcMin: number | null;
  cmcMax: number | null;
  cmcMode?: CmcMode;
  cmcExact: number | null;
  priceMin: number | null;
  priceMax: number | null;
  powerMin: number | null;
  powerMax: number | null;
  toughnessMin: number | null;
  toughnessMax: number | null;
  subtype: string;
  keyword: string;
  interactionType: InteractionType | null;
  /**
   * List only cards whose Oracle card the player owns, in any printing. Applied in the browser
   * by `useCardSearchResults`; it adds nothing to the Scryfall query.
   */
  collectionOnly?: boolean;
}

export interface CardFace {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  imageUri: string;
  artCropUri: string;
}

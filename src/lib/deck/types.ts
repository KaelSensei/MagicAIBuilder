import type { DeckFormat } from "./formats";
// Core deck and card types for MagicAIBuilder
export type CardCategory = | "commander" | "companion" | "creature" | "instant" | "sorcery" | "artifact" | "enchantment" | "planeswalker" | "land" | "ramp" | "draw" | "removal" | "boardWipe" | "winCondition" | "protection" | "other";
export type DeckZone = "main" | "sideboard" | "maybeboard";
export type BracketLevel = 1 | 2 | 3 | 4;
export interface CardFace { name: string; manaCost: string; typeLine: string; oracleText: string; imageUri: string; artCropUri: string; }
export interface DeckCard {
  id: string; scryfallId?: string; name: string; manaCost: string; cmc: number;
  typeLine: string; oracleText: string; colorIdentity: string[];
  isGameChanger: boolean; isBanned: boolean; price: number | null;
  imageUri: string; artCropUri: string; category: CardCategory;
  /** Scryfall power (creatures only). Stored for proxy text-only printing. */
  power?: string | null;
  /** Scryfall toughness (creatures only). Stored for proxy text-only printing. */
  toughness?: string | null;
  quantity: number; notes?: string | null; zone: DeckZone;
  isMaybeboard?: boolean; layout?: string; cardFaces?: [CardFace, CardFace]; isFlexibleLand?: boolean;
}
export type CommanderPairingType = | "none" | "partner" | "partner_with" | "friends_forever" | "background" | "doctor" | "character_select";
export interface Deck {
  id: string; name: string; commander: DeckCard | null; partner: DeckCard | null;
  companion: DeckCard | null; pairingType: CommanderPairingType;
  cards: DeckCard[]; maybeboard: DeckCard[]; format: DeckFormat;
  /** Total card count (including commander/partner/companion). Set from _count on listing, derived from cards on full load. */
  cardCount: number;
  targetBracket: 1|2|3|4; manualBracket: 1|2|3|4|null; budget: number | null;
  description: string; tags: string[]; shareToken: string | null;
  shareEnabled: boolean; isPublic: boolean; isAIGenerated: boolean; createdAt: Date; updatedAt: Date;
}
export interface DeckStats {
  totalCards: number; lands: number; creatures: number; ramp: number; draw: number;
  removal: number; boardWipes: number; avgCmc: number;
  manaCurve: Record<number, number>; colorDistribution: Record<string, number>;
  gameChangersCount: number; gameChangersList: string[]; totalPrice: number;
  overBudgetCards: string[]; bannedCards: string[]; colorIdentityViolations: string[];
  themes?: import("./themes").DetectedTheme[];
  flexibleLands: number;
  /** Curve / threat / interaction measures; null for Commander (bracket scoring instead) */
  formatStats: import("./format-stats").FormatStats | null;
  /** Pips asked for vs. sources produced; null when no spell needs coloured mana */
  manaAlignment: import("./mana-alignment").ManaAlignment | null;
}
export interface BracketScore {
  overall: 1|2|3|4;
  dimensions: { ramp: number; draw: number; removal: number; tutors: number; winSpeed: number; avgCmc: number };
  gameChangers: number; twoCardInfiniteCombos: number; warnings: string[];
}

// Playtest state lives in PlaytestEngine (src/lib/playtest/engine.ts), which
// also tracks phases, life, and the battlefield / graveyard / exile zones.

export type ViewMode = "grid" | "list";
export type ColorMode = "or" | "and" | "exact";
export type CmcMode = "range" | "exact" | "min" | "max";
export type InteractionType = "removal" | "counterspell" | "wipe" | "tutor" | "draw" | "ramp";

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

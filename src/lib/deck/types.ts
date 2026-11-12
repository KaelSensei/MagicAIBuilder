/**
 * Core deck and card types: the deck, its cards, zones and categories, and the card search filters.
 *
 * Context: deck building; most of the app imports this file. It must not import analysis or
 * playtest modules, which import it back: the analysis report types (`DeckStats`, `BracketScore`)
 * live in `analysis-types.ts`, the playtest state in `lib/playtest/engine.ts`.
 *
 * @module deck/types
 */

import type { DeckFormat } from "./formats";
import type { BracketLevel } from "@/lib/constants/brackets";
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
  /**
   * Row count, command zone included. The server's `_count` while the deck is
   * the listing stub; the rows held once loaded, kept in step by every edit
   * (`loaded-card-count.ts`). `isDeckStub` compares the two.
   */
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

/**
 * Core deck and card types: the deck, its cards, zones and categories, and the card search filters.
 *
 * Context: deck building; most of the app imports this file. It must not import analysis or
 * playtest modules, which import it back: the analysis report types (`DeckStats`, `BracketScore`)
 * live in `analysis-types.ts`, the playtest state in `lib/playtest/engine.ts`.
 *
 * The card categories and the commander pairing types are `as const` tuples: the unions here and
 * the request schemas in `lib/validation` derive from them, so the two cannot drift apart.
 *
 * @module deck/types
 */

import type { DeckFormat } from "./formats";
import type { BracketLevel } from "@/lib/constants/brackets";

/**
 * Every category a deck card can be filed under. `DeckCard.category` stores one as a plain
 * string, so renaming a value needs a data migration.
 *
 * - `commander` files the commander (CR 903.3) and, with a partner ability, the second commander
 *   (CR 702.124a); `companion` files the companion (CR 702.139a).
 * - `creature` to `land` are card types (CR 205.2a).
 * - `ramp` to `protection` are deck-building roles the app assigns; no rule defines them.
 * - `other` is what a card write gets when it names no category.
 */
export const CARD_CATEGORIES = [
  "commander",
  "companion",
  "creature",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
  "land",
  "ramp",
  "draw",
  "removal",
  "boardWipe",
  "winCondition",
  "protection",
  "other",
] as const;

/** A category a deck card is filed under: one of {@link CARD_CATEGORIES}. */
export type CardCategory = (typeof CARD_CATEGORIES)[number];
export type DeckZone = "main" | "sideboard" | "maybeboard";
export type { BracketLevel };

/**
 * One face of a two-faced card (CR 712.1), with its own name, mana cost, type line, rules text
 * and images. `DeckCard.cardFaces` holds the front face, then the back face.
 */
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
/**
 * Every way a deck can hold its commander: alone, or with a second commander under one partner
 * ability. `Deck.pairingType` stores one as a plain string, so renaming a value needs a data
 * migration. `pairing.ts` decides which value two cards use.
 *
 * - `none`: a single commander (CR 903.3).
 * - `partner`: "Partner" (CR 702.124h).
 * - `partner_with`: "Partner with [name]" (CR 702.124j).
 * - `friends_forever`, `character_select`, `father_son`, `survivors`: the four "partner—[text]"
 *   abilities (CR 702.124i).
 * - `background`: "Choose a Background" (CR 702.124k).
 * - `doctor`: "Doctor's companion" (CR 702.124m).
 */
export const PAIRING_TYPES = [
  "none",
  "partner",
  "partner_with",
  "friends_forever",
  "background",
  "doctor",
  "character_select",
  "father_son",
  "survivors",
] as const;

/** How a deck's second commander is allowed: one of {@link PAIRING_TYPES} (CR 702.124). */
export type CommanderPairingType = (typeof PAIRING_TYPES)[number];
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

/**
 * Stored deck rows to the rows the player statistics count (I-60 slice 2,
 * `docs/product/specs/i60-player-stats-and-year-in-review.md`).
 *
 * Deck analysis, pure. The stored cards go through the builder's own mapping
 * (`partitionApiCards`, `apiCardToDeckCard`), so the commanders, the main
 * deck and the bracket estimate read the same cards the builder holds.
 * Not responsible for: reading the database (`player-stats-read.ts`) or the
 * counting rules (`player-stats.ts`).
 *
 * @module deck/player-stats-rows
 */
import { parseBracketLevel, type BracketLevel } from "@/lib/constants/brackets";
import type { ApiDeckCard } from "@/lib/db/deck-api";
import { isDeckZone } from "./drop-targets";
import { explainBracket, type ComboData } from "./explain-bracket";
import { FORMAT_CONFIG, isDeckFormat, type DeckFormat } from "./formats";
import type { IdentityColor, PlayerStatsDeck } from "./player-stats";
import { computeDeckStats } from "./stats";
import {
  apiCardToDeckCard,
  createEmptyDeck,
  partitionApiCards,
} from "./store-factories";
import {
  CARD_CATEGORIES,
  PAIRING_TYPES,
  type CardCategory,
  type CommanderPairingType,
  type Deck,
  type DeckCard,
} from "./types";

/** The colours of Magic in the order cards print them (WUBRG). */
const IDENTITY_COLORS: readonly IdentityColor[] = ["W", "U", "B", "R", "G"];

/**
 * No Spellbook request is made per deck, so the two-card-combo floor stays
 * unchecked and every estimate is incomplete (I-77 4.3).
 */
const COMBOS_NOT_FETCHED: ComboData = { kind: "unavailable" };

/** The deck columns the statistics read. */
export interface StoredStatsDeck {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly targetBracket: number;
  readonly manualBracket: number | null;
  readonly pairingType: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A stored card row: every column the builder's mapping reads. */
export type StoredStatsCard = Omit<
  ApiDeckCard,
  "category" | "zone" | "colorIdentity"
> & {
  readonly category: string;
  readonly zone: string;
  readonly colorIdentity: readonly string[];
};

/** One stored deck with its cards and its snapshot dates. */
export interface StoredStatsDeckRows {
  readonly deck: StoredStatsDeck;
  readonly cards: readonly StoredStatsCard[];
  readonly snapshotDates: readonly Date[];
}

/**
 * Builds the row the counting reads from one stored deck.
 *
 * @param rows - the deck, its card rows and the dates of its snapshots
 * @returns the row, or null for a format this build does not know, which no
 *   statistic can place
 */
export function toPlayerStatsDeck(
  rows: StoredStatsDeckRows
): PlayerStatsDeck | null {
  const { deck: stored, cards, snapshotDates } = rows;
  if (!isDeckFormat(stored.format)) return null;
  const deck = toDeck(stored, stored.format, cards);
  const commanders = [deck.commander, deck.partner].filter(isCard);
  const mainCards = deck.cards.filter((card) => card.zone === "main");
  return {
    deckId: stored.id,
    format: stored.format,
    commanders: commanders.map((card) => card.name),
    colorIdentity: identityOf(commanders.length > 0 ? commanders : mainCards),
    computedBracket: computedBracketOf(deck),
    targetBracket: parseBracketLevel(stored.targetBracket),
    mainCards: mainCards.map(({ name, typeLine }) => ({ name, typeLine })),
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    snapshotDates,
  };
}

/** The stored deck as the builder holds it, command zone read out of the rows. */
function toDeck(
  stored: StoredStatsDeck,
  format: DeckFormat,
  cards: readonly StoredStatsCard[]
): Deck {
  const { commanderCard, partnerCard, companionCard, deckCards } =
    partitionApiCards(cards.map(toApiCard));
  return {
    ...createEmptyDeck(stored.id, stored.name, format),
    commander: commanderCard && apiCardToDeckCard(commanderCard),
    partner: partnerCard && apiCardToDeckCard(partnerCard),
    companion: companionCard && apiCardToDeckCard(companionCard),
    pairingType: pairingTypeOf(stored.pairingType),
    cards: deckCards.map(apiCardToDeckCard),
    targetBracket: parseBracketLevel(stored.targetBracket) ?? 3,
    manualBracket: parseBracketLevel(stored.manualBracket),
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

/** A stored row as the deck API sends it; an unknown category or zone reads as the column default. */
function toApiCard(row: StoredStatsCard): ApiDeckCard {
  return {
    ...row,
    category: categoryOf(row.category),
    zone: isDeckZone(row.zone) ? row.zone : "main",
    colorIdentity: [...row.colorIdentity],
  };
}

/** A stored category, or `other` as a card write names none. */
function categoryOf(stored: string): CardCategory {
  return CARD_CATEGORIES.find((category) => category === stored) ?? "other";
}

/** A stored pairing, or `none` (a single commander) for an unknown value. */
function pairingTypeOf(stored: string): CommanderPairingType {
  return PAIRING_TYPES.find((pairing) => pairing === stored) ?? "none";
}

/** Whether a command-zone slot holds a card. */
function isCard(card: DeckCard | null): card is DeckCard {
  return card !== null;
}

/**
 * The union of the cards' colour identities, in WUBRG order. CR 903.4: the
 * commanders' identity bounds a Commander deck, so it comes from them, else
 * from the main deck (I-60 3.3).
 */
function identityOf(cards: readonly DeckCard[]): readonly IdentityColor[] {
  const present = new Set(cards.flatMap((card) => card.colorIdentity));
  return IDENTITY_COLORS.filter((color) => present.has(color));
}

/**
 * The bracket estimate of a deck in a format with bracket scoring, from the
 * official floors and the heuristic, without combo data.
 */
function computedBracketOf(deck: Deck): BracketLevel | null {
  if (!FORMAT_CONFIG[deck.format].hasBracketScoring) return null;
  const assessment = explainBracket({
    deck,
    stats: computeDeckStats(deck),
    comboData: COMBOS_NOT_FETCHED,
  });
  return assessment?.estimate ?? null;
}

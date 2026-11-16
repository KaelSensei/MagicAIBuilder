/**
 * Theme coverage: how many of a deck's cards are on the theme its owner
 * named, and which are not.
 *
 * Deck analysis, I-102 slice 1, requirement 3.1. Coverage is a count, never
 * a grade (requirement 1.3), and it changes no other reading of the deck:
 * not legality, not the bracket estimate (requirement 1.4).
 * Not responsible for: matching one card (`matchTheme` in `theme-match.ts`),
 * the panel that shows the count (slice 3) or storing the theme (slice 2).
 * No AI client is reachable from here.
 *
 * @module deck/theme-coverage
 */

import { matchTheme, type DeckTheme, type ThemeMatch } from "./theme-match";
import type { CardCategory, Deck, DeckCard } from "./types";
import { isBasicLand } from "@/lib/scryfall/type-line";

/** One counted card's verdict, as the panel lists it. */
export interface CardThemeMatch extends ThemeMatch {
  readonly cardName: string;
  readonly quantity: number;
  /** The commander or its partner, shown first (requirement 2.4) */
  readonly commandZone: boolean;
}

/**
 * An off-theme card and what it does in the deck: the category the deck
 * stores for it, until I-76's slot roles exist (requirement 3.1).
 */
export interface OffThemeCard {
  readonly cardName: string;
  readonly category: CardCategory;
}

/** A deck's coverage of its owner's theme. */
export interface ThemeCoverage {
  /** Copies of cards on theme */
  readonly onTheme: number;
  /** Copies of cards counted */
  readonly denominator: number;
  /** Every counted card's verdict, the command zone first */
  readonly cards: readonly CardThemeMatch[];
  readonly offTheme: readonly OffThemeCard[];
}

/** The parts of a deck coverage reads. */
export type ThemeCoverageDeck = Pick<Deck, "commander" | "partner" | "cards">;

/** A card counted toward coverage, and whether it is in the command zone. */
interface CountedCard {
  readonly card: DeckCard;
  readonly commandZone: boolean;
}

/**
 * Whether a deck row counts toward coverage: only main-deck rows do. The
 * Sideboard and Considering boards are not counted (requirement 2.4). Basic
 * lands (CR 205.4c) are left out unless the owner counts them, because a
 * basic meets no handle but a first letter and would swamp the count
 * (requirement 2.3).
 *
 * @param card - a row of `Deck.cards`
 * @param countBasics - the owner's switch
 */
function isCounted(card: DeckCard, countBasics: boolean): boolean {
  return (
    card.zone === "main" && (countBasics || !isBasicLand(card.typeLine))
  );
}

/**
 * Orders deck rows by name, then by row id for two printings of one card,
 * comparing code units so the order never depends on the runtime's locale.
 * Coverage of the same cards is then the same whatever their input order
 * (requirement 3.3).
 *
 * @param a - one deck row
 * @param b - another deck row
 */
function byNameThenId(a: DeckCard, b: DeckCard): number {
  if (a.name !== b.name) {
    return a.name < b.name ? -1 : 1;
  }
  if (a.id === b.id) {
    return 0;
  }
  return a.id < b.id ? -1 : 1;
}

/**
 * The cards coverage counts: the commander and its partner first, then the
 * main deck by name. `Deck.cards` never holds the command zone.
 *
 * @param deck - the deck measured
 * @param countBasics - the owner's switch for basic lands
 */
function countedCards(
  deck: ThemeCoverageDeck,
  countBasics: boolean
): readonly CountedCard[] {
  const commandZone = [deck.commander, deck.partner].flatMap((card) =>
    card ? [{ card, commandZone: true }] : []
  );
  const mainDeck = deck.cards
    .filter((card) => isCounted(card, countBasics))
    .toSorted(byNameThenId)
    .map((card) => ({ card, commandZone: false }));
  return [...commandZone, ...mainDeck];
}

/**
 * Counts how many of a deck's cards are on the owner's theme.
 *
 * @param deck - the deck measured
 * @param theme - the owner's handles and how many must hold
 * @returns the on-theme count, the cards counted, each card's verdict and
 *   the off-theme cards
 */
export function themeCoverage(
  deck: ThemeCoverageDeck,
  theme: DeckTheme
): ThemeCoverage {
  let onTheme = 0;
  let denominator = 0;
  const cards: CardThemeMatch[] = [];
  const offTheme: OffThemeCard[] = [];
  const counted = countedCards(deck, theme.countBasics ?? false);
  for (const { card, commandZone } of counted) {
    const verdict = matchTheme(card, theme);
    cards.push({
      cardName: card.name,
      quantity: card.quantity,
      commandZone,
      ...verdict,
    });
    denominator += card.quantity;
    if (verdict.onTheme) {
      onTheme += card.quantity;
    } else {
      offTheme.push({ cardName: card.name, category: card.category });
    }
  }
  return { onTheme, denominator, cards, offTheme };
}

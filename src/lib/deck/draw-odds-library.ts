/**
 * Draw-odds library count: the deck side of a draw-odds question, read from a
 * deck: how many cards its library holds, how many of them are a hit, and
 * which cards a question can name.
 *
 * Deck analysis, I-97. The library is what the deck becomes when the game
 * begins (CR 401.1), so only main-deck cards count:
 * - the commander, and a partner with it, start in the command zone and the
 *   rest of the deck becomes the library (CR 903.6): 99 cards, or 98;
 * - a companion starts outside the game (CR 702.139a), and Sideboard cards
 *   (CR 100.4) and Considering cards are not in the deck at all.
 * `Deck.cards` never holds the command zone or the companion, so the count
 * reads the main-zone rows of `cards`.
 * Not responsible for: the formula (`chanceOfAtLeast` in `draw-odds.ts`), the
 * number of cards drawn by a given turn (`cardsDrawnBy` in `cards-drawn.ts`),
 * or the panel that asks (`components/deck/DrawOddsPanel.tsx`).
 *
 * @module deck/draw-odds-library
 */

import type { DrawOddsQuestion } from "./draw-odds";
import type { Deck, DeckCard } from "./types";

/**
 * What a draw-odds question counts as a hit:
 * - `lands`: every land, for "three or more lands";
 * - `card`: the copies of one card, by its name as the deck lists it, so the
 *   copies of every printing count together.
 */
export type DrawOddsTarget =
  { readonly kind: "lands" } | { readonly kind: "card"; readonly name: string };

/** The library and its matching cards, as a draw-odds question takes them. */
export type LibraryCount = Pick<DrawOddsQuestion, "librarySize" | "matching">;

/**
 * Whether a deck row is in the library: only main-deck rows are. Sideboard and
 * Considering rows are not in the deck at all, and `Deck.cards` never holds the
 * command zone or the companion (see the module header).
 *
 * @param card - a row of `Deck.cards`
 */
function isInLibrary(card: DeckCard): boolean {
  return card.zone === "main";
}

/**
 * Whether a library card is a hit for the question.
 *
 * @param card - a card in the library
 * @param target - what counts as a hit
 */
function isHit(card: DeckCard, target: DrawOddsTarget): boolean {
  switch (target.kind) {
    case "lands":
      return card.category === "land";
    case "card":
      return card.name === target.name;
  }
  const _exhaustive: never = target;
  return _exhaustive;
}

/**
 * Counts a deck's library and the cards in it that the question counts as a
 * hit, ready for `chanceOfAtLeast` with the cards drawn and the minimum.
 *
 * Lands are the cards filed under the "land" category, as `DeckStats.lands`
 * counts them, so the panel and the deck stats show the same land count. A
 * chosen card counts its quantity in the library only: a card held in
 * Considering, the Sideboard or the command zone matches zero copies, and the
 * chance of drawing it is a known zero.
 *
 * @example
 * // A commander and 99 main-deck cards, 36 of them lands:
 * countLibrary(deck, { kind: "lands" }); // → { librarySize: 99, matching: 36 }
 *
 * @param deck - the deck asked about; only its cards are read
 * @param target - what counts as a hit
 * @returns the library size and the matching cards, counting quantities;
 *   both zero for a deck with no main-deck card, which `chanceOfAtLeast`
 *   names as an empty library
 */
export function countLibrary(
  deck: Pick<Deck, "cards">,
  target: DrawOddsTarget
): LibraryCount {
  let librarySize = 0;
  let matching = 0;
  for (const card of deck.cards) {
    if (!isInLibrary(card)) continue;
    librarySize += card.quantity;
    if (isHit(card, target)) matching += card.quantity;
  }
  return { librarySize, matching };
}

/**
 * The cards a draw-odds question can ask about by name: every card in the
 * library, once, in alphabetical order. A card in several rows, such as two
 * printings, is named once, as `countLibrary` counts its copies together.
 *
 * @example
 * // Sol Ring, 36 Forests in two printings, Arcane Signet, a Sideboard card:
 * libraryCardNames(deck); // → ["Arcane Signet", "Forest", "Sol Ring"]
 *
 * @param deck - the deck asked about; only its cards are read
 * @returns the distinct names of the library's cards; empty for a deck with
 *   no main-deck card
 */
export function libraryCardNames(deck: Pick<Deck, "cards">): readonly string[] {
  const names = new Set<string>();
  for (const card of deck.cards) {
    if (isInLibrary(card)) names.add(card.name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

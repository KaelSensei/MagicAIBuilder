/**
 * A deck's count by card type, as the builder's summary bar shows it: each card counted once,
 * under one type, so the counts add up to the deck's card count.
 *
 * Deck-building context, pure. The rows counted are the ones `countDeckCards` counts (main deck,
 * commander, partner); the type is read from the card's front face through Deck Lab's face
 * reader (`facesOf`, `hasCardType`).
 *
 * @module deck/deck-type-counts
 */
import { facesOf, hasCardType } from "@/lib/deck-lab/card-faces";
import type { Deck, DeckCard } from "./types";

/** The type group a card counts under: one of the card types it shows, or "other". */
export type CardTypeGroup =
  | "creature"
  | "land"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "planeswalker"
  | "battle"
  | "other";

/** How many cards of a deck count under one type group. */
export interface CardTypeCount {
  readonly type: CardTypeGroup;
  readonly count: number;
}

/**
 * Which type wins when a card has several, with the CR 205.2a type word each group reads. A land
 * comes first, so Dryad Arbor and an artifact land count as lands; a creature next, so an artifact
 * or enchantment creature counts as a creature. A kindred instant is an instant: "Kindred" is not
 * in the list.
 */
const PRECEDENCE: readonly (readonly [CardTypeGroup, string])[] = [
  ["land", "Land"],
  ["creature", "Creature"],
  ["planeswalker", "Planeswalker"],
  ["battle", "Battle"],
  ["artifact", "Artifact"],
  ["enchantment", "Enchantment"],
  ["instant", "Instant"],
  ["sorcery", "Sorcery"],
];

/** The order the counts are shown in: the spells a player cuts most first, "other" last. */
const DISPLAY_ORDER: readonly CardTypeGroup[] = [
  "creature",
  "land",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
  "battle",
  "other",
];

/**
 * The type group a card counts under. Only the front face is read: outside the battlefield and
 * the stack a double-faced card has only its front face's characteristics (CR 712.8a).
 *
 * @param card - a deck card, with or without `cardFaces`
 * @returns the first of Land, Creature, Planeswalker, Battle, Artifact, Enchantment, Instant and
 *   Sorcery its front face has (CR 205.2a), or "other" when it has none of them
 */
export function primaryCardType(card: DeckCard): CardTypeGroup {
  const { front } = facesOf(card);
  const match = PRECEDENCE.find(([, cardType]) => hasCardType(front, cardType));
  return match ? match[0] : "other";
}

/**
 * Counts a deck's cards by type group: every copy in the main deck, plus the commander and the
 * partner (CR 903.5a), the rows `countDeckCards` counts. The sideboard, the maybeboard and a
 * companion stay out, so the counts add up to the deck's card count.
 *
 * @param deck - the deck's rows as the store holds them
 * @returns the non-zero counts, creatures first and "other" last
 */
export function countDeckCardTypes(
  deck: Pick<Deck, "cards" | "commander" | "partner">
): readonly CardTypeCount[] {
  const counts = new Map<CardTypeGroup, number>();
  const tally = (card: DeckCard, copies: number): void => {
    const type = primaryCardType(card);
    counts.set(type, (counts.get(type) ?? 0) + copies);
  };
  if (deck.commander) tally(deck.commander, 1);
  if (deck.partner) tally(deck.partner, 1);
  for (const card of deck.cards) {
    if (card.zone === "main") tally(card, card.quantity);
  }
  return DISPLAY_ORDER.flatMap((type) => {
    const count = counts.get(type) ?? 0;
    return count > 0 ? [{ type, count }] : [];
  });
}
